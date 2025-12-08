from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..main import get_db
from .auth import get_current_user
from ..models import DeedTemplate, UserPublic

router = APIRouter(prefix="/deed-templates", tags=["deeds"]) 


async def get_deed_templates_collection(db: AsyncIOMotorDatabase):
    return db["deed_templates"]


@router.get("/", response_model=List[DeedTemplate])
async def list_templates(db: AsyncIOMotorDatabase = Depends(get_db)):
    col = await get_deed_templates_collection(db)
    items = []
    async for d in col.find({"active": True}).sort("created_at", 1):
        d["_id"] = str(d["_id"]) if "_id" in d else None
        items.append(DeedTemplate(**d))
    return items


@router.post("/", response_model=DeedTemplate)
async def create_template(template: DeedTemplate, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    # For now: any authenticated user can add templates; tighten later if needed
    col = await get_deed_templates_collection(db)
    doc = {
        "title": template.title,
        "description": template.description,
        "active": template.active if template.active is not None else True,
        "created_at": datetime.utcnow(),
    }
    res = await col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return DeedTemplate(**doc)
