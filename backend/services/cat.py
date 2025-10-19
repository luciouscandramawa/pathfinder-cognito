from __future__ import annotations
from typing import Dict, Optional, Tuple, Any, List, Literal
import uuid
import math


ItemType = Literal["mcq", "text", "video"]


class CatItem(dict):
    # convenience dictionary subclass to serialize directly
    id: str
    type: ItemType
    question: str
    options: Optional[List[str]]
    difficulty: Optional[float]


class CatService:
    def __init__(self) -> None:
        # in-memory sessions; replace with persistent store in production
        self.sessions: Dict[str, Dict[str, Any]] = {}

        # Simple item banks with difficulty parameters (b). Career focuses on soft skills; Academic mixes logic/text
        self.item_bank: Dict[str, List[CatItem]] = {
            "career": [
                CatItem(
                    id="c1",
                    type="mcq",
                    question=(
                        "A teammate is struggling to meet a deadline. What would you do?"
                    ),
                    options=[
                        "Offer to help with specific tasks",
                        "Notify the team leader",
                        "Wait to see if they can handle it",
                        "Provide time management advice",
                    ],
                    difficulty=-1.0,
                ),
                CatItem(
                    id="c2",
                    type="mcq",
                    question=(
                        "During a virtual meeting, someone's idea is ignored. How do you respond?"
                    ),
                    options=[
                        "Acknowledge and invite feedback",
                        "Move discussion forward",
                        "Support privately after",
                        "Stay quiet to avoid conflict",
                    ],
                    difficulty=0.0,
                ),
                CatItem(
                    id="c3",
                    type="video",
                    question=(
                        "Describe a time you balanced team needs and client goals."
                    ),
                    options=None,
                    difficulty=0.5,
                ),
            ],
            "academic": [
                CatItem(
                    id="a1",
                    type="mcq",
                    question=(
                        "In a forest ecosystem, fox population drops. What follows logically?"
                    ),
                    options=[
                        "Rabbit population likely increases",
                        "Plant population will decrease",
                        "Owl population will increase",
                        "No significant changes",
                    ],
                    difficulty=-0.5,
                ),
                CatItem(
                    id="a2",
                    type="text",
                    question=(
                        "Creative Thinking: Suggest engaging ways to teach recycling to teens."
                    ),
                    options=None,
                    difficulty=0.0,
                ),
                CatItem(
                    id="a3",
                    type="text",
                    question=(
                        "Problem Solving: Describe your approach to a novel problem."
                    ),
                    options=None,
                    difficulty=0.8,
                ),
            ],
        }

    def start_session(self) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "theta": {"career": 0.0, "academic": 0.0},
            "answered": {"career": set(), "academic": set()},
            "subscores": {"teamwork": 0.0, "empathy": 0.0, "communication": 0.0, "logic": 0.0, "creativity": 0.0},
        }
        return session_id

    def select_next_item(self, session_id: str, block: str) -> Optional[CatItem]:
        sess = self.sessions.get(session_id)
        if not sess:
            return None
        theta = sess["theta"][block]
        answered = sess["answered"][block]

        # information-targeting: choose item whose difficulty b is closest to theta among not-yet-answered
        candidates = [i for i in self.item_bank[block] if i["id"] not in answered]
        if not candidates:
            return None
        best = min(candidates, key=lambda i: abs((i.get("difficulty") or 0.0) - theta))
        return best

    def _rasch_probability(self, theta: float, b: float) -> float:
        # logistic 1PL Rasch model
        return 1.0 / (1.0 + math.exp(-(theta - b)))

    def submit_response(
        self, session_id: str, block: str, item_id: str, response: Dict[str, Any]
    ) -> Tuple[float, Optional[str]]:
        sess = self.sessions.get(session_id)
        if not sess:
            raise ValueError("invalid session")
        answered: set[str] = sess["answered"][block]
        if item_id in answered:
            return sess["theta"][block], None

        answered.add(item_id)
        item = next((i for i in self.item_bank[block] if i["id"] == item_id), None)
        if not item:
            return sess["theta"][block], None

        theta = sess["theta"][block]
        b = item.get("difficulty") or 0.0

        # Score extraction based on item type
        score = 0.0
        if item["type"] == "mcq":
            # heuristic correctness: treat option index 0 as most prosocial/"correct"
            chosen: str = response.get("answer", "")
            options = item.get("options") or []
            score = 1.0 if (options and chosen and chosen == options[0]) else 0.0
        elif item["type"] == "text":
            text = (response.get("answer") or "").strip()
            score = min(1.0, max(0.0, len(text) / 120.0))  # longer -> higher credit
        elif item["type"] == "video":
            sentiment = response.get("sentiment") or []
            positive = next((s for s in sentiment if str(s.get("label", "")).upper().startswith("POS")), None)
            score = positive.get("score", 0.0) if positive else 0.2

        # simple Bayesian update with fixed discrimination and prior variance
        # gradient step toward MLE for Rasch using one observation
        p = self._rasch_probability(theta, b)
        # learning rate scales information; clamp for stability
        lr = 0.8
        theta_updated = float(theta + lr * (score - p))
        sess["theta"][block] = theta_updated

        # map to subscores for downstream recs (very simple mapping)
        if block == "career":
            sess["subscores"]["teamwork"] += 1.5 * score
            sess["subscores"]["empathy"] += 1.2 * score
            sess["subscores"]["communication"] += 1.3 * score
        else:
            # academic
            if item["type"] == "mcq":
                sess["subscores"]["logic"] += 1.8 * score
            else:
                sess["subscores"]["creativity"] += 1.6 * score

        # Adaptive routing rule for academic: if theta high early, skip easiest remaining
        next_block: Optional[str] = None
        if block == "academic":
            if theta_updated > 0.8 and any(i["id"] == "a1" for i in self.item_bank["academic"] if i["id"] not in answered):
                # mark easiest as completed implicitly
                answered.add("a1")
        return theta_updated, next_block

    def finalize(self, session_id: str) -> Dict[str, float]:
        sess = self.sessions.get(session_id)
        if not sess:
            return {"teamwork": 0, "empathy": 0, "communication": 0, "logic": 0, "creativity": 0}
        # Normalize roughly to 0-10 range
        subs = sess["subscores"].copy()
        for k in subs:
            subs[k] = round(max(0.0, min(10.0, subs[k])), 2)
        return subs


