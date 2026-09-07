from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import json
import logging
import secrets
import uuid
import jwt
import hashlib
import smtplib
import email.utils
from email.mime.text import MIMEText
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import re
import asyncio
import urllib.parse
import urllib.request
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')  

# ── Configuration ──────────────────────────────────────────────────────────
MONGO_URL = os.environ.get('MONGO_URL', '')
DB_NAME = os.environ.get('DB_NAME', 'civicresolve')
JWT_SECRET = os.environ.get('JWT_SECRET', 'civicresolve-sih-demo-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 72

# ── Google OAuth (Sign in / Sign up with Google) ────────────────────────────
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
# Must EXACTLY match a redirect URI registered in Google Cloud Console
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')
# Where the browser is sent after Google login completes (your React app)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ── Email (SMTP for OTP delivery) ──────────────────────────────────────────
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', SMTP_USER)
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'CivicResolve')

# ── Data directory for file persistence ──────────────────────────────────────
DATA_DIR = ROOT_DIR / 'data'
USERS_FILE = DATA_DIR / 'users.json'
COMPLAINTS_FILE = DATA_DIR / 'complaints.json'


def _load_json(path: Path, default: list, convert_dates: list[str] | None = None) -> list:
    """Load JSON data from a file, returning default if file doesn't exist.
    If convert_dates is provided, those keys will be parsed back into datetime objects."""
    try:
        if path.exists():
            with open(path, 'r') as f:
                data = json.load(f)
            if convert_dates:
                for item in data:
                    for key in convert_dates:
                        val = item.get(key)
                        if isinstance(val, str):
                            try:
                                item[key] = datetime.fromisoformat(val)
                            except (ValueError, TypeError):
                                pass
            return data
    except (json.JSONDecodeError, OSError) as e:
        logger.warning(f"Failed to load {path}: {e}")
    return default


def _save_json(path: Path, data: list):
    """Save JSON data to a file, creating directory if needed."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        # Convert datetime objects to ISO strings for JSON serialization
        def serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")
        with open(path, 'w') as f:
            json.dump(data, f, default=serializer, indent=2)
    except OSError as e:
        logger.error(f"Failed to save {path}: {e}")


# ── MongoDB (optional) / In-memory fallback ─────────────────────────────────
client = None
db = None

otp_store = {}          # email -> { otp, expires_at }
users_collection = _load_json(USERS_FILE, [], convert_dates=["createdAt"])
complaints_collection = _load_json(COMPLAINTS_FILE, [], convert_dates=["submittedAt", "workStartedAt", "delayNotifiedAt", "apologySentAt", "escalatedAt"])

if MONGO_URL:
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]


logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

api_router = APIRouter(prefix="/api")

# ── Email helper ────────────────────────────────────────────────────────────
def _send_email_sync(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP. Returns True if sent, False if not configured."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not set — email would not be sent")
        return False

    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = email.utils.formataddr((EMAIL_FROM_NAME, EMAIL_FROM))
        msg["To"] = to_email

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM, [to_email], msg.as_string())

        logger.info(f"Email sent to {to_email} — subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email without blocking the event loop (runs SMTP in a worker thread)."""
    return await asyncio.to_thread(_send_email_sync, to_email, subject, body)


async def _send_status_notification(complaint: dict, status: str):
    """Send email notification when complaint status changes to in-progress or resolved."""
    user_email = complaint.get("userEmail")
    if not user_email:
        return

    user_name = complaint.get("userName", "User")
    issue_type = complaint.get("issueType", "")
    dept_name = complaint.get("assignedDepartment", "")
    officer_phone = complaint.get("officerPhone", "Not assigned yet")
    officer_name = complaint.get("assignedOfficer", "Concerned Officer")
    issue_label = DEPARTMENTS.get(issue_type, issue_type.replace("_", " ").title())

    submitted_date = complaint.get("submittedAt")
    if isinstance(submitted_date, datetime):
        submitted_str = submitted_date.strftime("%B %d, %Y")
    else:
        submitted_str = str(submitted_date)

    if status == "in-progress":
        subject = f"Good News - Work has started on your {issue_label} complaint"
        body = (
            f"Dear {user_name},\n\n"
            f"We are happy to inform you that work has now started on your {issue_label} complaint "
            f"that was submitted on {submitted_str}.\n\n"
            f"Our team is actively working to resolve this issue. You can expect an update soon.\n\n"
            f"Complaint Details:\n"
            f"- Issue: {issue_label}\n"
            f"- Location: {complaint.get('location', 'Not specified')}\n"
            f"- Department: {dept_name}\n"
            f"- Officer: {officer_name}\n"
            f"- Contact: {officer_phone}\n\n"
            f"We appreciate your patience and will keep you updated.\n\n"
            f"Regards,\nCivicResolve Team"
        )
    else:  # resolved
        subject = f"Resolved - Your {issue_label} complaint has been fixed"
        body = (
            f"Dear {user_name},\n\n"
            f"Great news! Your {issue_label} complaint submitted on {submitted_str} has been resolved.\n\n"
            f"We hope this has addressed your concern. If you feel the issue persists or need further assistance, "
            f"please feel free to submit a new complaint.\n\n"
            f"Complaint Details:\n"
            f"- Issue: {issue_label}\n"
            f"- Location: {complaint.get('location', 'Not specified')}\n"
            f"- Department: {dept_name}\n"
            f"- Officer: {officer_name}\n\n"
            f"Thank you for using CivicResolve.\n\n"
            f"Regards,\nCivicResolve Team"
        )

    await _send_email(user_email, subject, body)


# ══════════════════════════════════════════════════════════════════════════════
#  MODELS
# ══════════════════════════════════════════════════════════════════════════════

class OTPRequest(BaseModel):
    email: str


class OTPVerify(BaseModel):
    email: str
    otp: str
    name: str
    phone: str = ""
    password: Optional[str] = None  # set during signup flow


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    createdAt: datetime


class TokenResponse(BaseModel):
    success: bool
    token: str
    user: UserOut


class ComplaintIn(BaseModel):
    issueType: str
    description: str
    location: str
    contactName: Optional[str] = ""
    contactPhone: Optional[str] = ""
    photo: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    userId: str
    userName: str
    userEmail: str = ""
    userPhone: str
    issueType: str
    severity: str = "low"  # auto-calculated
    description: str
    location: str
    photo: Optional[str] = None
    status: str
    assignedDepartment: str
    assignedDeptSlug: str = "general"
    assignedOfficer: Optional[str] = None
    officerPhone: Optional[str] = None
    submittedAt: datetime
    workStartedAt: Optional[datetime] = None
    delayNotifiedAt: Optional[datetime] = None
    apologySentAt: Optional[datetime] = None
    escalatedAt: Optional[datetime] = None


class DeptLoginRequest(BaseModel):
    username: str
    password: str


class DeptLoginResponse(BaseModel):
    success: bool
    token: str
    user: dict


class StatusUpdate(BaseModel):
    status: str


class OfficerAssign(BaseModel):
    officerUsername: str


class AddOfficerRequest(BaseModel):
    name: str
    username: str
    phone: str


class GovLoginRequest(BaseModel):
    username: str
    password: str


class GovLoginResponse(BaseModel):
    success: bool
    token: str
    user: dict


class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""


class SignInRequest(BaseModel):
    email: str
    password: str


class CheckEmailRequest(BaseModel):
    email: str


class CheckEmailResponse(BaseModel):
    exists: bool
    email: str


# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════════

DEPARTMENTS = {
    "garbage": "Municipal Department",
    "pothole": "Public Works Department (PWD)",
    "streetlight": "Electrical Department",
    "drainage": "Municipal Department",
    "water": "Water Department",
    "traffic": "General Administration",
    "park": "Municipal Department",
    "other": "General Administration",
}

DEPT_SLUG_MAP = {
    "garbage": "municipal",
    "drainage": "municipal",
    "park": "municipal",
    "streetlight": "electrical",
    "pothole": "pwd",
    "water": "water",
    "traffic": "general",
    "other": "general",
}

DEPT_DISPLAY = {
    "municipal": "Municipal Department",
    "electrical": "Electrical Department",
    "pwd": "Public Works Department (PWD)",
    "general": "General Administration",
    "water": "Water Department",
}

# ── Department Officers (fixed credentials) ────────────────────────────────
# Structure: dept_slug -> { head: {name, username, password, phone}, officers: [...] }
DEPARTMENT_USERS = {
    "municipal": {
        "head": {"name": "Municipal Commissioner", "username": "municipal_head", "password": "head@123", "phone": "9876543210"},
        "officers": [
            {"name": "Officer Rajesh", "username": "municipal_officer_1", "password": "officer@123", "phone": "9876543211"},
            {"name": "Officer Priya", "username": "municipal_officer_2", "password": "officer@123", "phone": "9876543212"},
            {"name": "Officer Arun", "username": "municipal_officer_3", "password": "officer@123", "phone": "9876543213"},
            {"name": "Officer Meena", "username": "municipal_officer_4", "password": "officer@123", "phone": "9876543214"},
            {"name": "Officer Suresh", "username": "municipal_officer_5", "password": "officer@123", "phone": "9876543215"},
        ]
    },
    "electrical": {
        "head": {"name": "Electrical Chief Engineer", "username": "electrical_head", "password": "head@123", "phone": "9876543220"},
        "officers": [
            {"name": "Officer Deepak", "username": "electrical_officer_1", "password": "officer@123", "phone": "9876543221"},
            {"name": "Officer Kavita", "username": "electrical_officer_2", "password": "officer@123", "phone": "9876543222"},
            {"name": "Officer Ravi", "username": "electrical_officer_3", "password": "officer@123", "phone": "9876543223"},
        ]
    },
    "pwd": {
        "head": {"name": "PWD Superintendent", "username": "pwd_head", "password": "head@123", "phone": "9876543230"},
        "officers": [
            {"name": "Officer Venkat", "username": "pwd_officer_1", "password": "officer@123", "phone": "9876543231"},
            {"name": "Officer Anjali", "username": "pwd_officer_2", "password": "officer@123", "phone": "9876543232"},
            {"name": "Officer Gopal", "username": "pwd_officer_3", "password": "officer@123", "phone": "9876543233"},
            {"name": "Officer Nirmala", "username": "pwd_officer_4", "password": "officer@123", "phone": "9876543234"},
        ]
    },
    "general": {
        "head": {"name": "General Secretary", "username": "general_head", "password": "head@123", "phone": "9876543240"},
        "officers": [
            {"name": "Officer Rohan", "username": "general_officer_1", "password": "officer@123", "phone": "9876543241"},
            {"name": "Officer Sneha", "username": "general_officer_2", "password": "officer@123", "phone": "9876543242"},
            {"name": "Officer Manoj", "username": "general_officer_3", "password": "officer@123", "phone": "9876543243"},
        ]
    },
    "water": {
        "head": {"name": "Water Department Director", "username": "water_head", "password": "head@123", "phone": "9876543250"},
        "officers": [
            {"name": "Officer Lakshmi", "username": "water_officer_1", "password": "officer@123", "phone": "9876543251"},
            {"name": "Officer Krishna", "username": "water_officer_2", "password": "officer@123", "phone": "9876543252"},
            {"name": "Officer Padma", "username": "water_officer_3", "password": "officer@123", "phone": "9876543253"},
        ]
    },
}

