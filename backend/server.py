from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
from enum import Enum
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'adelphi_db')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'adelphi-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Adelphi Menopause Companion API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================

class UserRole(str, Enum):
    PRIMARY = "primary"  # Woman using the app
    PARTNER = "partner"  # Partner/spouse/family
    ADMIN = "admin"      # Adelphi team

class MenopauseStage(str, Enum):
    PRE = "pre-menopause"
    PERI = "peri-menopause"
    MENOPAUSE = "menopause"
    POST = "post-menopause"
    UNSURE = "not-sure-yet"

class SymptomCategory(str, Enum):
    PHYSICAL = "physical"
    EMOTIONAL = "emotional"
    COGNITIVE = "cognitive"

class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class Frequency(str, Enum):
    RARE = "rare"
    SOMETIMES = "sometimes"
    OFTEN = "often"
    CONSTANT = "constant"

class SleepQuality(str, Enum):
    POOR = "poor"
    FAIR = "fair"
    GOOD = "good"
    EXCELLENT = "excellent"

class StressLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ExerciseIntensity(str, Enum):
    NONE = "none"
    LIGHT = "light"
    MODERATE = "moderate"
    INTENSE = "intense"

# ==================== MODELS ====================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.PRIMARY

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.PRIMARY

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    has_completed_onboarding: bool = False
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Profile Models
class OnboardingData(BaseModel):
    age_range: Optional[str] = None
    ethnicity: Optional[str] = None
    country: Optional[str] = None
    menopause_stage: Optional[MenopauseStage] = None
    medical_conditions: Optional[List[str]] = []
    medical_notes: Optional[str] = None
    consent_data_storage: bool = False
    consent_research: bool = False
    consent_partner_invites: bool = False

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age_range: Optional[str] = None
    ethnicity: Optional[str] = None
    country: Optional[str] = None
    menopause_stage: Optional[MenopauseStage] = None
    medical_conditions: Optional[List[str]] = None
    medical_notes: Optional[str] = None

# Google OAuth Model
class GoogleAuthRequest(BaseModel):
    id_token: str
    role: UserRole = UserRole.PRIMARY

# Symptom Models
class SymptomBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: SymptomCategory
    stages: List[MenopauseStage] = []
    is_user_defined: bool = False
    created_by: Optional[str] = None
    reviewed: bool = True

class SymptomCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: SymptomCategory
    stages: List[MenopauseStage] = []

class SymptomResponse(SymptomBase):
    id: str

class SymptomLogCreate(BaseModel):
    symptom_id: str
    symptom_name: str  # Store name for easy display
    severity: Severity
    severity_score: int = Field(ge=0, le=10)
    frequency: Frequency
    notes: Optional[str] = None

class SymptomLogResponse(BaseModel):
    id: str
    user_id: str
    symptom_id: str
    symptom_name: str
    severity: Severity
    severity_score: int
    frequency: Frequency
    notes: Optional[str] = None
    logged_at: datetime

# Mood Models
class MoodLogCreate(BaseModel):
    mood_score: int = Field(ge=1, le=10)  # 1 = very low, 10 = great
    emotions: List[str] = []  # Tags like anxious, sad, tired, etc.
    description: Optional[str] = None

class MoodLogResponse(BaseModel):
    id: str
    user_id: str
    mood_score: int
    emotions: List[str]
    description: Optional[str] = None
    logged_at: datetime

# Lifestyle Models
class LifestyleLogCreate(BaseModel):
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[SleepQuality] = None
    food_tags: List[str] = []  # high_sugar, late_meals, caffeine, alcohol, balanced, water
    water_intake: Optional[int] = None  # glasses
    exercise_intensity: Optional[ExerciseIntensity] = None
    exercise_type: Optional[str] = None
    exercise_minutes: Optional[int] = None
    stress_level: Optional[StressLevel] = None
    stress_source: Optional[str] = None  # work, relationship, finances, etc.
    work_day: Optional[str] = None  # good, tough, neutral
    relationship_notes: Optional[str] = None

class LifestyleLogResponse(BaseModel):
    id: str
    user_id: str
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[SleepQuality] = None
    food_tags: List[str] = []
    water_intake: Optional[int] = None
    exercise_intensity: Optional[ExerciseIntensity] = None
    exercise_type: Optional[str] = None
    exercise_minutes: Optional[int] = None
    stress_level: Optional[StressLevel] = None
    stress_source: Optional[str] = None
    work_day: Optional[str] = None
    relationship_notes: Optional[str] = None
    logged_at: datetime

# Reminder Models
class ReminderCreate(BaseModel):
    type: str  # water, walk, bedtime, medication, custom
    title: str
    time: str  # HH:MM format
    days: List[str] = []  # mon, tue, wed, etc. or empty for daily
    enabled: bool = True
    custom_message: Optional[str] = None

class ReminderResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    time: str
    days: List[str]
    enabled: bool
    custom_message: Optional[str] = None

class ReminderUpdate(BaseModel):
    enabled: Optional[bool] = None
    time: Optional[str] = None
    days: Optional[List[str]] = None
    custom_message: Optional[str] = None

# Article Models
class ArticleCreate(BaseModel):
    title: str
    summary: str
    content: str
    category: str  # symptoms, stages, lifestyle, partner, etc.
    tags: List[str] = []
    stages: List[MenopauseStage] = []
    symptom_tags: List[str] = []
    ethnicity_tags: List[str] = []
    audience: str = "primary"  # primary, partner, family, children

class ArticleResponse(BaseModel):
    id: str
    title: str
    summary: str
    content: str
    category: str
    tags: List[str]
    stages: List[MenopauseStage]
    symptom_tags: List[str]
    ethnicity_tags: List[str]
    audience: str
    created_at: datetime

# Partner Link Models
class PartnerInviteCreate(BaseModel):
    share_symptoms: bool = True
    share_mood: bool = True
    share_daily_status: bool = True
    enable_notifications: bool = True

