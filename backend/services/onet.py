from __future__ import annotations
from typing import Dict, List, Tuple
import os
import httpx


class OnetService:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.base_url = "https://services.onetcenter.org"

    def _headers(self) -> dict:
        key = self.api_key or ""
        return {"Authorization": f"Bearer {key}"} if key else {}

    def recommend(self, subscores: Dict[str, float]) -> Tuple[List[dict], List[str]]:
        # Simple, local heuristic mapping to O*NET occupations; if API key is available, attempt enrichment
        logic = subscores.get("logic", 0)
        creativity = subscores.get("creativity", 0)
        teamwork = subscores.get("teamwork", 0)
        empathy = subscores.get("empathy", 0)
        communication = subscores.get("communication", 0)

        # weighted composites
        analytical = 0.6 * logic + 0.4 * communication
        people = 0.5 * empathy + 0.5 * communication
        creative = 0.7 * creativity + 0.3 * communication

        candidates = [
            {
                "title": "UX/UI Designer",
                "category": "Design & Creative",
                "score": 0.6 * creative + 0.2 * people + 0.2 * analytical,
                "onet_code": "15-1255.01",  # Web and Digital Interface Designers
            },
            {
                "title": "Product Manager",
                "category": "Business & Management",
                "score": 0.4 * analytical + 0.4 * people + 0.2 * creative,
                "onet_code": "11-2021.00",
            },
            {
                "title": "Data Analyst",
                "category": "Technology & Analytics",
                "score": 0.7 * analytical + 0.2 * people + 0.1 * creative,
                "onet_code": "15-2051.00",
            },
            {
                "title": "Community Manager",
                "category": "Marketing & Communications",
                "score": 0.2 * analytical + 0.6 * people + 0.2 * creative,
                "onet_code": "11-2033.00",
            },
        ]

        # Normalize to 0-100 and pick top 3
        if candidates:
            max_score = max(c["score"] for c in candidates) or 1.0
        else:
            max_score = 1.0
        ranked = sorted(candidates, key=lambda c: c["score"], reverse=True)[:3]
        careers = [
            {
                "title": r["title"],
                "match": int(round(100 * (r["score"] / max_score))),
                "description": f"Match to {r['title']} based on your profile (code {r['onet_code']}).",
                "category": r["category"],
            }
            for r in ranked
        ]

        majors = self._map_majors(analytical, people, creative)

        # Optional: If an API key exists, we could fetch occupation details to enrich descriptions.
        # Keep requests minimal to avoid latency.
        if self.api_key:
            try:
                with httpx.Client(timeout=3.5) as client:
                    for i, r in enumerate(ranked):
                        resp = client.get(
                            f"{self.base_url}/ws/online/occupations/{r['onet_code']}",
                            headers=self._headers(),
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            summary = (data.get("description") or "").strip()
                            if summary:
                                careers[i]["description"] = summary[:180] + ("…" if len(summary) > 180 else "")
            except Exception:
                pass

        return careers, majors

    def _map_majors(self, analytical: float, people: float, creative: float) -> List[str]:
        majors: List[str] = []
        if creative >= analytical and creative >= people:
            majors.extend([
                "Human-Computer Interaction",
                "Digital Media Design",
                "Psychology with Design Thinking",
            ])
        if analytical >= people:
            majors.extend([
                "Information Systems",
                "Data Science",
                "Industrial Engineering",
            ])
        if people >= analytical:
            majors.extend([
                "Business Administration",
                "Communications",
            ])
        # Deduplicate while preserving order
        seen = set()
        ordered = []
        for m in majors:
            if m not in seen:
                seen.add(m)
                ordered.append(m)
        return ordered[:4]