def _find_dept_user(username: str, password: str):
    """Find a department user by username/password and return (dept_slug, role, user_info)."""
    for dept_slug, dept_data in DEPARTMENT_USERS.items():
        if dept_data["head"]["username"] == username and dept_data["head"]["password"] == password:
            return dept_slug, "head", dept_data["head"]
        for officer in dept_data["officers"]:
            if officer["username"] == username and officer["password"] == password:
                return dept_slug, "officer", officer
    return None, None, None


# ── AI Severity Engine (keyword-based, no API key needed) ────────────────
# High-urgency keywords that indicate immediate danger, health hazard, or safety risk
HIGH_SEVERITY_KEYWORDS = [
    "stray dog", "stray animal", "health hazard", "health risk", "falling sick", "children",
    "flood", "flooding", "waterlog", "electrocution", "exposed wire", "live wire",
    "accident", "injury", "injured", "emergency", "urgent", "immediate",
    "overflow", "sewage", "rats", "mosquito", "disease", "pest",
    "fire", "smoke", "gas leak", "collapse", "crack", "dangerous",
    "attack", "snake", "scorpion", "broken glass", "sharp object",
]

# Medium-urgency keywords indicating significant inconvenience or damage
MEDIUM_SEVERITY_KEYWORDS = [
    "broken", "damage", "damaged", "not working", "malfunction", "cracks",
    "foul smell", "bad odor", "stench", "leak", "leaking", "blocked", "clogged",
    "dark", "no light", "flickering", "pothole", "rough road", "uneven",
    "overgrown", "weed", "trash", "litter", "debris", "waste",
    "unusable", "dirty", "filthy", "rotten", "decay",
]


def _ai_calculate_severity(description: str, submitted_at: datetime) -> str:
    """Calculate severity using AI keyword analysis of the description + time factor.
    
    - High: description contains urgent/hazard keywords → "high"
    - Medium: description contains damage/inconvenience keywords → "medium"
    - Default: keyword score is low AND complaint is recent → "low"
    - Time boost: pending 6+ days auto-escalates to high, 3+ to medium
    """
    desc_lower = description.lower()

    # Score based on keyword matches
    high_score = sum(1 for kw in HIGH_SEVERITY_KEYWORDS if kw in desc_lower)
    medium_score = sum(1 for kw in MEDIUM_SEVERITY_KEYWORDS if kw in desc_lower)

    # Normalize by description length to avoid bias from long descriptions
    word_count = max(len(desc_lower.split()), 1)
    high_density = high_score / word_count * 100  # percentage
    medium_density = medium_score / word_count * 100

    # Time factor
    days_pending = (datetime.now(timezone.utc) - submitted_at).days

    # Decision logic
    if high_score >= 2 or high_density >= 3.0:
        return "high"
    if medium_score >= 3 or medium_density >= 5.0 or high_score >= 1:
        return "medium"
    if days_pending >= 6:
        return "high"  # time-escalated
    if days_pending >= 3:
        return "medium"  # time-escalated
    return "low"


def _calculate_severity(description: str, submitted_at: datetime) -> dict:
    """Calculate severity with AI analysis and return both severity level and reason."""
    severity = _ai_calculate_severity(description, submitted_at)

    # Generate a human-readable reason for transparency
    desc_lower = description.lower()
    high_matches = [kw for kw in HIGH_SEVERITY_KEYWORDS if kw in desc_lower]
    medium_matches = [kw for kw in MEDIUM_SEVERITY_KEYWORDS if kw in desc_lower]

    reasons = []
    if high_matches:
        trigger = high_matches[0]
        reasons.append(f"Detected urgent keywords: '{trigger}'")
    elif medium_matches:
        trigger = medium_matches[0]
        reasons.append(f"Detected issue keywords: '{trigger}'")

    days_pending = (datetime.now(timezone.utc) - submitted_at).days
    if days_pending >= 6:
        reasons.append(f"Pending for {days_pending} days — auto-escalated")
    elif days_pending >= 3:
        reasons.append(f"Pending for {days_pending} days — elevated priority")

    return {
        "severity": severity,
        "reason": "; ".join(reasons) if reasons else "Routine complaint — standard priority",
        "keywordHits": {
            "high": high_matches[:3],
            "medium": medium_matches[:3],
        }
    }


def _create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")

    if db:
        user = await db.users.find_one({"_id": user_id})
    else:
        user = next((u for u in users_collection if u["_id"] == user_id), None)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _validate_indian_phone(phone: str):
    """Validate that the phone number is a valid Indian mobile number."""
    cleaned = phone.replace(" ", "")
    if not cleaned.isdigit():
        raise HTTPException(status_code=400, detail="Phone number must contain only digits")
    if len(cleaned) != 10:
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits")
    if not cleaned.startswith(('6', '7', '8', '9')):
        raise HTTPException(status_code=400, detail="Please enter a valid Indian mobile number (starts with 6-9)")
    return cleaned


def _validate_email(email: str):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    cleaned = email.strip().lower()
    if not re.match(pattern, cleaned):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
    return cleaned


def _generate_otp() -> str:
    """Generate a secure random 6-digit OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def _hash_password(password: str) -> str:
    """Hash a password using salted SHA-256."""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${pwd_hash}"


def _verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against the stored salted hash."""
    if "$" not in stored_hash:
        return False
    salt, pwd_hash = stored_hash.split("$", 1)
    return hashlib.sha256((salt + password).encode()).hexdigest() == pwd_hash


# Store pending signups (email -> {name, phone, password_hash}) until OTP is verified
pending_signups = {}


# ══════════════════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@api_router.post("/auth/send-otp")
async def send_otp(body: OTPRequest):
    email = _validate_email(body.email.strip())

    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_store[email] = {"otp": otp, "expires": expires}

    # Send OTP via email
    subject = "Your CivicResolve OTP Code"
    body_text = (
        f"Dear User,\n\n"
        f"Your CivicResolve verification code is: {otp}\n\n"
        f"This code is valid for 5 minutes. Please do not share this code with anyone.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Regards,\nCivicResolve Team"
    )
    email_sent = await _send_email(email, subject, body_text)

    # Always log the OTP to console for debugging / dev fallback
    logger.info(f"OTP for {email}: {otp} | Email sent: {email_sent}")

    return {
        "success": True,
        "message": "OTP sent to your email" if email_sent else "OTP generated (check server console)",
        "email_sent": email_sent,
    }


@api_router.post("/auth/signup")
async def signup(body: SignUpRequest):
    """Sign up a new user. Validates uniqueness, stores pending signup, sends OTP."""
    email = _validate_email(body.email.strip())
    name = body.name.strip()
    phone = _validate_indian_phone(body.phone.strip()) if body.phone else None
    password = body.password.strip()

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check if email already exists
    if db:
        existing = await db.users.find_one({"email": email})
    else:
        existing = next((u for u in users_collection if u["email"] == email), None)

    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in instead.")

    # Hash the password and store pending signup
    password_hash = _hash_password(password)
    pending_signups[email] = {
        "name": name,
        "phone": phone or "",
        "password_hash": password_hash,
    }

    # Send OTP
    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_store[email] = {"otp": otp, "expires": expires}

    subject = "Verify your CivicResolve email"
    body_text = (
        f"Dear {name},\n\n"
        f"Thank you for signing up with CivicResolve!\n\n"
        f"Your verification code is: {otp}\n\n"
        f"This code is valid for 5 minutes. Please do not share this code with anyone.\n\n"
        f"Regards,\nCivicResolve Team"
    )
    email_sent = await _send_email(email, subject, body_text)
    logger.info(f"Signup OTP for {email}: {otp} | Email sent: {email_sent}")

    return {
        "success": True,
        "message": "OTP sent to your email" if email_sent else "OTP generated (check server console)",
        "email_sent": email_sent,
    }


@api_router.post("/auth/verify-otp", response_model=TokenResponse)
async def verify_otp(body: OTPVerify):
    email = _validate_email(body.email.strip())
    name = body.name.strip()
    otp_entered = body.otp.strip()
    phone = _validate_indian_phone(body.phone.strip()) if body.phone else None

    stored = otp_store.get(email)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")

    if datetime.now(timezone.utc) > stored["expires"]:
        otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")

    if stored["otp"] != otp_entered:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    otp_store.pop(email, None)

    # Check if this is a signup (pending registration with password)
    pending = pending_signups.pop(email, None)

    if pending:
        # This is a signup - create user with password hash
        password_hash = pending["password_hash"]
        new_user = {
            "_id": str(uuid.uuid4()),
            "name": pending["name"],
            "email": email,
            "phone": pending["phone"],
            "passwordHash": password_hash,
            "createdAt": datetime.now(timezone.utc),
        }
        if db:
            await db.users.insert_one(new_user)
            user = new_user
        else:
            users_collection.append(new_user)
            _save_json(USERS_FILE, users_collection)
            user = new_user
    else:
        # Legacy / simple OTP login - find or create user
        existing_user = None
        if db:
            existing_user = await db.users.find_one({"email": email})
        else:
            existing_user = next((u for u in users_collection if u["email"] == email), None)

        if existing_user:
            user = existing_user
            # Update phone if provided
            if phone and phone != user.get("phone"):
                if db:
                    await db.users.update_one({"email": email}, {"$set": {"phone": phone}})
                user["phone"] = phone
        else:
            new_user = {
                "_id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "phone": phone or "",
                "createdAt": datetime.now(timezone.utc),
            }
            if db:
                await db.users.insert_one(new_user)
                user = new_user
            else:
                users_collection.append(new_user)
                _save_json(USERS_FILE, users_collection)
                user = new_user

    token = _create_token(user["_id"])
    return TokenResponse(
        success=True,
        token=token,
        user=UserOut(id=user["_id"], name=user["name"],
                     email=user["email"], phone=user["phone"], createdAt=user["createdAt"]),
    )


