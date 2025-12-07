from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# Mongo uses _id as ObjectId; we'll store as str in API I/O for simplicity.
class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoodDeed(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    round_id: Optional[str] = None
    target_user_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class Session(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


# Secret Santa Round domain
class Round(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    owner_user_id: str
    access_code: str
    status: str = "pending"  # pending | started | closed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class RoundCreate(BaseModel):
    name: str


class PlayerAssignment(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    round_id: str
    player_user_id: str
    target_user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class RoundMember(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    round_id: str
    user_id: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class GoodDeedCreate(BaseModel):
    title: str
    description: Optional[str] = None


class GoodDeedPublic(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    round_id: Optional[str] = None
    target_user_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}