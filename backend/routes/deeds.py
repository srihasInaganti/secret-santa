import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from main import get_db
from models import DeedTemplate, DeedTemplateCreate

router = APIRouter(prefix="/deeds", tags=["deeds"])


@router.get("/templates", response_model=List[DeedTemplate])
async def list_deed_templates(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all deed templates"""
    templates_col = db["deed_templates"]
    items = []
    async for t in templates_col.find():
        t["_id"] = str(t["_id"])
        items.append(DeedTemplate(**t))
    return items


@router.post("/templates", response_model=DeedTemplate)
async def create_deed_template(payload: DeedTemplateCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Add a new deed template to the pool"""
    templates_col = db["deed_templates"]

    doc = {
        "description": payload.description,
        "created_at": datetime.utcnow(),
    }
    res = await templates_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return DeedTemplate(**doc)


@router.delete("/templates/{template_id}")
async def delete_deed_template(template_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Delete a deed template"""
    templates_col = db["deed_templates"]

    result = await templates_col.delete_one({"_id": ObjectId(template_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"deleted": True}


@router.get("/random", response_model=DeedTemplate)
async def get_random_deed(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get a random deed from the pool"""
    templates_col = db["deed_templates"]

    templates = []
    async for t in templates_col.find():
        t["_id"] = str(t["_id"])
        templates.append(DeedTemplate(**t))

    if not templates:
        raise HTTPException(status_code=404, detail="No deed templates found. Please seed the database first.")

    return random.choice(templates)


@router.post("/seed")
async def seed_deed_templates(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Seed the database with default deed templates - use {target} as placeholder"""
    templates_col = db["deed_templates"]

    default_deeds = [
        "Give {target} a genuine compliment",
        "Buy {target} their favorite drink or snack",
        "Write a thank you note to {target}",
        "Help {target} with a task without being asked",
        "Send {target} an encouraging message",
        "Tell {target} why you appreciate them",
        "Offer to grab lunch for {target}",
        "Give {target} a small surprise gift",
        "Share a positive memory you have with {target}",
        "Do one of {target}'s chores or tasks for them",
        "Leave a kind sticky note for {target}",
        "Make {target} laugh today",
        "Ask {target} how their day is going and really listen",
        "Compliment {target}'s work in front of others",
        "Bring {target}'s favorite treat to share",
    ]

    count = 0
    for deed in default_deeds:
        existing = await templates_col.find_one({"description": deed})
        if not existing:
            await templates_col.insert_one({
                "description": deed,
                "created_at": datetime.utcnow(),
            })
            count += 1

    return {"seeded": count, "message": f"Added {count} new deed templates"}