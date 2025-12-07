from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..main import get_db
from ..models import User, UserCreate, UserPublic, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# Use bcrypt_sha256 to avoid the 72-byte password limit and ensure consistent hashing
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# In a real app, use a strong random secret and store in env. For demo purposes:
JWT_SECRET = "CHANGE_ME_SUPER_SECRET"
JWT_ALG = "HS256"
JWT_EXP_MIN = 60 * 24


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


async def get_users_collection(db: AsyncIOMotorDatabase):
    return db["users"]


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    users = await get_users_collection(db)
    existing = await users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "name": payload.name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "created_at": datetime.utcnow(),
    }
    result = await users.insert_one(doc)
    created = await users.find_one({"_id": result.inserted_id})
    # Convert ObjectId to str for API
    created["_id"] = str(created["_id"]) if created and "_id" in created else None
    return UserPublic(**created)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    users = await get_users_collection(db)
    user = await users.find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Issue JWT
    now = datetime.utcnow()
    exp = now + timedelta(minutes=JWT_EXP_MIN)
    token = jwt.encode({"sub": str(user["_id"]), "exp": exp}, JWT_SECRET, algorithm=JWT_ALG)
    return TokenResponse(access_token=token)
