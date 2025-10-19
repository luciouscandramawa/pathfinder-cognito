from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any
import os
from dotenv import load_dotenv

from .services.cat import CatService
from .services.onet import OnetService


load_dotenv()

app = FastAPI(title="Pathfinder Cognito API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StartSessionRequest(BaseModel):
    user_id: Optional[str] = None


class StartSessionResponse(BaseModel):
    session_id: str


class NextItemRequest(BaseModel):
    session_id: str
    block: Literal["career", "academic"]


class Item(BaseModel):
    id: str
    type: Literal["mcq", "text", "video"]
    question: str
    options: Optional[List[str]] = None
    difficulty: Optional[float] = None


class NextItemResponse(BaseModel):
    item: Item


class SubmitRequest(BaseModel):
    session_id: str
    block: Literal["career", "academic"]
    item_id: str
    response: Dict[str, Any]


class SubmitResponse(BaseModel):
    updated_theta: float
    next_recommended_block: Optional[Literal["career", "academic", "cognitive", "complete"]] = None


class FinalizeRequest(BaseModel):
    session_id: str


class FinalizeResponse(BaseModel):
    subscores: Dict[str, float]


class RecommendationRequest(BaseModel):
    subscores: Dict[str, float]


class Recommendation(BaseModel):
    title: str
    match: int
    description: str
    category: str


class RecommendationResponse(BaseModel):
    careers: List[Recommendation]
    majors: List[str]


cat_service = CatService()
onet_service = OnetService(api_key=os.getenv("ONET_API_KEY", ""))


@app.post("/api/session/start", response_model=StartSessionResponse)
def start_session(_: StartSessionRequest):
    session_id = cat_service.start_session()
    return StartSessionResponse(session_id=session_id)


@app.post("/api/cat/next", response_model=NextItemResponse)
def next_item(req: NextItemRequest):
    item = cat_service.select_next_item(req.session_id, req.block)
    if item is None:
        raise HTTPException(status_code=404, detail="No items available")
    return NextItemResponse(item=item)


@app.post("/api/cat/submit", response_model=SubmitResponse)
def submit_response(req: SubmitRequest):
    updated_theta, next_block = cat_service.submit_response(
        req.session_id, req.block, req.item_id, req.response
    )
    return SubmitResponse(updated_theta=updated_theta, next_recommended_block=next_block)


@app.post("/api/assessment/finalize", response_model=FinalizeResponse)
def finalize(req: FinalizeRequest):
    subscores = cat_service.finalize(req.session_id)
    return FinalizeResponse(subscores=subscores)


@app.post("/api/recommendations", response_model=RecommendationResponse)
def recommendations(req: RecommendationRequest):
    careers, majors = onet_service.recommend(req.subscores)
    return RecommendationResponse(careers=careers, majors=majors)