class PartnerInviteResponse(BaseModel):
    id: str
    invite_code: str
    primary_user_id: str
    primary_user_name: str
    share_symptoms: bool
    share_mood: bool
    share_daily_status: bool
    enable_notifications: bool
    expires_at: datetime
    is_used: bool = False

class PartnerLinkResponse(BaseModel):
    id: str
    primary_user_id: str
    primary_user_name: str
    partner_user_id: str
    share_symptoms: bool
    share_mood: bool
    share_daily_status: bool
    enable_notifications: bool
    created_at: datetime
    is_active: bool = True

class PartnerDashboard(BaseModel):
    primary_user_name: str
    today_status: str  # "easier", "challenging", "neutral"
    recent_mood_trend: str  # "improving", "declining", "stable"
    suggested_actions: List[str]
    last_updated: datetime

# Community Models
class GroupCreate(BaseModel):
    name: str
    description: str
    topics: List[str] = []
    is_public: bool = True

class GroupResponse(BaseModel):
    id: str
    name: str
    description: str
    topics: List[str]
    member_count: int
    is_public: bool
    created_at: datetime

class PostCreate(BaseModel):
    group_id: str
    content: str

class PostResponse(BaseModel):
    id: str
    group_id: str
    user_id: str
    user_name: str
    content: str
    reactions: Dict[str, int] = {}
    comment_count: int = 0
    created_at: datetime

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    user_name: str
    content: str
    created_at: datetime

# Event Models
class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str  # workshop, walk, exercise, webinar
    is_online: bool = True
    location: Optional[str] = None
    link: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    registration_link: Optional[str] = None

class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    event_type: str
    is_online: bool
    location: Optional[str] = None
    link: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    registration_link: Optional[str] = None
    created_at: datetime

# Specialist Models
class SpecialistCreate(BaseModel):
    name: str
    credentials: str
    bio: str
    specialties: List[str]  # menopause, HRT, nutrition, therapy, etc.
    services: List[str]
    is_online: bool = True
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    booking_link: Optional[str] = None

class SpecialistResponse(BaseModel):
    id: str
    name: str
    credentials: str
    bio: str
    specialties: List[str]
    services: List[str]
    is_online: bool
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    booking_link: Optional[str] = None

# Push Notification Token
class PushTokenCreate(BaseModel):
    token: str
    device_type: str  # ios, android

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_invite_code() -> str:
    return str(uuid.uuid4())[:8].upper()

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role.value,
        "has_completed_onboarding": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create profile
    profile_dict = {
        "user_id": user_id,
        "created_at": datetime.utcnow()
    }
    await db.profiles.insert_one(profile_dict)
    
    # Generate token
    token = create_access_token({"user_id": user_id})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_dict["email"],
            name=user_dict["name"],
            role=user_data.role,
            has_completed_onboarding=False,
            created_at=user_dict["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    token = create_access_token({"user_id": user_id})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user["email"],
            name=user["name"],
            role=UserRole(user["role"]),
            has_completed_onboarding=user.get("has_completed_onboarding", False),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        role=UserRole(user["role"]),
        has_completed_onboarding=user.get("has_completed_onboarding", False),
        created_at=user["created_at"]
    )

# ==================== ONBOARDING ROUTES ====================

@api_router.post("/onboarding/complete")
async def complete_onboarding(data: OnboardingData, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    # Update profile
    await db.profiles.update_one(
        {"user_id": user_id},
        {"$set": {
            "age_range": data.age_range,
            "ethnicity": data.ethnicity,
            "country": data.country,
            "menopause_stage": data.menopause_stage.value if data.menopause_stage else None,
            "medical_conditions": data.medical_conditions,
            "medical_notes": data.medical_notes,
            "consent_data_storage": data.consent_data_storage,
            "consent_research": data.consent_research,
            "consent_partner_invites": data.consent_partner_invites,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    # Mark onboarding complete
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"has_completed_onboarding": True}}
    )
    
    return {"success": True, "message": "Onboarding completed"}

@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    profile = await db.profiles.find_one({"user_id": user_id})
    
    if not profile:
        return {"user_id": user_id}
    
    profile["id"] = str(profile.pop("_id"))
    return profile

@api_router.put("/profile")
async def update_profile(data: UserProfileUpdate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if data.menopause_stage:
        update_data["menopause_stage"] = data.menopause_stage.value
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update name in users collection if provided
    if data.name:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"name": data.name}}
        )
    
    await db.profiles.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"success": True}

# ==================== SYMPTOM ROUTES ====================

@api_router.get("/symptoms", response_model=List[SymptomResponse])
async def get_symptoms(
    category: Optional[SymptomCategory] = None,
    stage: Optional[MenopauseStage] = None
):
    query = {"reviewed": True}
    if category:
        query["category"] = category.value
    if stage:
        query["stages"] = stage.value
    
    symptoms = await db.symptoms.find(query).to_list(100)
    return [SymptomResponse(id=str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}) for s in symptoms]

@api_router.post("/symptoms", response_model=SymptomResponse)
async def create_custom_symptom(data: SymptomCreate, user: dict = Depends(get_current_user)):
    symptom_dict = {
        "name": data.name,
        "description": data.description,
        "category": data.category.value,
        "stages": [s.value for s in data.stages],
        "is_user_defined": True,
        "created_by": str(user["_id"]),
        "reviewed": False,  # Needs admin review
        "created_at": datetime.utcnow()
    }
    
    result = await db.symptoms.insert_one(symptom_dict)
    symptom_dict["id"] = str(result.inserted_id)
    
    return SymptomResponse(**symptom_dict)

