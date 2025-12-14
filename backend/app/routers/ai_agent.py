from typing import List, Optional, Any
import logging
import json
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import google.generativeai as genai

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.land import Land
from app.models.agreement import Agreement
from app.models.chat_conversation import ChatConversation

logger = logging.getLogger("smartlands.ai")

router = APIRouter(prefix="/ai", tags=["ai"])

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    # Initialize the model (using recommended flash model for general use)
    # Using 'gemini-2.5-flash' as verified working model
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    logger.warning("GOOGLE_API_KEY is not set. AI features will fail.")
    model = None

class AIRequest(BaseModel):
    message: str

class AIResponse(BaseModel):
    response: str

async def gather_context(db: AsyncSession, current_user: User) -> List[Any]:
    """
    Gathers permissible data snapshot for the AI context.
    """
    snapshot = []

    # 1. Lands (Public)
    lands_res = await db.execute(select(Land))
    lands = lands_res.scalars().all()
    
    lands_data = []
    for l in lands:
        lands_data.append({
            "type": "Land",
            "id": l.land_id,
            "title": l.title,
            "status": l.status,
            "price": float(l.price_amount) if l.price_amount else 0,
            "owner_id": l.owner_id,
            "city": l.city
        })
    snapshot.extend(lands_data)

    # 2. Owners/Users (Public - Email/Name)
    users_res = await db.execute(select(User))
    users = users_res.scalars().all()
    
    users_data = []
    for u in users:
        users_data.append({
            "type": "User",
            "id": u.user_id,
            "name": u.full_name,
            "email": u.email
        })
    snapshot.extend(users_data)

    # 3. Agreements (Restricted)
    agreements_res = await db.execute(
        select(Agreement).where(
            (Agreement.buyer_user_id == current_user.user_id) | 
            (Agreement.seller_user_id == current_user.user_id)
        )
    )
    agreements = agreements_res.scalars().all()
    
    for a in agreements:
        snapshot.append({
            "type": "Agreement",
            "id": a.agreement_id,
            "land_id": a.land_id,
            "status": a.status,
            "amount": float(a.agreed_amount),
            "created_at": str(a.created_at)
        })

    # 4. Chats (Restricted)
    chats_res = await db.execute(
        select(ChatConversation).where(
            (ChatConversation.buyer_user_id == current_user.user_id) | 
            (ChatConversation.seller_user_id == current_user.user_id)
        )
    )
    chats = chats_res.scalars().all()
    
    for c in chats:
        snapshot.append({
            "type": "ChatConversation",
            "id": c.conversation_id,
            "agreement_id": c.agreement_id,
            "buyer_id": c.buyer_user_id,
            "seller_id": c.seller_user_id
        })

    return snapshot

@router.post("/chat", response_model=AIResponse)
async def chat_with_ai(
    payload: AIRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not model:
        raise HTTPException(status_code=500, detail="AI service not configured (Missing Key)")

    try:
        # 1. Gather Context
        context_data = await gather_context(db, current_user)
        context_json = json.dumps(context_data, ensure_ascii=False)

        # 2. Construct System Prompt
        system_instructions = f"""
# Role & Persona
أنت المساعد الذكي والمحبوب لمنصة "Smart Lands".
- أسلوبك: بشوش، خدوم، وتتحدث العربية باللهجة السعودية الودودة (مثلاً: "يا هلا"، "أبشر"، "تحت أمرك").
- هدفك: مساعدة المستخدم بناءً على البيانات المتاحة لك.

# Security & Data Access Rules
1. البيانات العامة: الأراضي والمستخدمين (مسموح ذكرها).
2. البيانات الخاصة: العقود والمحادثات (ممنوع ذكرها إلا إذا كان المستخدم {current_user.user_id} طرفاً فيها).

# Current Context
- المرسل: {current_user.full_name} (ID: {current_user.user_id})

# Database Snapshot
{context_json}
"""
        
        # 3. Call Gemini
        # Gemini handles system instructions best if prepended or via specific API if supported.
        # We'll prepend it to the user message or use it as context.
        # For simple chat completion, passing it as prompt is effective.
        
        full_prompt = f"{system_instructions}\n\nUSER MESSAGE: {payload.message}"
        
        response = model.generate_content(full_prompt)
        
        if response.text:
            return {"response": response.text}
        else:
            return {"response": "عذراً، لم أستطع فهم طلبك."}

    except Exception as e:
        logger.error("AI_AGENT_ERROR: %r", e, exc_info=True)
        # Safe error exposure for debugging
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

