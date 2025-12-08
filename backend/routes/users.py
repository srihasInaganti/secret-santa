import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from main import get_db
from models import User, UserCreate, Group

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[User])
async def list_users(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all users"""
    users_col = db["users"]
    items = []
    async for u in users_col.find():
        u["_id"] = str(u["_id"])
        items.append(User(**u))
    return items


@router.post("/", response_model=User)
async def create_user(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create a new user"""
    users_col = db["users"]

    # Check if name already taken
    existing = await users_col.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="Name already taken")

    doc = {
        "name": payload.name,
        "created_at": datetime.utcnow(),
    }
    res = await users_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return User(**doc)


@router.get("/login/{name}", response_model=User)
async def login(name: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login - get user by name"""
    users_col = db["users"]
    user = await users_col.find_one({"name": name})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return User(**user)


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user by ID"""
    users_col = db["users"]
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return User(**user)


@router.get("/{user_id}/groups", response_model=List[Group])
async def get_user_groups(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all groups a user belongs to"""
    members_col = db["group_members"]
    groups_col = db["groups"]

    memberships = members_col.find({"user_id": user_id})

    groups = []
    async for m in memberships:
        group = await groups_col.find_one({"_id": ObjectId(m["group_id"])})
        if group:
            group["_id"] = str(group["_id"])
            groups.append(Group(**group))

    return groups