@api_router.post("/symptom-logs", response_model=SymptomLogResponse)
async def log_symptom(data: SymptomLogCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    log_dict = {
        "user_id": user_id,
        "symptom_id": data.symptom_id,
        "symptom_name": data.symptom_name,
        "severity": data.severity.value,
        "severity_score": data.severity_score,
        "frequency": data.frequency.value,
        "notes": data.notes,
        "logged_at": datetime.utcnow()
    }
    
    result = await db.symptom_logs.insert_one(log_dict)
    log_dict["id"] = str(result.inserted_id)
    
    return SymptomLogResponse(**log_dict)

@api_router.get("/symptom-logs", response_model=List[SymptomLogResponse])
async def get_symptom_logs(
    days: int = 30,
    user: dict = Depends(get_current_user)
):
    user_id = str(user["_id"])
    since = datetime.utcnow() - timedelta(days=days)
    
    logs = await db.symptom_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": since}
    }).sort("logged_at", -1).to_list(500)
    
    return [SymptomLogResponse(id=str(l["_id"]), **{k: v for k, v in l.items() if k != "_id"}) for l in logs]

@api_router.get("/symptom-logs/today", response_model=List[SymptomLogResponse])
async def get_today_symptom_logs(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    logs = await db.symptom_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    }).to_list(100)
    
    return [SymptomLogResponse(id=str(l["_id"]), **{k: v for k, v in l.items() if k != "_id"}) for l in logs]

# ==================== MOOD ROUTES ====================

@api_router.post("/mood-logs", response_model=MoodLogResponse)
async def log_mood(data: MoodLogCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    log_dict = {
        "user_id": user_id,
        "mood_score": data.mood_score,
        "emotions": data.emotions,
        "description": data.description,
        "logged_at": datetime.utcnow()
    }
    
    result = await db.mood_logs.insert_one(log_dict)
    log_dict["id"] = str(result.inserted_id)
    
    return MoodLogResponse(**log_dict)

@api_router.get("/mood-logs", response_model=List[MoodLogResponse])
async def get_mood_logs(days: int = 30, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    since = datetime.utcnow() - timedelta(days=days)
    
    logs = await db.mood_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": since}
    }).sort("logged_at", -1).to_list(500)
    
    return [MoodLogResponse(id=str(l["_id"]), **{k: v for k, v in l.items() if k != "_id"}) for l in logs]

