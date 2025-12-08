import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from main import get_db
from models import User, UserCreate

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=User)
async def create_user(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create a new user"""
    users_col = db["users"]

    # Check if username exists
    existing = await users_col.find_one({"username": payload.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    doc = {
        "username": payload.username,
        "name": payload.name,
        "created_at": datetime.utcnow(),
    }
    res = await users_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return User(**doc)


@router.get("/", response_model=List[User])
async def list_users(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all users"""
    users_col = db["users"]
    items = []
    async for u in users_col.find():
        u["_id"] = str(u["_id"])
        items.append(User(**u))
    return items


@router.get("/{username}", response_model=User)
async def get_user(username: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login - get user by username"""
    users_col = db["users"]
    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return User(**user)


@router.get("/{username}/groups", response_model=List)
async def get_user_groups(username: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all groups a user belongs to"""
    users_col = db["users"]
    members_col = db["group_members"]
    groups_col = db["groups"]

    # Get user
    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(user["_id"])

    # Get group memberships
    memberships = members_col.find({"user_id": user_id})

    groups = []
    async for m in memberships:
        group = await groups_col.find_one({"_id": __import__("bson").ObjectId(m["group_id"])})
        if group:
            group["_id"] = str(group["_id"])
            groups.append(group)

    return groups