@api_router.post("/auth/signin")
async def signin(body: SignInRequest):
    """Sign in with email + password (no OTP required).
    If user has no password set (legacy OTP-only account), sends OTP to set one."""
    email = _validate_email(body.email.strip())
    password = body.password.strip()

    # Find user by email
    if db:
        user = await db.users.find_one({"email": email})
    else:
        user = next((u for u in users_collection if u["email"] == email), None)

    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email. Please sign up first.")

    # Check if user has a password (could be old OTP-only user)
    stored_hash = user.get("passwordHash")
    if not stored_hash:
        # Send OTP for password setup
        otp = _generate_otp()
        expires = datetime.now(timezone.utc) + timedelta(minutes=5)
        otp_store[email] = {"otp": otp, "expires": expires}

        # Store temporary info for password setup
        pending_signups[email] = {
            "name": user.get("name", ""),
            "phone": user.get("phone", ""),
            "password_hash": None,  # Will be set when user enters new password
            "setup_mode": True,
        }

        subject = "Set your CivicResolve password"
        body_text = (
            f"Dear {user.get('name', 'User')},\n\n"
            f"Your account needs a password to proceed. Use this code to set it up:\n\n"
            f"OTP: {otp}\n\n"
            f"This code is valid for 5 minutes.\n\n"
            f"Regards,\nCivicResolve Team"
        )
        email_sent = await _send_email(email, subject, body_text)
        logger.info(f"Password setup OTP for {email}: {otp} | Email sent: {email_sent}")

        return {
            "success": False,
            "needs_password_setup": True,
            "email": email,
            "message": "OTP sent to your email" if email_sent else "OTP generated (check server console)",
            "email_sent": email_sent,
        }

    # Verify password
    if not _verify_password(password, stored_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    token = _create_token(user["_id"])
    return TokenResponse(
        success=True,
        token=token,
        user=UserOut(id=user["_id"], name=user["name"],
                     email=user["email"], phone=user["phone"], createdAt=user["createdAt"]),
    )


# ── Forgot Password Models ──
class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    password: str


class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str
    email_sent: bool = False


@api_router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest):
    """Send OTP for forgot password flow. User must exist."""
    email = _validate_email(body.email.strip())

    # Check user exists
    if db:
        user = await db.users.find_one({"email": email})
    else:
        user = next((u for u in users_collection if u["email"] == email), None)

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address.")

    # Generate and store OTP
    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp_store[email] = {"otp": otp, "expires": expires}

    # Store a flag so reset-password knows this is a forgot-password flow
    pending_signups[email] = {
        "name": user.get("name", "User"),
        "phone": user.get("phone", ""),
        "password_hash": None,
        "forgot_password": True,
    }

    subject = "Reset your CivicResolve Password"
    body_text = (
        f"Dear {user.get('name', 'User')},\n\n"
        f"We received a request to reset your password.\n\n"
        f"Your OTP code is: {otp}\n\n"
        f"This code is valid for 5 minutes. Please do not share this code with anyone.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Regards,\nCivicResolve Team"
    )
    email_sent = await _send_email(email, subject, body_text)
    logger.info(f"Forgot password OTP for {email}: {otp} | Email sent: {email_sent}")

    return ForgotPasswordResponse(
        success=True,
        message="OTP sent to your email" if email_sent else "OTP generated (check server console)",
        email_sent=email_sent,
    )


@api_router.post("/auth/reset-password", response_model=TokenResponse)
async def reset_password(body: ResetPasswordRequest):
    """Reset password after OTP verification. Works for all users (forgot password flow)."""
    email = _validate_email(body.email.strip())
    otp_entered = body.otp.strip()
    new_password = body.password.strip()

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Verify OTP
    stored = otp_store.get(email)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested. Please request a password reset first.")

    if datetime.now(timezone.utc) > stored["expires"]:
        otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if stored["otp"] != otp_entered:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    otp_store.pop(email, None)
    pending_signups.pop(email, None)

    # Find and update user password
    if db:
        user = await db.users.find_one({"email": email})
        if user:
            await db.users.update_one(
                {"email": email},
                {"$set": {"passwordHash": _hash_password(new_password)}}
            )
            user = await db.users.find_one({"email": email})
    else:
        user = next((u for u in users_collection if u["email"] == email), None)
        if user:
            user["passwordHash"] = _hash_password(new_password)
            _save_json(USERS_FILE, users_collection)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = _create_token(user["_id"])
    return TokenResponse(
        success=True,
        token=token,
        user=UserOut(id=user["_id"], name=user["name"],
                     email=user["email"], phone=user["phone"], createdAt=user["createdAt"]),
    )


@api_router.post("/auth/set-password", response_model=TokenResponse)
async def set_password(body: OTPVerify):
    """Set a password for an existing OTP-only account after OTP verification."""
    email = _validate_email(body.email.strip())
    otp_entered = body.otp.strip()
    new_password = body.password.strip() if body.password else ""

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Verify OTP
    stored = otp_store.get(email)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested. Please try signing in again.")

    if datetime.now(timezone.utc) > stored["expires"]:
        otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="OTP has expired. Please try signing in again.")

    if stored["otp"] != otp_entered:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    otp_store.pop(email, None)
    pending_signups.pop(email, None)

    # Find and update user
    if db:
        user = await db.users.find_one({"email": email})
        if user:
            await db.users.update_one(
                {"email": email},
                {"$set": {"passwordHash": _hash_password(new_password)}}
            )
            user = await db.users.find_one({"email": email})
    else:
        user = next((u for u in users_collection if u["email"] == email), None)
        if user:
            user["passwordHash"] = _hash_password(new_password)
            _save_json(USERS_FILE, users_collection)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = _create_token(user["_id"])
    return TokenResponse(
        success=True,
        token=token,
        user=UserOut(id=user["_id"], name=user["name"],
                     email=user["email"], phone=user["phone"], createdAt=user["createdAt"]),
    )


@api_router.post("/auth/gov-login", response_model=GovLoginResponse)
async def gov_login(body: GovLoginRequest):
    GOV_USERNAME = "admin"
    GOV_PASSWORD = "admin123"

    if body.username != GOV_USERNAME or body.password != GOV_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create a gov user with a fixed ID
    gov_user_id = "gov-admin-user"
    token = _create_token(gov_user_id)

    # Ensure gov user exists in the collection so get_current_user can find it
    if not db:
        exists = any(u["_id"] == gov_user_id for u in users_collection)
        if not exists:
            users_collection.append({
                "_id": gov_user_id,
                "name": "Government Admin",
                "email": "admin@civicresolve.gov",
                "phone": "",
                "createdAt": datetime.now(timezone.utc),
            })
            _save_json(USERS_FILE, users_collection)

    return GovLoginResponse(
        success=True,
        token=token,
        user={
            "id": gov_user_id,
            "name": "Government Admin",
            "role": "gov",
        },
    )


@api_router.post("/auth/check-email", response_model=CheckEmailResponse)
async def check_email(body: CheckEmailRequest):
    """Check if an email already exists in the database."""
    email = _validate_email(body.email.strip())

    if db:
        existing = await db.users.find_one({"email": email})
    else:
        existing = next((u for u in users_collection if u["email"] == email), None)

    return CheckEmailResponse(
        exists=existing is not None,
        email=email,
    )


@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "createdAt": user["createdAt"].isoformat() if isinstance(user["createdAt"], datetime) else user["createdAt"],
    }


# ══════════════════════════════════════════════════════════════════════════════
#  GOOGLE OAUTH — Sign In / Sign Up with Google
# ══════════════════════════════════════════════════════════════════════════════

def _google_exchange_code(code: str) -> dict:
    """Exchange the OAuth authorization code for access/id tokens."""
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }).encode()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def _google_fetch_profile(access_token: str) -> dict:
    """Fetch the user's profile from Google using the access token."""
    req = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def _google_redirect(frontend_path: str) -> RedirectResponse:
    """Redirect the browser to the React app (with token or an error code)."""
    return RedirectResponse(f"{FRONTEND_URL}{frontend_path}", status_code=302)


def _google_state_qs(state: Optional[str]) -> str:
    """Echo Google's state param (our post-login destination) back to the frontend.
    Only paths starting with '/' are accepted to avoid open-redirect abuse."""
    if state and state.startswith("/"):
        return "&" + urllib.parse.urlencode({"state": state})
    return ""


@api_router.get("/auth/google/callback")
async def google_callback(code: Optional[str] = None, error: Optional[str] = None, state: Optional[str] = None):
    """Google OAuth redirect target: exchange code, find-or-create the user, log them in.
    Works for both Sign Up (new user) and Sign In (existing user)."""
    state_qs = _google_state_qs(state)
    if error or not code:
        return _google_redirect(f"/auth/google/callback?error={error or 'access_denied'}{state_qs}")

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logger.error("Google OAuth attempted but GOOGLE_CLIENT_ID/SECRET not configured")
        return _google_redirect(f"/auth/google/callback?error=not_configured{state_qs}")

    try:
        tokens = await asyncio.to_thread(_google_exchange_code, code)
    except Exception as e:
        logger.error(f"Google token exchange failed: {e}")
        return _google_redirect(f"/auth/google/callback?error=token_exchange_failed{state_qs}")

    access_token = tokens.get("access_token")
    if not access_token:
        return _google_redirect(f"/auth/google/callback?error=invalid_token{state_qs}")

    try:
        profile = await asyncio.to_thread(_google_fetch_profile, access_token)
    except Exception as e:
        logger.error(f"Google profile fetch failed: {e}")
        return _google_redirect(f"/auth/google/callback?error=profile_fetch_failed{state_qs}")

    email = (profile.get("email") or "").strip().lower()
    if not email:
        return _google_redirect(f"/auth/google/callback?error=no_email{state_qs}")
    if not profile.get("email_verified"):
        return _google_redirect(f"/auth/google/callback?error=email_not_verified{state_qs}")

    name = (profile.get("name") or profile.get("given_name") or email.split("@")[0]).strip() or "Google User"
    google_id = str(profile.get("sub", ""))

    # Find-or-create the user (Google sign-in === sign-up for us)
    if db:
        user = await db.users.find_one({"email": email})
        if user:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"name": name, "googleId": google_id}},
            )
        else:
            user = {
                "_id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "phone": "",
                "googleId": google_id,
                "createdAt": datetime.now(timezone.utc),
            }
            await db.users.insert_one(user)
    else:
        user = next((u for u in users_collection if u["email"] == email), None)
        if not user:
            user = {
                "_id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "phone": "",
                "googleId": google_id,
                "createdAt": datetime.now(timezone.utc),
            }
            users_collection.append(user)
            _save_json(USERS_FILE, users_collection)
        else:
            user["name"] = name
            user["googleId"] = google_id
            _save_json(USERS_FILE, users_collection)

    token = _create_token(user["_id"])
    params = urllib.parse.urlencode({
        "token": token,
        "name": user["name"],
        "email": user["email"],
    })
    return _google_redirect(f"/auth/google/callback?{params}{state_qs}")


# ══════════════════════════════════════════════════════════════════════════════
#  COMPLAINT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@api_router.get("/complaints", response_model=List[ComplaintOut])
async def get_all_complaints():
    if db:
        docs = await db.complaints.find().sort("submittedAt", -1).to_list(5000)
        result = []
        for d in docs:
            d["id"] = str(d.pop("_id"))
            result.append(ComplaintOut(**d))
        return result
    else:
        docs = sorted(complaints_collection, key=lambda c: c.get("submittedAt", ""), reverse=True)
        result = []
        for d in docs:
            entry = {k: v for k, v in d.items() if k != "_id"}
            entry["id"] = d["_id"]
            result.append(ComplaintOut(**entry))
        return result


@api_router.get("/complaints/my", response_model=List[ComplaintOut])
async def get_my_complaints(user: dict = Depends(get_current_user)):
    uid = user["_id"]
    if db:
        docs = await db.complaints.find({"userId": uid}).sort("submittedAt", -1).to_list(500)
        result = []
        for d in docs:
            d["id"] = str(d.pop("_id"))
            result.append(ComplaintOut(**d))
        return result
    else:
        docs = sorted([c for c in complaints_collection if c["userId"] == uid],
                      key=lambda c: c.get("submittedAt", ""), reverse=True)
        result = []
        for d in docs:
            entry = {k: v for k, v in d.items() if k != "_id"}
            entry["id"] = d["_id"]
            result.append(ComplaintOut(**entry))
        return result


