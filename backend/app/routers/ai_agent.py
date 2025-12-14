from typing import List, Optional, Any
import logging
import json
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.land import Land
from app.models.agreement import Agreement
from app.models.chat_conversation import ChatConversation

logger = logging.getLogger("smartlands.ai")

router = APIRouter(prefix="/ai", tags=["ai"])

# Initialize OpenRouter Client (via OpenAI SDK)
# WARNING: Ideally this should be in os.environ["OPENROUTER_API_KEY"]
# For now, we use the provided key if env var is missing, but best practice is env var.
# OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_API_KEY = "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"

# DEBUG LOGGING
masked_key = OPENROUTER_API_KEY[:10] + "..." if OPENROUTER_API_KEY else "None"
logger.info(f"AI_AGENT_INIT: BaseURL='https://openrouter.ai/api/v1', KeyPrefix='{masked_key}'")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "http://localhost:3000", # Optional but good practice
        "X-Title": "Smart Lands Helper",
    }
)

class AIRequest(BaseModel):
    message: str

class AIResponse(BaseModel):
    response: str

async def gather_context(db: AsyncSession, current_user: User) -> List[Any]:
    """
    Gathers permissible data snapshot for the AI context.
    1. Public Data: All Lands (simplified), All Owners (simplified emails).
    2. Private Data: Agreements & Chats where user is a participant.
    """
    snapshot = []

    # 1. Lands (Public)
    # We select key fields to avoid token overflow
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
    # Be careful with privacy. User approved: "Email for any user".
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

    # 3. Agreements (Restricted to current user)
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

    # 4. Chats (Restricted to current user)
    # Just listing conversation metadata, not full history to save tokens
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
    try:
        # 1. Gather Context
        context_data = await gather_context(db, current_user)
        context_json = json.dumps(context_data, ensure_ascii=False)

        # 2. Construct System Prompt
        system_prompt = f"""
# Role & Persona
أنت المساعد الذكي والمحبوب لمنصة "Smart Lands".
- أسلوبك: بشوش، خدوم، وتتحدث العربية باللهجة السعودية الودودة (مثلاً: "يا هلا"، "أبشر"، "تحت أمرك").
- هدفك: مساعدة المستخدم بناءً على البيانات المتاحة لك، دون ذكر أنك تقرأ من "قاعدة بيانات" أو "نص". تصرف وكأنك تعرف هذه المعلومات طبيعياً.

# Security & Data Access Rules (IMPORTANT)
لديك صلاحية الوصول لنسخة لحظية من قاعدة البيانات. يجب عليك الالتزام الصارم بقواعد الخصوصية التالية بناءً على معرف المستخدم (User ID) الخاص بالمرسل:

1. البيانات العامة (مسموح لك ذكرها لأي أحد):
   - جميع معلومات الأراضي (Lands).
   - معلومات الملاك (Owners).
   - البريد الإلكتروني (Email) لأي مستخدم.

2. البيانات الخاصة (حساسة جداً - Restricted):
   - العقود (Agreements).
   - المحادثات (Chats).
   شرط الوصول: لا تتحدث عن أي عقد أو محادثة إلا إذا كان الـ User ID الخاص بالمرسل طرفاً فيها. إذا سأل المستخدم عن عقود أو محادثات لا تخصه، اعتذر بلطافة وقل أنك لا تملك صلاحية للإطلاع عليها.

# Current Context
- المرسل الحالي (User ID): {current_user.user_id}
- الاسم: {current_user.full_name}

# Database Snapshot
{context_json}
"""

        # 3. Call OpenRouter (via OpenAI SDK)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": payload.message,
                }
            ],
            model="mistralai/devstral-2512:free",
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stop=None,
            stream=False,
        )

        response_text = chat_completion.choices[0].message.content
        return {"response": response_text}

    except Exception as e:
        logger.error("AI_AGENT_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
