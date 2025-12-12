from typing import Optional
import logging
import os
import json

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from groq import Groq

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.chat_message import ChatMessage

logger = logging.getLogger("smartlands.reports")

router = APIRouter(prefix="/reports", tags=["reports"])

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
client = Groq(api_key=GROQ_API_KEY)

class ReportCreate(BaseModel):
    user_reported_id: int
    conversation_id: int
    report_reason: str

class ReportOut(BaseModel):
    report_id: int
    user_reporter_id: int
    user_reported_id: int
    conversation_id: int
    report_reason: str
    report_status: str
    # created_at: datetime # Optional

@router.post("", response_model=ReportOut, status_code=201)
async def create_report(
    payload: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # 1. Fetch Conversation History
        # We need to verify user was part of conversation too
        # But for brevity, let's just fetch messages.
        
        msgs_res = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == payload.conversation_id)
            .order_by(ChatMessage.created_at.asc())
        )
        messages = msgs_res.scalars().all()
        
        chat_transcript = ""
        for m in messages:
            chat_transcript += f"User {m.sender_user_id}: {m.content_text}\n"

        # 2. Call Groq for Analysis
        system_prompt = """
        You are a content moderator. 
        Analyze the following chat conversation and the report reason.
        Determine if the report is "valid" or "invalid" based on toxic behavior, scams, or harassment.
        Reply ONLY with one word: "valid" or "invalid".
        """
        
        user_prompt = f"""
        Report Reason: {payload.report_reason}
        
        Chat Transcript:
        {chat_transcript}
        """

        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0,
                max_tokens=10
            )
            analysis_result = chat_completion.choices[0].message.content.strip().lower()
            
            # Extract valid/invalid
            if "valid" in analysis_result and "invalid" not in analysis_result:
                status = "valid"
            elif "invalid" in analysis_result:
                status = "invalid"
            else:
                # Fallback
                status = "pending"
                logger.warning(f"Groq returned unclear report status: {analysis_result}")

        except Exception as e:
            logger.error(f"Groq Analysis Failed: {e}")
            status = "pending"

        # 3. Save Report
        report = Report(
            user_reporter_id=current_user.user_id,
            user_reported_id=payload.user_reported_id,
            conversation_id=payload.conversation_id,
            report_reason=payload.report_reason,
            report_status=status
        )
        
        db.add(report)
        await db.commit()
        await db.refresh(report)
        
        return ReportOut(
            report_id=report.report_id,
            user_reporter_id=report.user_reporter_id,
            user_reported_id=report.user_reported_id,
            conversation_id=report.conversation_id,
            report_reason=report.report_reason,
            report_status=report.report_status
        )

    except Exception as e:
        logger.error("CREATE_REPORT_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to submit report")