@api_router.post("/complaints", response_model=ComplaintOut, status_code=201)
async def create_complaint(body: ComplaintIn, user: dict = Depends(get_current_user)):
    complaint_id = str(uuid.uuid4())
    dept = DEPARTMENTS.get(body.issueType, "General Administration")
    dept_slug = DEPT_SLUG_MAP.get(body.issueType, "general")
    now = datetime.now(timezone.utc)

    complaint = {
        "_id": complaint_id,
        "userId": user["_id"],
        "userName": user["name"],
        "userEmail": user["email"],
        "userPhone": user["phone"],
        "issueType": body.issueType,
        "severity": _calculate_severity(body.description, now)["severity"],  # AI-powered severity
        "description": body.description,
        "location": body.location,
        "photo": body.photo,
        "status": "pending",
        "assignedDepartment": dept,
        "assignedDeptSlug": dept_slug,
        "assignedOfficer": None,
        "officerPhone": None,
        "submittedAt": now,
        "workStartedAt": None,
        "delayNotifiedAt": None,
        "apologySentAt": None,
        "escalatedAt": None,
    }

    # Auto-assign the best-ranked officer (fewest active complaints → most resolved → name)
    ranked = await _rank_officers_by_workload(dept_slug)
    if ranked:
        best = ranked[0]
        complaint["assignedOfficer"] = best["name"]
        complaint["officerPhone"] = best["phone"]

    if db:
        await db.complaints.insert_one(complaint)
    else:
        complaints_collection.append(complaint)
        _save_json(COMPLAINTS_FILE, complaints_collection)

    # Build the response with all fields
    return ComplaintOut(
        id=complaint_id,
        userId=user["_id"],
        userName=user["name"],
        userEmail=user.get("email", ""),
        userPhone=user.get("phone", ""),
        issueType=complaint["issueType"],
        severity=complaint["severity"],
        description=complaint["description"],
        location=complaint["location"],
        photo=complaint.get("photo"),
        status=complaint["status"],
        assignedDepartment=complaint["assignedDepartment"],
        assignedDeptSlug=complaint["assignedDeptSlug"],
        assignedOfficer=complaint.get("assignedOfficer"),
        officerPhone=complaint.get("officerPhone"),
        submittedAt=complaint["submittedAt"],
        workStartedAt=complaint.get("workStartedAt"),
        delayNotifiedAt=complaint.get("delayNotifiedAt"),
        apologySentAt=complaint.get("apologySentAt"),
        escalatedAt=complaint.get("escalatedAt"),
    )