@api_router.get("/mood-logs/today", response_model=Optional[MoodLogResponse])
async def get_today_mood(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    log = await db.mood_logs.find_one({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    }, sort=[("logged_at", -1)])
    
    if not log:
        return None
    
    return MoodLogResponse(id=str(log["_id"]), **{k: v for k, v in log.items() if k != "_id"})

# ==================== LIFESTYLE ROUTES ====================

@api_router.post("/lifestyle-logs", response_model=LifestyleLogResponse)
async def log_lifestyle(data: LifestyleLogCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    log_dict = {
        "user_id": user_id,
        **data.dict(),
        "logged_at": datetime.utcnow()
    }
    
    # Convert enums to values
    if data.sleep_quality:
        log_dict["sleep_quality"] = data.sleep_quality.value
    if data.exercise_intensity:
        log_dict["exercise_intensity"] = data.exercise_intensity.value
    if data.stress_level:
        log_dict["stress_level"] = data.stress_level.value
    
    result = await db.lifestyle_logs.insert_one(log_dict)
    log_dict["id"] = str(result.inserted_id)
    
    return LifestyleLogResponse(**log_dict)

@api_router.get("/lifestyle-logs", response_model=List[LifestyleLogResponse])
async def get_lifestyle_logs(days: int = 30, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    since = datetime.utcnow() - timedelta(days=days)
    
    logs = await db.lifestyle_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": since}
    }).sort("logged_at", -1).to_list(500)
    
    return [LifestyleLogResponse(id=str(l["_id"]), **{k: v for k, v in l.items() if k != "_id"}) for l in logs]

@api_router.get("/lifestyle-logs/today", response_model=Optional[LifestyleLogResponse])
async def get_today_lifestyle(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    log = await db.lifestyle_logs.find_one({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    }, sort=[("logged_at", -1)])
    
    if not log:
        return None
    
    return LifestyleLogResponse(id=str(log["_id"]), **{k: v for k, v in log.items() if k != "_id"})

# ==================== REMINDER ROUTES ====================

@api_router.post("/reminders", response_model=ReminderResponse)
async def create_reminder(data: ReminderCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    reminder_dict = {
        "user_id": user_id,
        **data.dict(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.reminders.insert_one(reminder_dict)
    reminder_dict["id"] = str(result.inserted_id)
    
    return ReminderResponse(**reminder_dict)

@api_router.get("/reminders", response_model=List[ReminderResponse])
async def get_reminders(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    reminders = await db.reminders.find({"user_id": user_id}).to_list(50)
    return [ReminderResponse(id=str(r["_id"]), **{k: v for k, v in r.items() if k != "_id"}) for r in reminders]

@api_router.put("/reminders/{reminder_id}")
async def update_reminder(reminder_id: str, data: ReminderUpdate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    result = await db.reminders.update_one(
        {"_id": ObjectId(reminder_id), "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"success": True}

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    result = await db.reminders.delete_one({
        "_id": ObjectId(reminder_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"success": True}

# ==================== ARTICLE ROUTES ====================

@api_router.get("/articles", response_model=List[ArticleResponse])
async def get_articles(
    category: Optional[str] = None,
    stage: Optional[MenopauseStage] = None,
    audience: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    if category:
        query["category"] = category
    if stage:
        query["stages"] = stage.value
    if audience:
        query["audience"] = audience
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    articles = await db.articles.find(query).sort("created_at", -1).to_list(100)
    return [ArticleResponse(id=str(a["_id"]), **{k: v for k, v in a.items() if k != "_id"}) for a in articles]

@api_router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    article = await db.articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return ArticleResponse(id=str(article["_id"]), **{k: v for k, v in article.items() if k != "_id"})

@api_router.post("/articles", response_model=ArticleResponse)
async def create_article(data: ArticleCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    article_dict = {
        **data.dict(),
        "stages": [s.value for s in data.stages],
        "created_at": datetime.utcnow(),
        "created_by": str(user["_id"])
    }
    
    result = await db.articles.insert_one(article_dict)
    article_dict["id"] = str(result.inserted_id)
    
    return ArticleResponse(**article_dict)

@api_router.post("/articles/bookmark/{article_id}")
async def bookmark_article(article_id: str, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.bookmarks.update_one(
        {"user_id": user_id, "article_id": article_id},
        {"$set": {"created_at": datetime.utcnow()}},
        upsert=True
    )
    
    return {"success": True}

@api_router.delete("/articles/bookmark/{article_id}")
async def remove_bookmark(article_id: str, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.bookmarks.delete_one({"user_id": user_id, "article_id": article_id})
    
    return {"success": True}

@api_router.get("/articles/bookmarks/list", response_model=List[ArticleResponse])
async def get_bookmarked_articles(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    bookmarks = await db.bookmarks.find({"user_id": user_id}).to_list(100)
    article_ids = [ObjectId(b["article_id"]) for b in bookmarks]
    
    articles = await db.articles.find({"_id": {"$in": article_ids}}).to_list(100)
    return [ArticleResponse(id=str(a["_id"]), **{k: v for k, v in a.items() if k != "_id"}) for a in articles]

# ==================== PARTNER ROUTES ====================

@api_router.post("/partner/invite", response_model=PartnerInviteResponse)
async def create_partner_invite(data: PartnerInviteCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "primary":
        raise HTTPException(status_code=403, detail="Only primary users can invite partners")
    
    user_id = str(user["_id"])
    invite_code = generate_invite_code()
    
    invite_dict = {
        "invite_code": invite_code,
        "primary_user_id": user_id,
        "primary_user_name": user["name"],
        "share_symptoms": data.share_symptoms,
        "share_mood": data.share_mood,
        "share_daily_status": data.share_daily_status,
        "enable_notifications": data.enable_notifications,
        "expires_at": datetime.utcnow() + timedelta(days=7),
        "is_used": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.partner_invites.insert_one(invite_dict)
    invite_dict["id"] = str(result.inserted_id)
    
    return PartnerInviteResponse(**invite_dict)

@api_router.post("/partner/accept/{invite_code}")
async def accept_partner_invite(invite_code: str, user: dict = Depends(get_current_user)):
    # Find invite
    invite = await db.partner_invites.find_one({
        "invite_code": invite_code,
        "is_used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite code")
    
    partner_user_id = str(user["_id"])
    
    # Create partner link
    link_dict = {
        "primary_user_id": invite["primary_user_id"],
        "primary_user_name": invite["primary_user_name"],
        "partner_user_id": partner_user_id,
        "share_symptoms": invite["share_symptoms"],
        "share_mood": invite["share_mood"],
        "share_daily_status": invite["share_daily_status"],
        "enable_notifications": invite["enable_notifications"],
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.partner_links.insert_one(link_dict)
    
    # Mark invite as used
    await db.partner_invites.update_one(
        {"_id": invite["_id"]},
        {"$set": {"is_used": True}}
    )
    
    # Update user role to partner
    await db.users.update_one(
        {"_id": ObjectId(partner_user_id)},
        {"$set": {"role": "partner"}}
    )
    
    return {"success": True, "primary_user_name": invite["primary_user_name"]}

@api_router.get("/partner/link")
async def get_partner_link(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    role = user["role"]
    
    if role == "primary":
        link = await db.partner_links.find_one({
            "primary_user_id": user_id,
            "is_active": True
        })
    else:
        link = await db.partner_links.find_one({
            "partner_user_id": user_id,
            "is_active": True
        })
    
    if not link:
        return None
    
    link["id"] = str(link.pop("_id"))
    return link

@api_router.delete("/partner/link")
async def revoke_partner_link(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.partner_links.update_one(
        {"primary_user_id": user_id, "is_active": True},
        {"$set": {"is_active": False, "revoked_at": datetime.utcnow()}}
    )
    
    return {"success": True}

@api_router.get("/partner/dashboard", response_model=PartnerDashboard)
async def get_partner_dashboard(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    # Find the link
    link = await db.partner_links.find_one({
        "partner_user_id": user_id,
        "is_active": True
    })
    
    if not link:
        raise HTTPException(status_code=404, detail="No active partner link found")
    
    primary_user_id = link["primary_user_id"]
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get today's mood if shared
    today_status = "neutral"
    if link.get("share_mood", True):
        mood = await db.mood_logs.find_one({
            "user_id": primary_user_id,
            "logged_at": {"$gte": today_start}
        }, sort=[("logged_at", -1)])
        
        if mood:
            if mood["mood_score"] <= 3:
                today_status = "challenging"
            elif mood["mood_score"] >= 7:
                today_status = "easier"
    
    # Get mood trend
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_moods = await db.mood_logs.find({
        "user_id": primary_user_id,
        "logged_at": {"$gte": week_ago}
    }).sort("logged_at", 1).to_list(30)
    
    mood_trend = "stable"
    if len(recent_moods) >= 3:
        first_half = sum(m["mood_score"] for m in recent_moods[:len(recent_moods)//2])
        second_half = sum(m["mood_score"] for m in recent_moods[len(recent_moods)//2:])
        if second_half > first_half + 2:
            mood_trend = "improving"
        elif second_half < first_half - 2:
            mood_trend = "declining"
    
    # Generate suggested actions
    actions = []
    if today_status == "challenging":
        actions = [
            "Send a caring message or thoughtful emoji",
            "Offer to help with a household task",
            "Give her some quiet time and space"
        ]
    elif today_status == "easier":
        actions = [
            "Share something positive with her",
            "Plan a relaxing activity together",
            "Express appreciation for her"
        ]
    else:
        actions = [
            "Check in with a kind message",
            "Offer to make her favorite drink",
            "Ask how she's feeling today"
        ]
    
    return PartnerDashboard(
        primary_user_name=link["primary_user_name"],
        today_status=today_status,
        recent_mood_trend=mood_trend,
        suggested_actions=actions,
        last_updated=datetime.utcnow()
    )

@api_router.put("/partner/settings")
async def update_partner_settings(data: PartnerInviteCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.partner_links.update_one(
        {"primary_user_id": user_id, "is_active": True},
        {"$set": {
            "share_symptoms": data.share_symptoms,
            "share_mood": data.share_mood,
            "share_daily_status": data.share_daily_status,
            "enable_notifications": data.enable_notifications
        }}
    )
    
    return {"success": True}

# ==================== COMMUNITY ROUTES ====================

@api_router.get("/groups", response_model=List[GroupResponse])
async def get_groups(topic: Optional[str] = None):
    query = {"is_public": True}
    if topic:
        query["topics"] = topic
    
    groups = await db.groups.find(query).to_list(50)
    
    result = []
    for g in groups:
        member_count = await db.group_members.count_documents({"group_id": str(g["_id"])})
        result.append(GroupResponse(
            id=str(g["_id"]),
            name=g["name"],
            description=g["description"],
            topics=g.get("topics", []),
            member_count=member_count,
            is_public=g.get("is_public", True),
            created_at=g["created_at"]
        ))
    
    return result

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.group_members.update_one(
        {"group_id": group_id, "user_id": user_id},
        {"$set": {"joined_at": datetime.utcnow()}},
        upsert=True
    )
    
    return {"success": True}

@api_router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.group_members.delete_one({"group_id": group_id, "user_id": user_id})
    
    return {"success": True}

@api_router.get("/groups/joined", response_model=List[GroupResponse])
async def get_joined_groups(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    memberships = await db.group_members.find({"user_id": user_id}).to_list(50)
    group_ids = [ObjectId(m["group_id"]) for m in memberships]
    
    groups = await db.groups.find({"_id": {"$in": group_ids}}).to_list(50)
    
    result = []
    for g in groups:
        member_count = await db.group_members.count_documents({"group_id": str(g["_id"])})
        result.append(GroupResponse(
            id=str(g["_id"]),
            name=g["name"],
            description=g["description"],
            topics=g.get("topics", []),
            member_count=member_count,
            is_public=g.get("is_public", True),
            created_at=g["created_at"]
        ))
    
    return result

@api_router.get("/groups/{group_id}/posts", response_model=List[PostResponse])
async def get_group_posts(group_id: str):
    posts = await db.posts.find({"group_id": group_id}).sort("created_at", -1).to_list(50)
    
    result = []
    for p in posts:
        comment_count = await db.comments.count_documents({"post_id": str(p["_id"])})
        result.append(PostResponse(
            id=str(p["_id"]),
            group_id=p["group_id"],
            user_id=p["user_id"],
            user_name=p["user_name"],
            content=p["content"],
            reactions=p.get("reactions", {}),
            comment_count=comment_count,
            created_at=p["created_at"]
        ))
    
    return result

@api_router.post("/posts", response_model=PostResponse)
async def create_post(data: PostCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    post_dict = {
        "group_id": data.group_id,
        "user_id": user_id,
        "user_name": user["name"],
        "content": data.content,
        "reactions": {},
        "created_at": datetime.utcnow()
    }
    
    result = await db.posts.insert_one(post_dict)
    post_dict["id"] = str(result.inserted_id)
    post_dict["comment_count"] = 0
    
    return PostResponse(**post_dict)

@api_router.post("/posts/{post_id}/react/{reaction}")
async def react_to_post(post_id: str, reaction: str, user: dict = Depends(get_current_user)):
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {f"reactions.{reaction}": 1}}
    )
    
    return {"success": True}

@api_router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    comments = await db.comments.find({"post_id": post_id}).sort("created_at", 1).to_list(100)
    
    return [CommentResponse(
        id=str(c["_id"]),
        post_id=c["post_id"],
        user_id=c["user_id"],
        user_name=c["user_name"],
        content=c["content"],
        created_at=c["created_at"]
    ) for c in comments]

@api_router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: str, data: CommentCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    comment_dict = {
        "post_id": post_id,
        "user_id": user_id,
        "user_name": user["name"],
        "content": data.content,
        "created_at": datetime.utcnow()
    }
    
    result = await db.comments.insert_one(comment_dict)
    comment_dict["id"] = str(result.inserted_id)
    
    return CommentResponse(**comment_dict)

# ==================== EVENT ROUTES ====================

@api_router.get("/events", response_model=List[EventResponse])
async def get_events(event_type: Optional[str] = None, upcoming_only: bool = True):
    query = {}
    if event_type:
        query["event_type"] = event_type
    if upcoming_only:
        query["start_time"] = {"$gte": datetime.utcnow()}
    
    events = await db.events.find(query).sort("start_time", 1).to_list(50)
    
    return [EventResponse(id=str(e["_id"]), **{k: v for k, v in e.items() if k != "_id"}) for e in events]

@api_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return EventResponse(id=str(event["_id"]), **{k: v for k, v in event.items() if k != "_id"})

@api_router.post("/events", response_model=EventResponse)
async def create_event(data: EventCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    event_dict = {
        **data.dict(),
        "created_at": datetime.utcnow(),
        "created_by": str(user["_id"])
    }
    
    result = await db.events.insert_one(event_dict)
    event_dict["id"] = str(result.inserted_id)
    
    return EventResponse(**event_dict)

# ==================== SPECIALIST ROUTES ====================

@api_router.get("/specialists", response_model=List[SpecialistResponse])
async def get_specialists(
    specialty: Optional[str] = None,
    location: Optional[str] = None,
    is_online: Optional[bool] = None
):
    query = {}
    if specialty:
        query["specialties"] = specialty
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if is_online is not None:
        query["is_online"] = is_online
    
    specialists = await db.specialists.find(query).to_list(100)
    
    return [SpecialistResponse(id=str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}) for s in specialists]

@api_router.get("/specialists/{specialist_id}", response_model=SpecialistResponse)
async def get_specialist(specialist_id: str):
    specialist = await db.specialists.find_one({"_id": ObjectId(specialist_id)})
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    
    return SpecialistResponse(id=str(specialist["_id"]), **{k: v for k, v in specialist.items() if k != "_id"})

@api_router.post("/specialists", response_model=SpecialistResponse)
async def create_specialist(data: SpecialistCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    specialist_dict = {
        **data.dict(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.specialists.insert_one(specialist_dict)
    specialist_dict["id"] = str(result.inserted_id)
    
    return SpecialistResponse(**specialist_dict)

# ==================== PUSH NOTIFICATION ROUTES ====================

@api_router.post("/push-token")
async def register_push_token(data: PushTokenCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    await db.push_tokens.update_one(
        {"user_id": user_id, "device_type": data.device_type},
        {"$set": {
            "token": data.token,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"success": True}

# ==================== DASHBOARD/INSIGHTS ROUTES ====================

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's logs
    today_symptoms = await db.symptom_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    }).to_list(100)
    
    today_mood = await db.mood_logs.find_one({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    }, sort=[("logged_at", -1)])
    
    today_lifestyle = await db.lifestyle_logs.find_one({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    }, sort=[("logged_at", -1)])
    
    # Generate suggestions based on recent data
    suggestions = []
    
    if not today_symptoms:
        suggestions.append({
            "type": "checkin",
            "title": "Log your symptoms",
            "description": "Track how you're feeling today"
        })
    
    if not today_mood:
        suggestions.append({
            "type": "mood",
            "title": "How are you feeling?",
            "description": "Quick mood check-in"
        })
    
    # Check recent lifestyle data for suggestions
    if today_lifestyle:
        if today_lifestyle.get("water_intake", 0) < 4:
            suggestions.append({
                "type": "reminder",
                "title": "Drink some water",
                "description": "Stay hydrated throughout the day"
            })
        
        if today_lifestyle.get("stress_level") == "high":
            suggestions.append({
                "type": "activity",
                "title": "Try a breathing exercise",
                "description": "2-minute calm breathing can help reduce stress"
            })
    
    if not today_lifestyle or not today_lifestyle.get("exercise_intensity"):
        suggestions.append({
            "type": "activity",
            "title": "Take a short walk",
            "description": "10 minutes of movement can boost your energy"
        })
    
    # Limit to 3 suggestions
    suggestions = suggestions[:3]
    
    return {
        "has_logged_symptoms_today": len(today_symptoms) > 0,
        "has_logged_mood_today": today_mood is not None,
        "has_logged_lifestyle_today": today_lifestyle is not None,
        "today_mood_score": today_mood["mood_score"] if today_mood else None,
        "today_symptom_count": len(today_symptoms),
        "suggestions": suggestions
    }

@api_router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)
    
    # Get recent symptom logs
    recent_symptoms = await db.symptom_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": month_ago}
    }).to_list(500)
    
    # Get recent mood logs
    recent_moods = await db.mood_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": month_ago}
    }).to_list(100)
    
    # Get recent lifestyle logs
    recent_lifestyle = await db.lifestyle_logs.find({
        "user_id": user_id,
        "logged_at": {"$gte": month_ago}
    }).to_list(100)
    
    # Calculate patterns
    insights = []
    
    # Most common symptoms
    symptom_counts = {}
    for log in recent_symptoms:
        name = log["symptom_name"]
        symptom_counts[name] = symptom_counts.get(name, 0) + 1
    
    if symptom_counts:
        top_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        insights.append({
            "type": "symptoms",
            "title": "Your most tracked symptoms",
            "data": [{"name": s[0], "count": s[1]} for s in top_symptoms]
        })
    
    # Mood trend
    if recent_moods:
        avg_mood = sum(m["mood_score"] for m in recent_moods) / len(recent_moods)
        insights.append({
            "type": "mood",
            "title": "Your average mood this month",
            "data": {"average": round(avg_mood, 1), "total_logs": len(recent_moods)}
        })
    
    # Sleep correlation with mood
    if recent_lifestyle and recent_moods:
        good_sleep_days = [l for l in recent_lifestyle if l.get("sleep_quality") in ["good", "excellent"]]
        if good_sleep_days:
            insights.append({
                "type": "pattern",
                "title": "Sleep & Mood Connection",
                "data": {"message": f"You had {len(good_sleep_days)} good sleep days this month. Quality sleep often helps with mood."}
            })
    
    return {"insights": insights}

# ==================== SEED DATA ROUTE ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for symptoms, articles, groups, events, and specialists"""
    
    # Check if already seeded
    symptom_count = await db.symptoms.count_documents({})
    if symptom_count > 0:
        return {"message": "Data already seeded"}
    
    # Seed Symptoms
    symptoms = [
        # Physical
        {"name": "Hot Flushes", "description": "Sudden feeling of warmth, often most intense over face, neck and chest", "category": "physical", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Night Sweats", "description": "Hot flushes that occur at night, often disrupting sleep", "category": "physical", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Sleep Problems", "description": "Difficulty falling asleep or staying asleep", "category": "physical", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Joint Pain", "description": "Aches and stiffness in joints", "category": "physical", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Headaches", "description": "More frequent or intense headaches", "category": "physical", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Heart Palpitations", "description": "Racing or fluttering heartbeat", "category": "physical", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Weight Changes", "description": "Unexplained weight gain, especially around the middle", "category": "physical", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Fatigue", "description": "Feeling tired or lacking energy", "category": "physical", "stages": ["pre-menopause", "peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Dry Skin", "description": "Skin feels drier or less elastic", "category": "physical", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Hair Changes", "description": "Hair thinning or texture changes", "category": "physical", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        
        # Emotional
        {"name": "Anxiety", "description": "Feelings of worry, nervousness or unease", "category": "emotional", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Low Mood", "description": "Feeling down, sad or flat", "category": "emotional", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Irritability", "description": "Feeling easily annoyed or frustrated", "category": "emotional", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Mood Swings", "description": "Rapid changes in emotional state", "category": "emotional", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Feeling Overwhelmed", "description": "Difficulty coping with everyday tasks", "category": "emotional", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Loss of Confidence", "description": "Feeling less sure of yourself", "category": "emotional", "stages": ["peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        {"name": "Feeling Somehow", "description": "Hard to describe feeling - not quite right but unsure why", "category": "emotional", "stages": ["pre-menopause", "peri-menopause", "menopause", "post-menopause"], "reviewed": True},
        
        # Cognitive
        {"name": "Brain Fog", "description": "Difficulty thinking clearly or feeling mentally fuzzy", "category": "cognitive", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Memory Issues", "description": "Trouble remembering things or finding words", "category": "cognitive", "stages": ["peri-menopause", "menopause"], "reviewed": True},
        {"name": "Concentration Problems", "description": "Difficulty focusing on tasks", "category": "cognitive", "stages": ["peri-menopause", "menopause"], "reviewed": True},
    ]
    
    for symptom in symptoms:
        symptom["is_user_defined"] = False
        symptom["created_at"] = datetime.utcnow()
    
    await db.symptoms.insert_many(symptoms)
    
    # Seed Articles
    articles = [
        {
            "title": "Understanding Perimenopause: What's Happening to Your Body",
            "summary": "Learn about the hormonal changes during perimenopause and what symptoms you might experience.",
            "content": """Perimenopause is the transition period leading up to menopause. It typically begins in your mid-40s but can start earlier for some women.

During this time, your estrogen levels start to fluctuate. This can cause a range of symptoms including irregular periods, hot flushes, sleep disturbances, and mood changes.

**What to expect:**
- Irregular periods (shorter, longer, heavier, or lighter)
- Hot flushes and night sweats
- Sleep problems
- Mood changes
- Changes in sex drive

**How long does it last?**
Perimenopause typically lasts 4-8 years but can be shorter or longer.

**When to see a doctor:**
If your symptoms are affecting your quality of life, speak to your healthcare provider about treatment options.""",
            "category": "stages",
            "tags": ["perimenopause", "hormones", "symptoms"],
            "stages": ["peri-menopause"],
            "symptom_tags": ["hot flushes", "sleep problems", "mood swings"],
            "ethnicity_tags": [],
            "audience": "primary",
            "created_at": datetime.utcnow()
        },
        {
            "title": "Managing Hot Flushes: Practical Tips That Work",
            "summary": "Evidence-based strategies to help reduce the frequency and intensity of hot flushes.",
            "content": """Hot flushes are one of the most common menopause symptoms, affecting up to 75% of women. Here are practical strategies that can help.

**Lifestyle changes:**
- Dress in layers so you can cool down quickly
- Keep your bedroom cool at night
- Identify and avoid your triggers (common ones: spicy food, alcohol, caffeine, stress)
- Regular exercise can reduce hot flush frequency
- Maintain a healthy weight

**In the moment:**
- Deep breathing exercises
- Cool water or cold compress
- Portable fan

**Dietary approaches:**
- Some women find plant estrogens (soy, flaxseed) helpful
- Stay hydrated
- Limit alcohol and caffeine

**When to seek help:**
If lifestyle changes aren't enough, speak to your doctor about other options including HRT.""",
            "category": "symptoms",
            "tags": ["hot flushes", "management", "lifestyle"],
            "stages": ["peri-menopause", "menopause", "post-menopause"],
            "symptom_tags": ["hot flushes", "night sweats"],
            "ethnicity_tags": [],
            "audience": "primary",
            "created_at": datetime.utcnow()
        },
        {
            "title": "For Partners: Understanding Menopause and How to Help",
            "summary": "A guide for partners, spouses and family members on supporting someone through menopause.",
            "content": """Menopause is a significant life transition that affects both physical and emotional wellbeing. As a partner, understanding what's happening can help you provide meaningful support.

**What she might be experiencing:**
- Physical symptoms: hot flushes, sleep problems, fatigue, joint pain
- Emotional changes: mood swings, anxiety, feeling overwhelmed
- Cognitive effects: brain fog, memory issues

**How you can help:**

**1. Educate yourself**
Learning about menopause shows you care and helps you understand her experience.

**2. Be patient and understanding**
Symptoms can be unpredictable. Try not to take mood changes personally.

**3. Offer practical support**
- Help with household tasks when she's tired
- Be flexible with plans if she's not feeling well
- Keep the house cool

**4. Communicate openly**
Ask how she's feeling and listen without trying to fix everything.

**5. Small gestures matter**
- A kind message
- Her favorite drink
- Giving her space when needed

**What NOT to do:**
- Don't dismiss her symptoms
- Don't make jokes about menopause
- Don't pressure her when she's not feeling well""",
            "category": "partner",
            "tags": ["partner support", "relationships", "communication"],
            "stages": ["peri-menopause", "menopause", "post-menopause"],
            "symptom_tags": [],
            "ethnicity_tags": [],
            "audience": "partner",
            "created_at": datetime.utcnow()
        },
        {
            "title": "Sleep and Menopause: Getting Better Rest",
            "summary": "Why sleep becomes harder during menopause and strategies to improve your sleep quality.",
            "content": """Sleep problems affect many women during menopause. Here's why it happens and what you can do.

**Why menopause affects sleep:**
- Night sweats wake you up
- Hormonal changes disrupt sleep patterns
- Anxiety and stress keep your mind active
- Need to use the bathroom more often

**Sleep hygiene basics:**
- Stick to a regular sleep schedule
- Keep your bedroom cool (16-18°C)
- Avoid screens before bed
- Limit caffeine after noon
- Don't drink alcohol close to bedtime

**Managing night sweats:**
- Wear light, breathable sleepwear
- Use moisture-wicking sheets
- Keep a fan nearby
- Have cold water on your nightstand

**Relaxation techniques:**
- Deep breathing exercises
- Progressive muscle relaxation
- Meditation or mindfulness apps

**When to seek help:**
If sleep problems persist, speak to your doctor. There are treatments that can help, including HRT and sleep-specific interventions.""",
            "category": "lifestyle",
            "tags": ["sleep", "night sweats", "wellbeing"],
            "stages": ["peri-menopause", "menopause"],
            "symptom_tags": ["night sweats", "sleep problems"],
            "ethnicity_tags": [],
            "audience": "primary",
            "created_at": datetime.utcnow()
        },
        {
            "title": "Exercise and Menopause: Moving Your Way to Feeling Better",
            "summary": "How regular physical activity can help manage menopause symptoms and protect your health.",
            "content": """Regular exercise is one of the most effective ways to manage menopause symptoms and protect your long-term health.

**Benefits of exercise during menopause:**
- Reduces hot flush frequency
- Improves sleep quality
- Helps manage weight
- Boosts mood and reduces anxiety
- Protects bone health
- Supports heart health

**Best types of exercise:**
1. **Aerobic exercise** - Walking, swimming, cycling (aim for 150 minutes per week)
2. **Strength training** - Weights or resistance bands (2-3 times per week)
3. **Flexibility** - Yoga, stretching
4. **Balance exercises** - Important for bone health

**Getting started:**
- Start slowly if you're new to exercise
- Choose activities you enjoy
- Find an exercise buddy for motivation
- Set realistic goals

**Tips for exercising with symptoms:**
- Exercise in cooler parts of the day if hot flushes are a problem
- Wear breathable, moisture-wicking clothes
- Stay hydrated
- Listen to your body""",
            "category": "lifestyle",
            "tags": ["exercise", "fitness", "wellbeing"],
            "stages": ["pre-menopause", "peri-menopause", "menopause", "post-menopause"],
            "symptom_tags": [],
            "ethnicity_tags": [],
            "audience": "primary",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.articles.insert_many(articles)
    
    # Seed Groups
    groups = [
        {
            "name": "Hot Flushes & Sleep",
            "description": "Share tips and support for managing hot flushes and getting better sleep",
            "topics": ["hot flushes", "sleep", "night sweats"],
            "is_public": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Working Through Menopause",
            "description": "Support for managing menopause while maintaining a career",
            "topics": ["work", "career", "productivity"],
            "is_public": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Fitness & Movement",
            "description": "Exercise tips, workout buddies, and staying active during menopause",
            "topics": ["exercise", "fitness", "movement"],
            "is_public": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Early Menopause Support",
            "description": "For women experiencing perimenopause or menopause earlier than expected",
            "topics": ["early menopause", "perimenopause", "support"],
            "is_public": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.groups.insert_many(groups)
    
    # Seed Events
    events = [
        {
            "title": "Understanding HRT: Q&A with Dr. Sarah Mitchell",
            "description": "Join menopause specialist Dr. Sarah Mitchell for an informative session about hormone replacement therapy, including benefits, risks, and whether it might be right for you.",
            "event_type": "webinar",
            "is_online": True,
            "link": "https://example.com/hrt-webinar",
            "start_time": datetime.utcnow() + timedelta(days=7),
            "end_time": datetime.utcnow() + timedelta(days=7, hours=1),
            "registration_link": "https://example.com/register/hrt",
            "created_at": datetime.utcnow()
        },
        {
            "title": "Morning Walk Group - London",
            "description": "Join us for a gentle morning walk in Hyde Park. All fitness levels welcome. Meet at the Serpentine café.",
            "event_type": "walk",
            "is_online": False,
            "location": "Hyde Park, London",
            "start_time": datetime.utcnow() + timedelta(days=3),
            "registration_link": "https://example.com/register/walk",
            "created_at": datetime.utcnow()
        },
        {
            "title": "Yoga for Menopause - Online Class",
            "description": "A gentle yoga session designed specifically for women in menopause. Focus on stress relief, flexibility, and breathwork.",
            "event_type": "exercise",
            "is_online": True,
            "link": "https://example.com/yoga-class",
            "start_time": datetime.utcnow() + timedelta(days=5),
            "end_time": datetime.utcnow() + timedelta(days=5, minutes=45),
            "registration_link": "https://example.com/register/yoga",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.events.insert_many(events)
    
    # Seed Specialists
    specialists = [
        {
            "name": "Dr. Sarah Mitchell",
            "credentials": "MBBS, MRCGP, Menopause Specialist",
            "bio": "Dr. Mitchell has over 15 years of experience in women's health and is a certified menopause specialist. She takes a holistic approach to menopause care.",
            "specialties": ["menopause", "HRT", "women's health"],
            "services": ["Consultations", "HRT prescribing", "Symptom management"],
            "is_online": True,
            "location": "London, UK",
            "website": "https://example.com/dr-mitchell",
            "booking_link": "https://example.com/book/dr-mitchell"
        },
        {
            "name": "Emma Thompson, RD",
            "credentials": "BSc Nutrition, Registered Dietitian",
            "bio": "Emma specializes in nutrition during perimenopause and menopause, helping women manage symptoms through diet and lifestyle changes.",
            "specialties": ["nutrition", "diet", "weight management"],
            "services": ["Nutrition consultations", "Meal planning", "Weight management programs"],
            "is_online": True,
            "location": "Manchester, UK",
            "email": "emma@example.com",
            "booking_link": "https://example.com/book/emma"
        },
        {
            "name": "Dr. James Chen",
            "credentials": "PhD Psychology, CBT Therapist",
            "bio": "Dr. Chen specializes in cognitive behavioral therapy for women experiencing anxiety and mood changes during menopause.",
            "specialties": ["therapy", "anxiety", "CBT", "mood"],
            "services": ["Individual therapy", "CBT sessions", "Anxiety management"],
            "is_online": True,
            "location": "Birmingham, UK",
            "website": "https://example.com/dr-chen",
            "booking_link": "https://example.com/book/dr-chen"
        }
    ]
    
    await db.specialists.insert_many(specialists)
    
    return {"message": "Data seeded successfully", "symptoms": len(symptoms), "articles": len(articles), "groups": len(groups), "events": len(events), "specialists": len(specialists)}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
