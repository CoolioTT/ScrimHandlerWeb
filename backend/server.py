import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import pymongo
from pymongo import MongoClient
from bson import ObjectId
import jwt
from passlib.context import CryptContext
import logging

# Initialize FastAPI
app = FastAPI(title="Valorant Scrims API", version="1.0.0")

# CORS configuration
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "valorant_scrims")

try:
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    raise

# Collections
users_collection = db.users
teams_collection = db.teams
scrims_collection = db.scrims
tier_requests_collection = db.tier_requests

# Security
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Valorant Maps
VALORANT_MAPS = [
    "Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", 
    "Lotus", "Pearl", "Split", "Sunset", "Abyss"
]

# Rank Systems
PUBLIC_RANKS = [
    "Iron 1", "Iron 2", "Iron 3",
    "Bronze 1", "Bronze 2", "Bronze 3", 
    "Silver 1", "Silver 2", "Silver 3",
    "Gold 1", "Gold 2", "Gold 3",
    "Platinum 1", "Platinum 2", "Platinum 3",
    "Diamond 1", "Diamond 2", "Diamond 3",
    "Ascendant 1", "Ascendant 2", "Ascendant 3",
    "Immortal 1", "Immortal 2", "Immortal 3",
    "Radiant"
]

TIER_RANKS = [
    "Ascendant 1", "Ascendant 2", "Ascendant 3",
    "Immortal 1", "Immortal 2", "Immortal 3",
    "Radiant"
]

# Rank to numeric mapping for filtering
RANK_ORDER = {
    "Iron 1": 1, "Iron 2": 2, "Iron 3": 3,
    "Bronze 1": 4, "Bronze 2": 5, "Bronze 3": 6,
    "Silver 1": 7, "Silver 2": 8, "Silver 3": 9,
    "Gold 1": 10, "Gold 2": 11, "Gold 3": 12,
    "Platinum 1": 13, "Platinum 2": 14, "Platinum 3": 15,
    "Diamond 1": 16, "Diamond 2": 17, "Diamond 3": 18,
    "Ascendant 1": 19, "Ascendant 2": 20, "Ascendant 3": 21,
    "Immortal 1": 22, "Immortal 2": 23, "Immortal 3": 24,
    "Radiant": 25
}

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    valorant_username: str
    valorant_tag: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TierUpgradeRequest(BaseModel):
    requested_tier: int

class TeamCreate(BaseModel):
    name: str
    description: str
    max_members: int = 5

class TeamInvite(BaseModel):
    username: str

class ScrimCreate(BaseModel):
    title: str
    description: str
    maps: List[str]
    max_rounds: int  # 13 or 24
    num_games: int
    scheduled_time: datetime
    max_participants: int = 2

class ScrimApplication(BaseModel):
    selected_maps: List[str]
    preferred_rounds: int
    preferred_games: int
    message: str = ""

# Helper functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB ObjectId
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) for item in value]
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = users_collection.find_one({"user_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def can_see_tier(user_tier: str, content_tier: str) -> bool:
    """Check if user can see content based on tier hierarchy"""
    tier_hierarchy = {"public": 0, "tier_3": 1, "tier_2": 2, "tier_1": 3}
    user_level = tier_hierarchy.get(user_tier, 0)
    content_level = tier_hierarchy.get(content_tier, 0)
    return user_level >= content_level

# API Endpoints

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if users_collection.find_one({"username": user_data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "valorant_username": user_data.valorant_username,
        "valorant_tag": user_data.valorant_tag,
        "tier": "public",
        "rank": "Iron 1",  # Default rank
        "team_id": None,
        "created_at": datetime.utcnow(),
        "is_admin": False
    }
    
    users_collection.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "tier": "public",
            "rank": "Iron 1"
        }
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["user_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user["email"],
            "tier": user["tier"],
            "rank": user["rank"],
            "team_id": user.get("team_id")
        }
    }

@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    team = None
    if current_user.get("team_id"):
        team = teams_collection.find_one({"team_id": current_user["team_id"]})
    
    return {
        "user_id": current_user["user_id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "tier": current_user["tier"],
        "rank": current_user["rank"],
        "valorant_username": current_user["valorant_username"],
        "valorant_tag": current_user["valorant_tag"],
        "team": team,
        "is_admin": current_user.get("is_admin", False)
    }

@app.post("/api/user/request-tier-upgrade")
async def request_tier_upgrade(request: TierUpgradeRequest, current_user: dict = Depends(get_current_user)):
    if request.requested_tier < 1 or request.requested_tier > 3:
        raise HTTPException(status_code=400, detail="Tier must be between 1 and 3")
    
    if current_user["tier"] != "public":
        raise HTTPException(status_code=400, detail="Only public users can request tier upgrades")
    
    # Check if request already exists
    existing_request = tier_requests_collection.find_one({
        "user_id": current_user["user_id"],
        "status": "pending"
    })
    
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending tier upgrade request")
    
    request_doc = {
        "request_id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "username": current_user["username"],
        "current_tier": current_user["tier"],
        "requested_tier": f"tier_{request.requested_tier}",
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    tier_requests_collection.insert_one(request_doc)
    return {"message": "Tier upgrade request submitted successfully"}

@app.post("/api/teams/create")
async def create_team(team_data: TeamCreate, current_user: dict = Depends(get_current_user)):
    # Check tier restrictions
    if current_user["tier"] in ["tier_1", "tier_2"]:
        raise HTTPException(status_code=403, detail="Tier 1 and Tier 2 users cannot create teams")
    
    if current_user.get("team_id"):
        raise HTTPException(status_code=400, detail="You are already in a team")
    
    # Check if team name exists
    if teams_collection.find_one({"name": team_data.name}):
        raise HTTPException(status_code=400, detail="Team name already exists")
    
    team_id = str(uuid.uuid4())
    team_doc = {
        "team_id": team_id,
        "name": team_data.name,
        "description": team_data.description,
        "owner_id": current_user["user_id"],
        "members": [current_user["user_id"]],
        "max_members": team_data.max_members,
        "tier": current_user["tier"],
        "average_rank": current_user["rank"],
        "created_at": datetime.utcnow()
    }
    
    teams_collection.insert_one(team_doc)
    
    # Update user's team_id
    users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"team_id": team_id}}
    )
    
    return {"message": "Team created successfully", "team_id": team_id}

