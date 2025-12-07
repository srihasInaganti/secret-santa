from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Any, Optional
import os
from dotenv import load_dotenv
from bson import ObjectId
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone

load_dotenv()  

app = FastAPI()
MONGO_DETAILS = os.getenv("MONGO_DETAILS")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

client = AsyncIOMotorClient(MONGO_DETAILS) if MONGO_DETAILS else AsyncIOMotorClient()

database = client.testdb
user_collection = database.get_collection("users")
deed_collection = database.get_collection("deeds")
session_collection = database.get_collection("sessions")

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Helper to convert string to ObjectId
def PyObjectId(v: Any) -> ObjectId:
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    name: str
    email: str
    hashed_password: Optional[str] = None
    class Config:
        json_encoders = {ObjectId: str}

class UserPublic(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class Deed(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    description: str

    class Config:
        json_encoders = {ObjectId: str}

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    name: str
    participants: List[str] = Field(default_factory=list)  # List of user emails

    class Config:
        json_encoders = {ObjectId: str}


@app.on_event("startup")
async def startup_db_client():
    try:
        client.admin.command('ping')
        print("Successfully connected to MongoDB.")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Secret Santa API"}

# Auth helpers
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await user_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

# Auth endpoints
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

@app.post("/auth/signup", response_model=UserPublic)
async def signup(req: SignupRequest):
    existing = await user_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "_id": str(ObjectId()),
        "name": req.name,
        "email": req.email,
        "hashed_password": get_password_hash(req.password),
    }
    await user_collection.insert_one(doc)
    return doc

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await user_collection.find_one({"email": form_data.username})
    if not user or not user.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Example protected route
@app.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# User endpoints (admin/list)
@app.get("/users/", response_model=List[UserPublic])
async def list_users():
    users = await user_collection.find({}, {"hashed_password": 0}).to_list(1000)
    return users

# Deed endpoints
@app.post("/deeds/", response_model=Deed)
async def create_deed(deed: Deed):
    deed_dict = deed.dict(by_alias=True)
    await deed_collection.insert_one(deed_dict)
    return deed

@app.get("/deeds/", response_model=List[Deed])
async def list_deeds():
    deeds = await deed_collection.find().to_list(1000)
    return deeds

# Session endpoints
@app.post("/sessions/", response_model=Session)
async def create_session(session: Session):
    session_dict = session.dict(by_alias=True)
    await session_collection.insert_one(session_dict)
    return session

@app.get("/sessions/", response_model=List[Session])
async def list_sessions():
    sessions = await session_collection.find().to_list(1000)
    return sessions

@app.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str):
    session = await session_collection.find_one({"_id": ObjectId(session_id)})
    if session:
        return session
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/sessions/{session_id}/participants", response_model=Session)
async def add_participant_to_session(session_id: str, user_email: str):
    await session_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$addToSet": {"participants": user_email}}
    )
    session = await session_collection.find_one({"_id": ObjectId(session_id)})
    if session:
        return session
    raise HTTPException(status_code=404, detail="Session not found")