@api_router.put("/complaints/{complaint_id}/status")
async def update_complaint_status(complaint_id: str, body: StatusUpdate,
                                   user: dict = Depends(get_current_user)):
    if body.status not in ("pending", "in-progress", "resolved"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    now = datetime.now(timezone.utc)
    update = {"status": body.status}
    if body.status == "in-progress":
        update["workStartedAt"] = now

    if db:
        result = await db.complaints.update_one(
            {"_id": complaint_id},
            {"$set": update},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Complaint not found")
        doc = await db.complaints.find_one({"_id": complaint_id})
    else:
        found = None
        for c in complaints_collection:
            if c["_id"] == complaint_id:
                for k, v in update.items():
                    c[k] = v
                found = c
                break
        if not found:
            raise HTTPException(status_code=404, detail="Complaint not found")
        doc = found
        _save_json(COMPLAINTS_FILE, complaints_collection)

    # Send email notification when status changes to in-progress or resolved
    if body.status in ("in-progress", "resolved") and doc.get("userEmail"):
        await _send_status_notification(doc, body.status)

    return {"success": True, "status": doc["status"]}


# ══════════════════════════════════════════════════════════════════════════════
#  DEPARTMENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

def _get_dept_user_from_token(token: str):
    """Decode token and find the department user. Returns (dept_slug, role, user_info) or raises HTTPException."""
    payload = _decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    sub = payload.get("sub", "")
    # sub is formatted as "dept:{dept_slug}:{role}:{username}"
    if not sub.startswith("dept:"):
        raise HTTPException(status_code=401, detail="Not a department user")
    parts = sub.split(":", 3)
    if len(parts) != 4:
        raise HTTPException(status_code=401, detail="Invalid token format")
    _, dept_slug, role, username = parts
    dept_data = DEPARTMENT_USERS.get(dept_slug)
    if not dept_data:
        raise HTTPException(status_code=401, detail="Department not found")
    if role == "head":
        user_info = dept_data["head"]
    else:
        user_info = next((o for o in dept_data["officers"] if o["username"] == username), None)
    if not user_info:
        raise HTTPException(status_code=401, detail="User not found")
    return dept_slug, role, user_info


async def get_current_dept_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    return _get_dept_user_from_token(token)


@api_router.post("/auth/dept-login", response_model=DeptLoginResponse)
async def dept_login(body: DeptLoginRequest):
    dept_slug, role, user_info = _find_dept_user(body.username.strip(), body.password)
    if not dept_slug:
        raise HTTPException(status_code=401, detail="Invalid department credentials")

    sub = f"dept:{dept_slug}:{role}:{user_info['username']}"
    payload = {
        "sub": sub,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return DeptLoginResponse(
        success=True,
        token=token,
        user={
            "id": sub,
            "name": user_info["name"],
            "username": user_info["username"],
            "phone": user_info["phone"],
            "deptSlug": dept_slug,
            "deptName": DEPT_DISPLAY[dept_slug],
            "role": role,
        },
    )


@api_router.get("/dept/complaints", response_model=List[ComplaintOut])
async def get_dept_complaints(dept_user: tuple = Depends(get_current_dept_user)):
    dept_slug, role, user_info = dept_user

    # Officers only ever see complaints assigned to them, never the whole department queue
    query = {"assignedDeptSlug": dept_slug}
    if role == "officer":
        query["assignedOfficer"] = user_info["name"]

    if db:
        docs = await db.complaints.find(query).sort("submittedAt", -1).to_list(5000)
        result = []
        for d in docs:
            d["id"] = str(d.pop("_id"))
            result.append(ComplaintOut(**d))
        return result
    else:
        docs = sorted([c for c in complaints_collection if all(c.get(k) == v for k, v in query.items())],
                      key=lambda c: c.get("submittedAt", ""), reverse=True)
        result = []
        for d in docs:
            entry = {k: v for k, v in d.items() if k != "_id"}
            entry["id"] = d["_id"]
            result.append(ComplaintOut(**entry))
        return result


@api_router.put("/dept/complaints/{complaint_id}/status")
async def update_dept_complaint_status(complaint_id: str, body: StatusUpdate,
                                        dept_user: tuple = Depends(get_current_dept_user)):
    dept_slug, role, user_info = dept_user

    if body.status not in ("pending", "in-progress", "resolved"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    now = datetime.now(timezone.utc)
    update = {"status": body.status}
    if body.status == "in-progress":
        update["workStartedAt"] = now
    if body.status == "in-progress":
        update["workStartedAt"] = now

    if db:
        # Verify complaint belongs to this department
        doc = await db.complaints.find_one({"_id": complaint_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Complaint not found")
        if doc.get("assignedDeptSlug") != dept_slug:
            raise HTTPException(status_code=403, detail="This complaint is not assigned to your department")
        # Officers may only update complaints assigned to them
        if role == "officer" and doc.get("assignedOfficer") != user_info["name"]:
            raise HTTPException(status_code=403, detail="You can only update complaints assigned to you")

        # Only auto-assign officer if not already assigned by head
        if body.status == "in-progress" and not doc.get("assignedOfficer"):
            update["assignedOfficer"] = user_info["name"]
            update["officerPhone"] = user_info["phone"]

        await db.complaints.update_one({"_id": complaint_id}, {"$set": update})
        doc = await db.complaints.find_one({"_id": complaint_id})
    else:
        found = None
        for c in complaints_collection:
            if c["_id"] == complaint_id:
                if c.get("assignedDeptSlug") != dept_slug:
                    raise HTTPException(status_code=403, detail="This complaint is not assigned to your department")
                # Officers may only update complaints assigned to them
                if role == "officer" and c.get("assignedOfficer") != user_info["name"]:
                    raise HTTPException(status_code=403, detail="You can only update complaints assigned to you")
                # Only auto-assign officer if not already assigned by head
                if body.status == "in-progress" and not c.get("assignedOfficer"):
                    c["assignedOfficer"] = user_info["name"]
                    c["officerPhone"] = user_info["phone"]
                for k, v in update.items():
                    c[k] = v
                found = c
                break
        if not found:
            raise HTTPException(status_code=404, detail="Complaint not found")
        doc = found
        _save_json(COMPLAINTS_FILE, complaints_collection)

    return {"success": True, "status": doc["status"], "assignedOfficer": doc.get("assignedOfficer"), "officerPhone": doc.get("officerPhone")}


@api_router.put("/dept/complaints/{complaint_id}/assign")
async def assign_officer(complaint_id: str, body: OfficerAssign,
                          dept_user: tuple = Depends(get_current_dept_user)):
    dept_slug, role, user_info = dept_user

    if role != "head":
        raise HTTPException(status_code=403, detail="Only department head can assign officers")

    # Find the officer in this department
    dept_data = DEPARTMENT_USERS.get(dept_slug)
    assigned_officer = None
    for off in dept_data["officers"]:
        if off["username"] == body.officerUsername:
            assigned_officer = off
            break

    if not assigned_officer:
        raise HTTPException(status_code=400, detail="Officer not found in this department")

    update = {
        "assignedOfficer": assigned_officer["name"],
        "officerPhone": assigned_officer["phone"],
    }

    if db:
        doc = await db.complaints.find_one({"_id": complaint_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Complaint not found")
        if doc.get("assignedDeptSlug") != dept_slug:
            raise HTTPException(status_code=403, detail="Not your department's complaint")
        await db.complaints.update_one({"_id": complaint_id}, {"$set": update})
    else:
        for c in complaints_collection:
            if c["_id"] == complaint_id:
                if c.get("assignedDeptSlug") != dept_slug:
                    raise HTTPException(status_code=403, detail="Not your department's complaint")
                for k, v in update.items():
                    c[k] = v
                _save_json(COMPLAINTS_FILE, complaints_collection)
                break

    return {"success": True, **update}


@api_router.get("/dept/officers")
async def get_dept_officers(dept_user: tuple = Depends(get_current_dept_user)):
    """Return the department head and officers, each officer with live workload counts."""
    dept_slug, role, user_info = dept_user
    return await _get_officers_with_counts(dept_slug)


@api_router.get("/dept/my-complaints")
async def get_my_dept_complaints(dept_user: tuple = Depends(get_current_dept_user)):
    """Officers see ONLY their assigned complaints. Heads see ALL department complaints."""
    dept_slug, role, user_info = dept_user
    dept_data = DEPARTMENT_USERS.get(dept_slug, {})
    officers = dept_data.get("officers", [])

    # Get the officer name for matching
    if role == "officer":
        officer_name = user_info["name"]
    else:
        officer_name = None  # head sees all

    if db:
        if officer_name:
            # Officer: only see complaints assigned to them
            docs = await db.complaints.find({
                "assignedDeptSlug": dept_slug,
                "assignedOfficer": officer_name
            }).sort("submittedAt", -1).to_list(500)
        else:
            # Head: sees all department complaints
            docs = await db.complaints.find({
                "assignedDeptSlug": dept_slug
            }).sort("submittedAt", -1).to_list(500)
        result = []
        for d in docs:
            d["id"] = str(d.pop("_id"))
            result.append(ComplaintOut(**d))
        return result
    else:
        if officer_name:
            # Officer: only see complaints assigned to them
            docs = [c for c in complaints_collection if c.get("assignedDeptSlug") == dept_slug 
                    and c.get("assignedOfficer") == officer_name]
        else:
            # Head: sees all department complaints
            docs = [c for c in complaints_collection if c.get("assignedDeptSlug") == dept_slug]
        docs = sorted(docs, key=lambda c: c.get("submittedAt", ""), reverse=True)
        result = []
        for d in docs:
            entry = {k: v for k, v in d.items() if k != "_id"}
            entry["id"] = d["_id"]
            result.append(ComplaintOut(**entry))
        return result


@api_router.post("/dept/officers")
async def add_officer(body: AddOfficerRequest, dept_user: tuple = Depends(get_current_dept_user)):
    """HOD can add a new officer to their department."""
    dept_slug, role, user_info = dept_user

    if role != "head":
        raise HTTPException(status_code=403, detail="Only department head can add officers")

    # Validate phone
    phone = body.phone.strip()
    if len(phone) != 10 or not phone.isdigit():
        raise HTTPException(status_code=400, detail="Phone must be 10 digits")

    # Check if username already exists in any department
    for d_slug, d_data in DEPARTMENT_USERS.items():
        if d_data["head"]["username"] == body.username:
            raise HTTPException(status_code=400, detail="Username already exists")
        for off in d_data["officers"]:
            if off["username"] == body.username:
                raise HTTPException(status_code=400, detail="Username already exists")

    # Add new officer
    new_officer = {
        "name": body.name.strip(),
        "username": body.username.strip(),
        "password": "officer@123",  # default password, should be changed on first login
        "phone": phone,
    }
    DEPARTMENT_USERS[dept_slug]["officers"].append(new_officer)

    return {
        "success": True,
        "message": f"Officer '{body.name}' added to {DEPT_DISPLAY[dept_slug]}",
        "officer": new_officer,
    }


@api_router.delete("/dept/officers/{username}")
async def remove_officer(username: str, dept_user: tuple = Depends(get_current_dept_user)):
    """HOD can remove an officer from their department."""
    dept_slug, role, user_info = dept_user

    if role != "head":
        raise HTTPException(status_code=403, detail="Only department head can remove officers")

    dept_data = DEPARTMENT_USERS.get(dept_slug, {})
    officers = dept_data.get("officers", [])

    removed_officer = None
    for i, off in enumerate(officers):
        if off["username"] == username:
            removed_officer = officers.pop(i)
            break

    if not removed_officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    removed_name = removed_officer["name"]
    reassigned_ids: list[str] = []

    if db:
        cursor = db.complaints.find(
            {
                "assignedDeptSlug": dept_slug,
                "assignedOfficer": removed_name,
                "status": {"$in": ["pending", "in-progress"]},
            }
        )
        active_docs = await cursor.to_list(5000)
        for doc in active_docs:
            ranked = await _rank_officers_by_workload(
                dept_slug, exclude_officer_username=username
            )
            if ranked:
                new_officer = ranked[0]
                await db.complaints.update_one(
                    {"_id": doc["_id"]},
                    {
                        "$set": {
                            "assignedOfficer": new_officer["name"],
                            "officerPhone": new_officer["phone"],
                        }
                    },
                )
                reassigned_ids.append(doc["_id"])
    else:
        for c in complaints_collection:
            if (
                c.get("assignedDeptSlug") == dept_slug
                and c.get("assignedOfficer") == removed_name
                and c.get("status") in ("pending", "in-progress")
            ):
                ranked = await _rank_officers_by_workload(
                    dept_slug, exclude_officer_username=username
                )
                if ranked:
                    new_officer = ranked[0]
                    c["assignedOfficer"] = new_officer["name"]
                    c["officerPhone"] = new_officer["phone"]
                    reassigned_ids.append(c["_id"])
        if reassigned_ids:
            _save_json(COMPLAINTS_FILE, complaints_collection)

    return {
        "success": True,
        "message": f"Officer '{removed_officer['name']}' removed from {DEPT_DISPLAY[dept_slug]}",
        "officer": removed_officer,
        "reassignedComplaintIds": reassigned_ids,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  AI ENDPOINTS — Officer Suggestion & Dashboard Insights
# ══════════════════════════════════════════════════════════════════════════════

@api_router.get("/dept/complaints/{complaint_id}/suggest-officers")
async def suggest_officers(complaint_id: str,
                            dept_user: tuple = Depends(get_current_dept_user)):
    """Phase 2: AI suggests the best officer for a complaint based on workload.
    Returns officers ranked by: fewest active complaints → closest location → name."""
    dept_slug, role, user_info = dept_user
    dept_data = DEPARTMENT_USERS.get(dept_slug, {})
    officers = dept_data.get("officers", [])

    # Get all complaints for this department to count workload
    if db:
        dept_complaints = await db.complaints.find({"assignedDeptSlug": dept_slug}).to_list(5000)
    else:
        dept_complaints = [c for c in complaints_collection if c.get("assignedDeptSlug") == dept_slug]

    # Count active (non-resolved) complaints per officer
    officer_workload = {}
    for off in officers:
        officer_workload[off["username"]] = {
            "name": off["name"],
            "phone": off["phone"],
            "username": off["username"],
            "activeComplaints": 0,
            "resolvedCount": 0,
        }

    for c in dept_complaints:
        assigned_username = None
        for off in officers:
            if off["name"] == c.get("assignedOfficer"):
                assigned_username = off["username"]
                break
        if assigned_username and assigned_username in officer_workload:
            if c.get("status") == "resolved":
                officer_workload[assigned_username]["resolvedCount"] += 1
            else:
                officer_workload[assigned_username]["activeComplaints"] += 1

    # Sort: fewest active complaints first, then most resolved, then alphabetically
    sorted_officers = sorted(
        officer_workload.values(),
        key=lambda o: (o["activeComplaints"], -o["resolvedCount"], o["name"])
    )

    return {
        "suggestions": sorted_officers,
        "totalActive": sum(o["activeComplaints"] for o in sorted_officers),
    }


@api_router.get("/insights")
async def get_insights():
    """Phase 4: AI-powered dashboard insights — trends, anomalies, hotspots.
    Returns week-over-week comparisons, issue type trends, and actionable insights."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    if db:
        all_complaints = await db.complaints.find().to_list(5000)
    else:
        all_complaints = complaints_collection

    # ── Current week vs previous week ──
    current_week = [c for c in all_complaints if c.get("submittedAt") and c["submittedAt"] >= week_ago]
    previous_week = [c for c in all_complaints if c.get("submittedAt") and two_weeks_ago <= c["submittedAt"] < week_ago]

    # Issue type distribution this week
    type_counts_current = {}
    for c in current_week:
        t = c.get("issueType", "other")
        type_counts_current[t] = type_counts_current.get(t, 0) + 1

    type_counts_previous = {}
    for c in previous_week:
        t = c.get("issueType", "other")
        type_counts_previous[t] = type_counts_previous.get(t, 0) + 1

    # Calculate trends
    trends = []
    all_types = set(list(type_counts_current.keys()) + list(type_counts_previous.keys()))
    for t in all_types:
        curr = type_counts_current.get(t, 0)
        prev = type_counts_previous.get(t, 0)
        if prev > 0:
            pct_change = round((curr - prev) / prev * 100, 1)
        else:
            pct_change = 100 if curr > 0 else 0

        label = DEPARTMENTS.get(t, t.replace("_", " ").title())
        trends.append({
            "issueType": t,
            "label": label,
            "currentWeek": curr,
            "previousWeek": prev,
            "change": pct_change,
            "direction": "up" if pct_change > 0 else ("down" if pct_change < 0 else "stable"),
        })

    trends.sort(key=lambda x: abs(x["change"]), reverse=True)

    # ── Top growing issues (actionable insights) ──
    growing_issues = [t for t in trends if t["direction"] == "up" and t["change"] > 20][:3]

    # ── Severity distribution ──
    severity_counts = {"high": 0, "medium": 0, "low": 0}
    for c in all_complaints:
        sev = c.get("severity", "low")
        if sev in severity_counts:
            severity_counts[sev] += 1

    # ── Department workload ──
    dept_counts = {}
    for d in DEPT_DISPLAY.values():
        dept_counts[d] = {"total": 0, "pending": 0, "inProgress": 0, "resolved": 0}
    for c in all_complaints:
        dept_name = c.get("assignedDepartment", "General Administration")
        if dept_name not in dept_counts:
            dept_counts[dept_name] = {"total": 0, "pending": 0, "inProgress": 0, "resolved": 0}
        dept_counts[dept_name]["total"] += 1
        status = c.get("status", "pending")
        if status in dept_counts[dept_name]:
            dept_counts[dept_name][status] += 1

    # ── Average resolution time ──
    resolved_times = []
    for c in all_complaints:
        if c.get("status") == "resolved" and c.get("submittedAt") and c.get("workStartedAt"):
            time_taken = (c["workStartedAt"] - c["submittedAt"]).days
            resolved_times.append(time_taken)
    avg_resolution_days = round(sum(resolved_times) / len(resolved_times), 1) if resolved_times else None

    # ── Generate insight messages ──
    insight_messages = []

    if growing_issues:
        for g in growing_issues:
            insight_messages.append({
                "type": "trend",
                "icon": "📈",
                "message": f"{g['label']} complaints increased by {g['change']}% this week — consider proactive measures.",
                "severity": "warning" if g['change'] > 50 else "info",
            })

    if severity_counts["high"] > 0:
        pct_high = round(severity_counts["high"] / max(sum(severity_counts.values()), 1) * 100, 1)
        if pct_high > 30:
            insight_messages.append({
                "type": "alert",
                "icon": "🚨",
                "message": f"{pct_high}% of all complaints are high-severity — immediate attention needed.",
                "severity": "critical",
            })

    # Check for departments with backlog
    backlog_depts = [(name, d["pending"]) for name, d in dept_counts.items() if d["pending"] > 3]
    backlog_depts.sort(key=lambda x: x[1], reverse=True)
    if backlog_depts:
        for name, count in backlog_depts[:2]:
            insight_messages.append({
                "type": "backlog",
                "icon": "📋",
                "message": f"{name} has {count} pending complaints — may need additional resources.",
                "severity": "info",
            })

    if avg_resolution_days is not None:
        insight_messages.append({
            "type": "metric",
            "icon": "⏱️",
            "message": f"Average resolution time: {avg_resolution_days} days across all departments.",
            "severity": "info",
        })

    return {
        "summary": {
            "totalComplaints": len(all_complaints),
            "currentWeek": len(current_week),
            "previousWeek": len(previous_week),
            "weekChange": round((len(current_week) - len(previous_week)) / max(len(previous_week), 1) * 100, 1),
            "avgResolutionDays": avg_resolution_days,
        },
        "trends": trends,
        "severityDistribution": severity_counts,
        "departmentWorkload": dept_counts,
        "insights": insight_messages,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  BACKGROUND SCHEDULER — Delay notifications + Escalation engine
# ══════════════════════════════════════════════════════════════════════════════

async def _check_delayed_complaints():
    """Check for complaints that have been pending and send smart notifications.
    Phase 3: Escalation — high-severity complaints pending >48h get escalated.
    Phase 5: Smart Notifications — context-aware email tone based on severity."""
    now = datetime.now(timezone.utc)
    five_days_ago = now - timedelta(days=5)
    two_days_ago = now - timedelta(hours=48)

    affected = []
    for c in complaints_collection:
        submitted = c.get("submittedAt")
        if not isinstance(submitted, datetime):
            continue
        if c.get("status") != "pending":
            continue

        days_pending = (now - submitted).days
        severity = c.get("severity", "low")

        # ── Phase 3: Escalation Engine ──
        # High-severity complaints pending >48h get escalated flag
        if severity == "high" and days_pending >= 2 and not c.get("escalatedAt"):
            c["escalatedAt"] = now
            logger.warning(f"ESCALATED: Complaint {c['_id'][:8]} ({c.get('issueType')}) "
                          f"high-severity pending {days_pending}d — flagged for gov attention")
            affected.append({"id": c["_id"], "action": "escalated", "severity": severity})
            # Don't save here — the final _save_json at the bottom handles it
            continue

        # ── Phase 5: Smart Notifications (existing 5-day delay logic, enhanced) ──
        if submitted > five_days_ago:
            continue
        if c.get("delayNotifiedAt"):
            continue

        user_email = c.get("userEmail")
        user_name = c.get("userName", "User")
        issue_type = c.get("issueType", "")
        dept_name = c.get("assignedDepartment", "")
        officer_phone = c.get("officerPhone", "Not assigned yet")
        officer_name = c.get("assignedOfficer", "Concerned Officer")
        issue_label = DEPARTMENTS.get(issue_type, issue_type.replace("_", " ").title())

        # Smart notification: different tone based on severity
        if severity == "high":
            # Urgent tone for high-severity delays
            subject1 = f"🚨 URGENT: {issue_label} complaint — Action being taken now"
            body1 = (
                f"Dear {user_name},\n\n"
                f"We understand this is a critical issue and sincerely apologize for the delay. "
                f"Your {issue_label} complaint (submitted {submitted.strftime('%B %d, %Y')}) "
                f"has been flagged as HIGH priority and escalated to senior officials.\n\n"
                f"Immediate action is being taken:\n"
                f"• Officer: {officer_name}\n"
                f"• Contact: {officer_phone}\n"
                f"• Department: {dept_name}\n\n"
                f"You will receive an update within 24 hours. For urgent concerns, please call the officer directly.\n\n"
                f"Regards,\nCivicResolve Team"
            )
            subject2 = f"Sincere Apology — High-priority {issue_label} issue"
            body2 = (
                f"Dear {user_name},\n\n"
                f"We deeply apologize for the delay in addressing your {issue_label} complaint. "
                f"We recognize the urgency of this situation and have personally followed up with the department head.\n\n"
                f"Rest assured, your complaint is our top priority.\n\n"
                f"Regards,\nCivicResolve Team"
            )
        elif severity == "medium":
            # Professional tone for medium-severity
            subject1 = f"Update on your {issue_label} complaint — Work scheduled"
            body1 = (
                f"Dear {user_name},\n\n"
                f"We regret the delay in addressing your {issue_label} complaint "
                f"submitted on {submitted.strftime('%B %d, %Y')}.\n\n"
                f"Good news — work is now scheduled to begin. Your complaint is assigned to:\n"
                f"• Officer: {officer_name}\n"
                f"• Contact: {officer_phone}\n"
                f"• Department: {dept_name}\n\n"
                f"We appreciate your patience.\n\n"
                f"Regards,\nCivicResolve Team"
            )
            subject2 = f"Apology for delay — {issue_label} complaint"
            body2 = (
                f"Dear {user_name},\n\n"
                f"Please accept our sincere apologies for the delay. We are working to resolve "
                f"your {issue_label} complaint at the earliest.\n\n"
                f"Regards,\nCivicResolve Team"
            )
        else:
            # Standard tone for low-severity
            subject1 = f"Update on your {issue_label} complaint — Status"
            body1 = (
                f"Dear {user_name},\n\n"
                f"This is an update regarding your {issue_label} complaint "
                f"submitted on {submitted.strftime('%B %d, %Y')}.\n\n"
                f"Your complaint is being processed by {dept_name}.\n"
                f"Officer: {officer_name} ({officer_phone})\n\n"
                f"Thank you for your patience.\n\n"
                f"Regards,\nCivicResolve Team"
            )
            subject2 = f"Status update — {issue_label}"
            body2 = (
                f"Dear {user_name},\n\n"
                f"We wanted to let you know that we haven't forgotten about your complaint. "
                f"Our team is working through the queue and will address it soon.\n\n"
                f"Regards,\nCivicResolve Team"
            )

        email1_sent = await _send_email(user_email, subject1, body1)
        email2_sent = await _send_email(user_email, subject2, body2)

        # Mark as notified
        c["delayNotifiedAt"] = now
        if email1_sent or email2_sent:
            c["apologySentAt"] = now
            affected.append({"id": c["_id"], "action": "notified", "severity": severity})

    if affected:
        _save_json(COMPLAINTS_FILE, complaints_collection)
        logger.info(f"Scheduler: {len(affected)} actions — {[a['action'] for a in affected]}")
    else:
        logger.info("Scheduler check complete — no actions needed")

async def _check_delayed_complaints():
    """Check for complaints that have been 7+ days and send status-based notifications.
    - Pending 7+ days: send 'pending' notification + 'will start soon' notification
    - In-progress 10+ days: send follow-up reminder
    - Resolved: no action needed (already got email on transition)
    Also escalates high-severity complaints pending >48h."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    two_days_ago = now - timedelta(hours=48)

    affected = []
    for c in complaints_collection:
        submitted = c.get("submittedAt")
        if not isinstance(submitted, datetime):
            continue
        if submitted > seven_days_ago:
            continue  # less than 7 days
        if c.get("delayNotifiedAt"):
            continue  # already notified for delay

        status = c.get("status", "pending")
        user_email = c.get("userEmail")
        if not user_email:
            continue

        user_name = c.get("userName", "User")
        issue_type = c.get("issueType", "")
        dept_name = c.get("assignedDepartment", "")
        officer_phone = c.get("officerPhone", "Not assigned yet")
        officer_name = c.get("assignedOfficer", "Concerned Officer")
        issue_label = DEPARTMENTS.get(issue_type, issue_type.replace("_", " ").title())
        days_pending = (now - submitted).days
        severity = c.get("severity", "low")

        # Phase 3: Escalation Engine - high severity pending >48h
        if severity == "high" and days_pending >= 2 and not c.get("escalatedAt"):
            c["escalatedAt"] = now
            logger.warning(f"ESCALATED: Complaint {c['_id'][:8]} ({issue_type}) "
                          f"high-severity pending {days_pending}d")
            affected.append({"id": c["_id"], "action": "escalated"})

        if status == "pending":
            # Send 2 emails: one about pending status, one reassuring work will start soon
            subject1 = f"Update on your {issue_label} complaint — Status review"
            body1 = (
                f"Dear {user_name},\n\n"
                f"We wanted to update you on your {issue_label} complaint submitted on {submitted.strftime('%B %d, %Y')}.\n\n"
                f"Your complaint has been under review for {days_pending} days. We sincerely apologize for the delay.\n\n"
                f"Your complaint is currently marked as 'Pending' and is being reviewed by the {dept_name}.\n"
                f"Once the department assigns an officer, you will receive another update.\n\n"
                f"Thank you for your patience.\n\n"
                f"Regards,\nCivicResolve Team"
            )

            subject2 = f"Good News — Your {issue_label} complaint will start soon"
            body2 = (
                f"Dear {user_name},\n\n"
                f"We appreciate your patience regarding your {issue_label} complaint.\n\n"
                f"We want to assure you that work on your complaint is scheduled to begin soon. "
                f"Our team is actively working on assigning resources to address this issue.\n\n"
                f"You will receive a notification once work has officially started.\n\n"
                f"Complaint Details:\n"
                f"- Issue: {issue_label}\n"
                f"- Submitted: {submitted.strftime('%B %d, %Y')}\n"
                f"- Department: {dept_name}\n"
                f"- Expected: Work starting soon\n\n"
                f"Regards,\nCivicResolve Team"
            )

            email1_sent = await _send_email(user_email, subject1, body1)
            email2_sent = await _send_email(user_email, subject2, body2)

            c["delayNotifiedAt"] = now
            if email1_sent or email2_sent:
                c["apologySentAt"] = now
                affected.append({"id": c["_id"], "email": user_email, "status": "pending"})

        elif status == "in-progress":
            # For in-progress complaints pending 10+ days, send a follow-up reminder
            if days_pending >= 10:
                subject = f"Update: Your {issue_label} complaint — Work in progress"
                body = (
                    f"Dear {user_name},\n\n"
                    f"Your {issue_label} complaint has been in progress for {days_pending} days.\n\n"
                    f"We understand you are waiting for resolution. Our team is working on your issue and "
                    f"we appreciate your continued patience.\n\n"
                    f"If you have any urgent concerns, please contact:\n"
                    f"- Officer: {officer_name}\n"
                    f"- Phone: {officer_phone}\n"
                    f"- Department: {dept_name}\n\n"
                    f"Regards,\nCivicResolve Team"
                )
                email_sent = await _send_email(user_email, subject, body)
                if email_sent:
                    affected.append({"id": c["_id"], "email": user_email, "status": "in-progress-reminder"})

    if affected:
        _save_json(COMPLAINTS_FILE, complaints_collection)
        logger.info(f"Sent status-based notifications for {len(affected)} complaints: {[a['id'][:8] for a in affected]}")
    else:
        logger.info("Status check complete — no complaints need notification")


async def _scheduler_loop():
    """Background loop that checks for delayed complaints every 60 seconds (demo frequency)."""
    # Run immediately on startup
    logger.info("Scheduler: running initial delay check on startup...")
    try:
        await _check_delayed_complaints()
    except Exception as e:
        logger.error(f"Scheduler initial check error: {e}")
    # Then check every 60 seconds for demo responsiveness
    while True:
        try:
            await asyncio.sleep(60)  # check every 60 seconds
            logger.info("Scheduler: checking for delayed complaints...")
            await _check_delayed_complaints()
        except asyncio.CancelledError:
            logger.info("Scheduler cancelled — shutting down")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            await asyncio.sleep(60)


# ══════════════════════════════════════════════════════════════════════════════
#  ROOT / HEALTH
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    logger.info("Starting CivicResolve API server ...")
    if client:
        logger.info("MongoDB connected successfully")
    else:
        logger.info("No MONGO_URL set — using JSON file storage")
    # Start background scheduler
    scheduler_task = asyncio.create_task(_scheduler_loop())
    logger.info("Background scheduler started (checks every hour for 5-day delays)")
    try:
        yield
    except asyncio.CancelledError:
        logger.info("Server shutdown initiated gracefully...")
    finally:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            pass
        if client:
            client.close()
            logger.info("MongoDB connection closed")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@api_router.get("/")
async def root():
    return {
        "message": "CivicResolve API",
        "version": "1.1.0",
        "database": "connected" if db else "in-memory (set MONGO_URL for persistence)",
    }


@api_router.get("/health")
async def health():
    return {"status": "healthy", "database": "connected" if db else "in-memory"}



# ── Seed sample complaints for showcase ────────────────────────────────
SAMPLE_USER_ID = "sample-demo-user"
SAMPLE_USER_NAME = "Demo Citizen"


def _seed_sample_complaints():
    """Seed 3-4 sample complaints per department for demo/showcase."""
    if len(complaints_collection) > 10:
        return  # already has data

    # Ensure sample user exists
    sample_user_exists = any(u["_id"] == SAMPLE_USER_ID for u in users_collection)
    if not sample_user_exists and not db:
        users_collection.append({
            "_id": SAMPLE_USER_ID,
            "name": SAMPLE_USER_NAME,
            "email": "demo@civicresolve.gov",
            "phone": "9876543000",
            "createdAt": datetime.now(timezone.utc),
        })
        _save_json(USERS_FILE, users_collection)

    now = datetime.now(timezone.utc)

    sample_complaints = [
        # ── Municipal Department (4 complaints) ──
        # ── REAL USER COMPLAINT: saibalajimeduri@gmail.com (7 days old, pending, with officer assigned)
        #    This will trigger the delay notification email on server startup
        {
            "_id": str(uuid.uuid4()),
            "userId": "475886d0-a019-477e-848f-08b2eae556d7",
            "userName": "Sai Balaji",
            "userEmail": "saibalajimeduri@gmail.com",
            "userPhone": "7794847729",
            "issueType": "garbage",
            "description": "Garbage not collected in our area for over a week. The garbage bins are overflowing and stray dogs are spreading trash everywhere. This is becoming a serious health hazard for the neighborhood. Request immediate action.",
            "location": "18.1167, 83.4167",
            "severity": "high",
            "status": "pending",
            "assignedDepartment": "Municipal Department",
            "assignedDeptSlug": "municipal",
            "assignedOfficer": "Officer Rajesh",
            "officerPhone": "9876543211",
            "submittedAt": now - timedelta(days=7),
            "workStartedAt": None,
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "drainage",
            "description": "Drainage system is completely clogged on MG Road causing waterlogging every time it rains. The water gets mixed with sewage and creates a foul smell. Children in the area are falling sick.",
            "location": "18.1067, 83.4267",
            "severity": "high",
            "status": "in-progress",
            "assignedDepartment": "Municipal Department",
            "assignedDeptSlug": "municipal",
            "assignedOfficer": "Officer Rajesh",
            "officerPhone": "9876543211",
            "submittedAt": now - timedelta(days=5),
            "workStartedAt": now - timedelta(days=1),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "park",
            "description": "Children's park in Indira Nagar has broken swings and damaged slides for over a month. The park gate is also broken allowing stray animals inside. Local kids have no safe place to play.",
            "location": "18.1267, 83.4067",
            "severity": "medium",
            "status": "resolved",
            "assignedDepartment": "Municipal Department",
            "assignedDeptSlug": "municipal",
            "assignedOfficer": "Officer Priya",
            "officerPhone": "9876543212",
            "submittedAt": now - timedelta(days=15),
            "workStartedAt": now - timedelta(days=12),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "garbage",
            "description": "Illegal dumping of construction debris and household waste in the empty plot near Lake View Colony. The dump is growing every day and attracting rats and mosquitoes. Need immediate action.",
            "location": "18.0967, 83.3967",
            "severity": "medium",
            "status": "pending",
            "assignedDepartment": "Municipal Department",
            "assignedDeptSlug": "municipal",
            "assignedOfficer": None,
            "officerPhone": None,
            "submittedAt": now - timedelta(days=2),
            "workStartedAt": None,
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },

        # ── Electrical Department (3 complaints) ──
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "streetlight",
            "description": "Street light on Church Street near the junction has not been working for 10 days. The entire stretch is dark at night making it dangerous for pedestrians and vehicles. Two minor accidents reported last week.",
            "location": "18.1367, 83.4367",
            "severity": "high",
            "status": "pending",
            "assignedDepartment": "Electrical Department",
            "assignedDeptSlug": "electrical",
            "assignedOfficer": None,
            "officerPhone": None,
            "submittedAt": now - timedelta(days=10),
            "workStartedAt": None,
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "streetlight",
            "description": "Multiple street lights in Sector 7 are not working. This is a high-traffic area near the market complex. Women and elderly are finding it difficult to walk after sunset. At least 5 poles are affected.",
            "location": "18.0867, 83.4467",
            "severity": "medium",
            "status": "in-progress",
            "assignedDepartment": "Electrical Department",
            "assignedDeptSlug": "electrical",
            "assignedOfficer": "Officer Deepak",
            "officerPhone": "9876543221",
            "submittedAt": now - timedelta(days=3),
            "workStartedAt": now - timedelta(days=1),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "streetlight",
            "description": "Street light pole was damaged by a vehicle accident near the bus stand. The pole is leaning dangerously and wires are exposed posing electrocution risk. Please fix urgently.",
            "location": "18.1467, 83.3867",
            "severity": "high",
            "status": "resolved",
            "assignedDepartment": "Electrical Department",
            "assignedDeptSlug": "electrical",
            "assignedOfficer": "Officer Kavita",
            "officerPhone": "9876543222",
            "submittedAt": now - timedelta(days=20),
            "workStartedAt": now - timedelta(days=18),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },

        # ── PWD Department (3 complaints) ──
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "pothole",
            "description": "Large pothole on the highway near the toll plaza. It is approximately 3 feet wide and 1.5 feet deep. Multiple vehicles have suffered tire damage. No warning signs placed. Accident waiting to happen.",
            "location": "18.1067, 83.4367",
            "severity": "high",
            "status": "pending",
            "assignedDepartment": "Public Works Department (PWD)",
            "assignedDeptSlug": "pwd",
            "assignedOfficer": None,
            "officerPhone": None,
            "submittedAt": now - timedelta(days=4),
            "workStartedAt": None,
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "pothole",
            "description": "Road surface near Green Valley School is severely damaged with multiple potholes and cracks. School buses and parents dropping children are struggling. Risk of accidents is very high during rainy season.",
            "location": "18.1267, 83.4267",
            "severity": "medium",
            "status": "in-progress",
            "assignedDepartment": "Public Works Department (PWD)",
            "assignedDeptSlug": "pwd",
            "assignedOfficer": "Officer Venkat",
            "officerPhone": "9876543231",
            "submittedAt": now - timedelta(days=6),
            "workStartedAt": now - timedelta(days=2),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "pothole",
            "description": "Road leading to the main market has developed cracks and small potholes. The condition is deteriorating fast. Request repair before the monsoon season worsens the damage.",
            "location": "18.1167, 83.4067",
            "severity": "low",
            "status": "resolved",
            "assignedDepartment": "Public Works Department (PWD)",
            "assignedDeptSlug": "pwd",
            "assignedOfficer": "Officer Anjali",
            "officerPhone": "9876543232",
            "submittedAt": now - timedelta(days=30),
            "workStartedAt": now - timedelta(days=27),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },

        # ── General Administration (3 complaints) ──
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "traffic",
            "description": "Traffic signal at the busy Ashram Chowk intersection has not been working for 3 days. Peak hours are chaos with no traffic police present. Multiple near-miss accidents every day.",
            "location": "18.0967, 83.4267",
            "severity": "high",
            "status": "pending",
            "assignedDepartment": "General Administration",
            "assignedDeptSlug": "general",
            "assignedOfficer": None,
            "officerPhone": None,
            "submittedAt": now - timedelta(days=3),
            "workStartedAt": None,
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "other",
            "description": "Missing road signs and speed breakers on the ring road. The newly constructed road has no signage at all. Speed breakers are also absent causing vehicles to speed dangerously through residential areas.",
            "location": "18.1367, 83.4167",
            "severity": "medium",
            "status": "in-progress",
            "assignedDepartment": "General Administration",
            "assignedDeptSlug": "general",
            "assignedOfficer": "Officer Rohan",
            "officerPhone": "9876543241",
            "submittedAt": now - timedelta(days=8),
            "workStartedAt": now - timedelta(days=3),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "traffic",
            "description": "Severe traffic congestion at the railway crossing during peak hours. Gates remain closed for extended periods. Commuters are stuck for 30-40 minutes. Need better traffic management and alternative route planning.",
            "location": "18.0767, 83.4067",
            "severity": "low",
            "status": "resolved",
            "assignedDepartment": "General Administration",
            "assignedDeptSlug": "general",
            "assignedOfficer": "Officer Sneha",
            "officerPhone": "9876543242",
            "submittedAt": now - timedelta(days=25),
            "workStartedAt": now - timedelta(days=22),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },

        # ── Water Department (3 complaints) ──
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "water",
            "description": "No water supply in Sunrise Colony for the past 5 days. Residents are forced to buy water from tankers at high prices. The colony has over 200 families affected. Water department not responding to calls.",
            "location": "18.1467, 83.4467",
            "severity": "high",
            "status": "pending",
            "assignedDepartment": "Water Department",
            "assignedDeptSlug": "water",
            "assignedOfficer": None,
            "officerPhone": None,
            "submittedAt": now - timedelta(days=5),
            "workStartedAt": None,
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "water",
            "description": "Major water pipe leak near the temple in the old city area. Clean drinking water is being wasted 24/7. The road has also developed a sinkhole due to water accumulation. Urgent repair needed.",
            "location": "18.1067, 83.3967",
            "severity": "high",
            "status": "in-progress",
            "assignedDepartment": "Water Department",
            "assignedDeptSlug": "water",
            "assignedOfficer": "Officer Lakshmi",
            "officerPhone": "9876543251",
            "submittedAt": now - timedelta(days=2),
            "workStartedAt": now - timedelta(hours=12),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
        {
            "_id": str(uuid.uuid4()),
            "userId": SAMPLE_USER_ID,
            "userName": SAMPLE_USER_NAME,
            "userEmail": "demo@civicresolve.gov",
            "userPhone": "9876543000",
            "issueType": "water",
            "description": "Residents of Green Park Apartments have been receiving muddy and contaminated water for 2 weeks. Water tests show high levels of sediment. Several people have reported stomach infections. Need immediate water quality check.",
            "location": "18.1267, 83.4367",
            "severity": "medium",
            "status": "resolved",
            "assignedDepartment": "Water Department",
            "assignedDeptSlug": "water",
            "assignedOfficer": "Officer Krishna",
            "officerPhone": "9876543252",
            "submittedAt": now - timedelta(days=14),
            "workStartedAt": now - timedelta(days=12),
            "delayNotifiedAt": None,
            "apologySentAt": None,
            "photo": None,
        },
    ]

    for complaint in sample_complaints:
        # Check if already exists by matching description and location
        exists = any(
            c.get("description") == complaint["description"]
            and c.get("location") == complaint["location"]
            for c in complaints_collection
        )
        if not exists:
            complaints_collection.append(complaint)

    _save_json(COMPLAINTS_FILE, complaints_collection)
    logger.info(f"Seeded {len(sample_complaints)} sample complaints for demo showcase")


# ══════════════════════════════════════════════════════════════════════════════
#  GOV-SCOPED DEPARTMENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════
# These require a gov-role JWT (issued by /api/auth/gov-login) and can manage
# any department, not just the caller's own.


async def get_current_gov_user(authorization: Optional[str] = Header(None)) -> dict:
    """Require a gov-role JWT whose subject is the gov admin user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    payload = _decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("sub") != "gov-admin-user":
        raise HTTPException(status_code=401, detail="Not a government user")
    return {"id": "gov-admin-user", "name": "Government Admin", "role": "gov"}


async def _get_officers_with_counts(dept_slug: str) -> dict:
    """Return a department's head and officers with active/resolved complaint counts."""
    dept_data = DEPARTMENT_USERS.get(dept_slug, {})
    head = dept_data.get("head", {})
    officers = dept_data.get("officers", [])

    if db:
        dept_complaints = await db.complaints.find({"assignedDeptSlug": dept_slug}).to_list(5000)
    else:
        dept_complaints = [c for c in complaints_collection if c.get("assignedDeptSlug") == dept_slug]

    officer_workload = {}
    for off in officers:
        officer_workload[off["username"]] = {
            "name": off["name"],
            "phone": off["phone"],
            "username": off["username"],
            "activeComplaints": 0,
            "resolvedCount": 0,
        }
    for c in dept_complaints:
        assigned_username = None
        for off in officers:
            if off["name"] == c.get("assignedOfficer"):
                assigned_username = off["username"]
                break
        if assigned_username and assigned_username in officer_workload:
            if c.get("status") == "resolved":
                officer_workload[assigned_username]["resolvedCount"] += 1
            else:
                officer_workload[assigned_username]["activeComplaints"] += 1

    return {
        "head": {"name": head.get("name"), "phone": head.get("phone"), "username": head.get("username")},
        "officers": list(officer_workload.values()),
    }


async def _rank_officers_by_workload(dept_slug: str, exclude_officer_username: Optional[str] = None) -> list:
    """Rank a department's officers by workload (fewest active complaints → most resolved → name).

    Used to rebalance complaints when an officer is removed; the excluded officer is skipped.
    """
    dept_data = DEPARTMENT_USERS.get(dept_slug, {})
    officers = [o for o in dept_data.get("officers", []) if o["username"] != exclude_officer_username]

    if db:
        dept_complaints = await db.complaints.find({"assignedDeptSlug": dept_slug}).to_list(5000)
    else:
        dept_complaints = [c for c in complaints_collection if c.get("assignedDeptSlug") == dept_slug]

    officer_workload = {}
    for off in officers:
        officer_workload[off["username"]] = {
            "name": off["name"],
            "phone": off["phone"],
            "username": off["username"],
            "password": off["password"],
            "activeComplaints": 0,
            "resolvedCount": 0,
        }
    for c in dept_complaints:
        assigned_username = None
        for off in officers:
            if off["name"] == c.get("assignedOfficer"):
                assigned_username = off["username"]
                break
        if assigned_username and assigned_username in officer_workload:
            if c.get("status") == "resolved":
                officer_workload[assigned_username]["resolvedCount"] += 1
            else:
                officer_workload[assigned_username]["activeComplaints"] += 1

    return sorted(
        officer_workload.values(),
        key=lambda o: (o["activeComplaints"], -o["resolvedCount"], o["name"]),
    )


async def _get_dept_complaint_stats(dept_slug: str) -> dict:
    """Return {total, pending, inProgress, resolved} complaint counts for a department."""
    if db:
        docs = await db.complaints.find({"assignedDeptSlug": dept_slug}).to_list(5000)
    else:
        docs = [c for c in complaints_collection if c.get("assignedDeptSlug") == dept_slug]
    stats = {"total": len(docs), "pending": 0, "inProgress": 0, "resolved": 0}
    for c in docs:
        status = c.get("status")
        if status == "pending":
            stats["pending"] += 1
        elif status == "in-progress":
            stats["inProgress"] += 1
        elif status == "resolved":
            stats["resolved"] += 1
    return stats


@api_router.get("/gov/departments")
async def gov_list_departments(gov_user: dict = Depends(get_current_gov_user)):
    """Gov admin overview: head + officer records with workload stats for every department."""
    records = []
    for dept_slug in DEPARTMENT_USERS:
        data = await _get_officers_with_counts(dept_slug)
        complaints = await _get_dept_complaint_stats(dept_slug)
        records.append({
            "deptSlug": dept_slug,
            "deptName": DEPT_DISPLAY.get(dept_slug, dept_slug),
            "head": data.get("head", {}),
            "officerCount": len(data.get("officers", [])),
            "officers": data.get("officers", []),
            "complaints": complaints,
        })
    return {"departments": records}


@api_router.put("/gov/departments/{dept_slug}/head")
async def gov_update_head(
    dept_slug: str,
    body: AddOfficerRequest,
    gov_user: dict = Depends(get_current_gov_user),
):
    """Gov user can update a department head's name/phone."""
    if dept_slug not in DEPARTMENT_USERS:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_data = DEPARTMENT_USERS[dept_slug]
    head = dept_data.get("head", {})
    head["name"] = body.name.strip()
    head["phone"] = body.phone.strip()
    return {
        "success": True,
        "message": f"Head updated for {DEPT_DISPLAY[dept_slug]}",
        "head": dict(head),
    }


@api_router.get("/gov/departments/{dept_slug}/officers")
async def gov_get_officers(
    dept_slug: str,
    gov_user: dict = Depends(get_current_gov_user),
):
    """Gov user can view any department's officers (with stats)."""
    if dept_slug not in DEPARTMENT_USERS:
        raise HTTPException(status_code=404, detail="Department not found")
    return await _get_officers_with_counts(dept_slug)


@api_router.post("/gov/departments/{dept_slug}/officers")
async def gov_add_officer(
    dept_slug: str,
    body: AddOfficerRequest,
    gov_user: dict = Depends(get_current_gov_user),
):
    """Gov user can add an officer to any department."""
    if dept_slug not in DEPARTMENT_USERS:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_data = DEPARTMENT_USERS[dept_slug]
    # Reuse the same duplicate-username checks as the dept-scoped add_officer
    for d_slug, d_data in DEPARTMENT_USERS.items():
        if d_data["head"]["username"] == body.username:
            raise HTTPException(status_code=400, detail="Username already exists")
        for off in d_data["officers"]:
            if off["username"] == body.username:
                raise HTTPException(status_code=400, detail="Username already exists")

    phone = body.phone.strip()
    if len(phone) != 10 or not phone.isdigit():
        raise HTTPException(status_code=400, detail="Phone must be 10 digits")

    new_officer = {
        "name": body.name.strip(),
        "username": body.username.strip(),
        "password": "officer@123",  # default password, should be changed on first login
        "phone": phone,
    }
    dept_data["officers"].append(new_officer)

    return {
        "success": True,
        "message": f"Officer '{body.name}' added to {DEPT_DISPLAY[dept_slug]}",
        "officer": new_officer,
    }


@api_router.put("/gov/departments/{dept_slug}/officers/{username}")
async def gov_update_officer(
    dept_slug: str,
    username: str,
    body: AddOfficerRequest,
    gov_user: dict = Depends(get_current_gov_user),
):
    """Gov user can update any officer in any department."""
    if dept_slug not in DEPARTMENT_USERS:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_data = DEPARTMENT_USERS[dept_slug]
    officers = dept_data.get("officers", [])

    phone = body.phone.strip()
    if len(phone) != 10 or not phone.isdigit():
        raise HTTPException(status_code=400, detail="Phone must be 10 digits")

    for off in officers:
        if off["username"] == username:
            off["name"] = body.name.strip()
            off["phone"] = phone
            return {
                "success": True,
                "message": f"Officer '{body.name}' updated in {DEPT_DISPLAY[dept_slug]}",
                "officer": dict(off),
            }

    raise HTTPException(status_code=404, detail="Officer not found")


@api_router.delete("/gov/departments/{dept_slug}/officers/{username}")
async def gov_remove_officer(
    dept_slug: str,
    username: str,
    gov_user: dict = Depends(get_current_gov_user),
):
    """Gov user can remove an officer from any department.

    Active (non-resolved) complaints previously assigned to this officer are
    rebalanced across the remaining officers using the same workload-ranking
    logic so that no complaint gets orphaned.
    """
    if dept_slug not in DEPARTMENT_USERS:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_data = DEPARTMENT_USERS[dept_slug]
    officers = dept_data.get("officers", [])

    removed_officer = None
    for i, off in enumerate(officers):
        if off["username"] == username:
            removed_officer = officers.pop(i)
            break

    if not removed_officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    removed_name = removed_officer["name"]
    reassigned_ids: list[str] = []

    if db:
        cursor = db.complaints.find(
            {
                "assignedDeptSlug": dept_slug,
                "assignedOfficer": removed_name,
                "status": {"$in": ["pending", "in-progress"]},
            }
        )
        active_docs = await cursor.to_list(5000)
        for doc in active_docs:
            ranked = await _rank_officers_by_workload(
                dept_slug, exclude_officer_username=username
            )
            if ranked:
                new_officer = ranked[0]
                await db.complaints.update_one(
                    {"_id": doc["_id"]},
                    {
                        "$set": {
                            "assignedOfficer": new_officer["name"],
                            "officerPhone": new_officer["phone"],
                        }
                    },
                )
                reassigned_ids.append(doc["_id"])
    else:
        for c in complaints_collection:
            if (
                c.get("assignedDeptSlug") == dept_slug
                and c.get("assignedOfficer") == removed_name
                and c.get("status") in ("pending", "in-progress")
            ):
                ranked = await _rank_officers_by_workload(
                    dept_slug, exclude_officer_username=username
                )
                if ranked:
                    new_officer = ranked[0]
                    c["assignedOfficer"] = new_officer["name"]
                    c["officerPhone"] = new_officer["phone"]
                    reassigned_ids.append(c["_id"])
        if reassigned_ids:
            _save_json(COMPLAINTS_FILE, complaints_collection)

    return {
        "success": True,
        "message": f"Officer '{removed_officer['name']}' removed from {DEPT_DISPLAY[dept_slug]}",
        "officer": removed_officer,
        "reassignedComplaintIds": reassigned_ids,
    }


@api_router.put("/dept/officers/{username}")
async def update_officer(
    username: str,
    body: AddOfficerRequest,
    dept_user: tuple = Depends(get_current_dept_user),
):
    """HOD can update an officer's name/phone in their department."""
    dept_slug, role, user_info = dept_user

    if role != "head":
        raise HTTPException(status_code=403, detail="Only department head can update officers")

    dept_data = DEPARTMENT_USERS.get(dept_slug, {})
    officers = dept_data.get("officers", [])

    phone = body.phone.strip()
    if len(phone) != 10 or not phone.isdigit():
        raise HTTPException(status_code=400, detail="Phone must be 10 digits")

    for off in officers:
        if off["username"] == username:
            off["name"] = body.name.strip()
            off["phone"] = phone
            return {
                "success": True,
                "message": f"Officer '{body.name}' updated in {DEPT_DISPLAY[dept_slug]}",
                "officer": dict(off),
            }

    raise HTTPException(status_code=404, detail="Officer not found")


# All routes must be registered on api_router before this runs: FastAPI copies the
# routes into the app at include time, so this stays at the very end of the module.
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    import subprocess
    import time

    # ── Free up port 8000 if it's still held by a previous process ──
    port = int(os.environ.get("PORT", "8000"))
    try:
        # Try killing with lsof first
        try:
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"],
                capture_output=True, text=True, timeout=5
            )
            if result.stdout.strip():
                pids = [p for p in result.stdout.strip().split("\n") if p.strip()]
                logger.warning(f"Port {port} is in use by PID(s): {', '.join(pids)} — killing them...")
                subprocess.run(["kill", "-9"] + pids, capture_output=True, timeout=5)
                time.sleep(1)
                logger.info(f"Freed port {port}")
        except FileNotFoundError:
            # lsof not available, try fuser
            subprocess.run(["fuser", "-k", f"{port}/tcp"], capture_output=True, timeout=5)
            time.sleep(1)
    except Exception as e:
        logger.warning(f"Could not automatically free port {port}: {e}")

    # Seed sample complaints for showcase (only if empty)
    _seed_sample_complaints()

    # Log persistence info so users know their data is safe
    logger.info(f"Loaded {len(users_collection)} user(s) and {len(complaints_collection)} complaint(s) from disk")

    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
