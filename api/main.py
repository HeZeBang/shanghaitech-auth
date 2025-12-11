from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any, Dict
try:
    import api.ids as ids
except ImportError:
    import ids  # For local testing

app = FastAPI(title="ShanghaiTech Auth API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fix_encoding(data: Any) -> Any:
    """Fix UTF-8 encoding issues in response data"""
    if isinstance(data, dict):
        result: Dict[str, Any] = {}
        for k, v in data.items():
            result[k] = fix_encoding(v)
        return result
    elif isinstance(data, list):
        return [fix_encoding(item) for item in data]
    elif isinstance(data, str):
        try:
            # Try to detect and fix UTF-8 encoding errors
            return data.encode('utf-8').decode('utf-8')
        except:
            return data
    return data

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    subject: str
    user_info: Optional[dict] = None
    error: Optional[str] = None

class UserInfoRequest(BaseModel):
    subject: str

class UserInfoResponse(BaseModel):
    success: bool
    user_info: Optional[dict] = None
    error: Optional[str] = None

# Store sessions temporarily (in production, use Redis or similar)
# Key: subject (student_id), Value: session object
sessions = {}

@app.post("/api/auth/login", response_model=LoginResponse)
async def authenticate_user(request: LoginRequest):
    """
    Authenticate user against ShanghaiTech IDS.
    Returns user subject (student ID) if successful.
    """
    try:
        session = ids.login(request.username, request.password)
        
        if session is None:
            return LoginResponse(
                success=False,
                subject="",
                error="Invalid credentials"
            )
        
        # Get user info
        user_info = ids.get_info(session)
        
        if user_info is None:
            return LoginResponse(
                success=False,
                subject="",
                error="Failed to retrieve user info"
            )
        
        # Fix encoding issues
        user_info_fixed: Dict[str, Any] = fix_encoding(user_info)
        
        # Store session for later use
        subject = user_info_fixed.get("sid", request.username)
        sessions[subject] = session
        
        return LoginResponse(
            success=True,
            subject=subject,
            user_info=user_info_fixed
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/userinfo", response_model=UserInfoResponse)
async def get_user_info(request: UserInfoRequest):
    """
    Get user information for a given subject (student ID).
    Used during the consent flow to inject user data into ID token.
    """
    try:
        # Check if we have a cached session
        session = sessions.get(request.subject)
        
        if session is None:
            return UserInfoResponse(
                success=False,
                error="Session not found or expired"
            )
        
        user_info = ids.get_info(session)
        
        if user_info is None:
            return UserInfoResponse(
                success=False,
                error="Failed to retrieve user info"
            )
        
        # Fix encoding issues
        user_info_fixed: Dict[str, Any] = fix_encoding(user_info)
        
        return UserInfoResponse(
            success=True,
            user_info=user_info_fixed
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