@app.get("/api/teams/my-team")
async def get_my_team(current_user: dict = Depends(get_current_user)):
    if not current_user.get("team_id"):
        raise HTTPException(status_code=404, detail="You are not in a team")
    
    team = teams_collection.find_one({"team_id": current_user["team_id"]})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get team members details
    members = list(users_collection.find(
        {"user_id": {"$in": team["members"]}},
        {"password_hash": 0}
    ))
    
    # Serialize the documents
    team = serialize_doc(team)
    members = serialize_doc(members)
    team["members_details"] = members
    
    return team

@app.post("/api/scrims/create")
async def create_scrim(scrim_data: ScrimCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("team_id"):
        raise HTTPException(status_code=400, detail="You must be in a team to create scrims")
    
    team = teams_collection.find_one({"team_id": current_user["team_id"]})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team["owner_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only team owners can create scrims")
    
    # Validate maps
    invalid_maps = [m for m in scrim_data.maps if m not in VALORANT_MAPS]
    if invalid_maps:
        raise HTTPException(status_code=400, detail=f"Invalid maps: {invalid_maps}")
    
    scrim_id = str(uuid.uuid4())
    scrim_doc = {
        "scrim_id": scrim_id,
        "team_id": current_user["team_id"],
        "team_name": team["name"],
        "title": scrim_data.title,
        "description": scrim_data.description,
        "maps": scrim_data.maps,
        "max_rounds": scrim_data.max_rounds,
        "num_games": scrim_data.num_games,
        "scheduled_time": scrim_data.scheduled_time,
        "max_participants": scrim_data.max_participants,
        "applications": [],
        "status": "open",
        "tier": team["tier"],
        "created_at": datetime.utcnow()
    }
    
    scrims_collection.insert_one(scrim_doc)
    return {"message": "Scrim created successfully", "scrim_id": scrim_id}

@app.get("/api/scrims")
async def get_scrims(current_user: dict = Depends(get_current_user)):
    # Get scrims that user can see based on tier
    query = {"status": "open"}
    
    scrims = list(scrims_collection.find(query))
    
    # Filter based on tier visibility and serialize
    visible_scrims = []
    for scrim in scrims:
        if can_see_tier(current_user["tier"], scrim["tier"]):
            visible_scrims.append(serialize_doc(scrim))
    
    return visible_scrims

@app.post("/api/scrims/{scrim_id}/apply")
async def apply_to_scrim(scrim_id: str, application: ScrimApplication, current_user: dict = Depends(get_current_user)):
    if not current_user.get("team_id"):
        raise HTTPException(status_code=400, detail="You must be in a team to apply to scrims")
    
    scrim = scrims_collection.find_one({"scrim_id": scrim_id})
    if not scrim:
        raise HTTPException(status_code=404, detail="Scrim not found")
    
    if scrim["team_id"] == current_user["team_id"]:
        raise HTTPException(status_code=400, detail="Cannot apply to your own scrim")
    
    # Check if already applied
    existing_application = next((app for app in scrim["applications"] if app["team_id"] == current_user["team_id"]), None)
    if existing_application:
        raise HTTPException(status_code=400, detail="Already applied to this scrim")
    
    team = teams_collection.find_one({"team_id": current_user["team_id"]})
    
    application_doc = {
        "application_id": str(uuid.uuid4()),
        "team_id": current_user["team_id"],
        "team_name": team["name"],
        "selected_maps": application.selected_maps,
        "preferred_rounds": application.preferred_rounds,
        "preferred_games": application.preferred_games,
        "message": application.message,
        "status": "pending",
        "applied_at": datetime.utcnow()
    }
    
    scrims_collection.update_one(
        {"scrim_id": scrim_id},
        {"$push": {"applications": application_doc}}
    )
    
    return {"message": "Application submitted successfully"}

@app.get("/api/admin/tier-requests")
async def get_tier_requests(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    requests = list(tier_requests_collection.find({"status": "pending"}))
    return serialize_doc(requests)

@app.post("/api/admin/tier-requests/{request_id}/approve")
async def approve_tier_request(request_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    request_doc = tier_requests_collection.find_one({"request_id": request_id})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update user tier
    users_collection.update_one(
        {"user_id": request_doc["user_id"]},
        {"$set": {"tier": request_doc["requested_tier"]}}
    )
    
    # Update request status
    tier_requests_collection.update_one(
        {"request_id": request_id},
        {"$set": {"status": "approved", "processed_at": datetime.utcnow()}}
    )
    
    return {"message": "Tier request approved"}

@app.post("/api/admin/tier-requests/{request_id}/reject")
async def reject_tier_request(request_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tier_requests_collection.update_one(
        {"request_id": request_id},
        {"$set": {"status": "rejected", "processed_at": datetime.utcnow()}}
    )
    
    return {"message": "Tier request rejected"}

@app.get("/api/maps")
async def get_maps():
    return {"maps": VALORANT_MAPS}

@app.get("/api/ranks")
async def get_ranks(current_user: dict = Depends(get_current_user)):
    if current_user["tier"] == "public":
        return {"ranks": PUBLIC_RANKS}
    else:
        return {"ranks": TIER_RANKS}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)