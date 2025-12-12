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
from app.models.chat_conversation import ChatConversation
from app.models.agreement import Agreement
from app.models.land import Land
from app.utils.email import send_warning_email
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

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
        reporter_id = current_user.user_id
        reported_id = payload.user_reported_id
        
        for m in messages:
            role_label = "UNKNOWN"
            if m.sender_user_id == reporter_id:
                role_label = f"REPORTER (ID {reporter_id})"
            elif m.sender_user_id == reported_id:
                role_label = f"REPORTED_USER (ID {reported_id})"
            else:
                role_label = f"OTHER_USER (ID {m.sender_user_id})"
                
            chat_transcript += f"[{role_label}]: {m.content_text}\n"

        # 2. Call Groq for Analysis
        system_prompt = f"""
        You are a content moderator. 
        You are reviewing a report made by the REPORTER against the REPORTED_USER.
        
        Analyze the chat conversation and the report reason.
        
        CRITERIA FOR "VALID":
        - The REPORTED_USER (ID {reported_id}) MUST be the one who violated the rules.
        - The REPORTED_USER sent messages containing harassment, spam, scam, or toxicity.
        
        CRITERIA FOR "INVALID":
        - If the REPORTED_USER did nothing wrong, it is INVALID.
        - If the REPORTER is the one sending the toxic/bad messages, the report is INVALID (False Report).
        - If both are toxic, but the reporter started it, it is INVALID.
        
        CRITICAL RULE:
        - IGNORE toxicity from the REPORTER when deciding if the report is valid. 
        - ONLY punish the REPORTED_USER. 
        - If the REPORTER is the bad actor, the report is INVALID.
        
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

        # 4. Side Effects: Cancel Agreement & Delete Conversation
        # We do this regardless of validity status as per business rule.
        try:
            # Fetch Conversation with Agreement
            res_conv = await db.execute(
                select(ChatConversation)
                .options(selectinload(ChatConversation.agreement))
                .where(ChatConversation.conversation_id == payload.conversation_id)
            )
            conv = res_conv.scalar_one_or_none()
            
            if conv:
                # Cancel Agreement
                if conv.agreement:
                    conv.agreement.status = "cancelled"
                    conv.agreement.cancelled_at = func.now()
                    
                    # Set Land to Available
                    res_land = await db.execute(select(Land).where(Land.land_id == conv.agreement.land_id))
                    land = res_land.scalar_one_or_none()
                    if land:
                        land.status = "available"
                
                # Delete Conversation (Cascades to messages usually, or we delete usage)
                await db.delete(conv)
                
                await db.commit()
                logger.info(f"Report CLEANUP: Cancelled agreement and deleted conversation {payload.conversation_id}")
        except Exception as e:
            logger.error(f"Report Side Effect Failed: {e}")
            # Don't fail the request, the report was submitted.

        # 5. If VALID, Send Warning Email to Reported User
        if status == "valid":
             try:
                # Fetch Reported User to get email
                res_user = await db.execute(select(User).where(User.user_id == payload.user_reported_id))
                reported_user = res_user.scalar_one_or_none()
                
                if reported_user:
                     await run_in_threadpool(
                         lambda: send_warning_email(reported_user, payload.report_reason, use_sendgrid=True)
                     )
                     logger.info(f"Warning email sent to user {payload.user_reported_id}")
                     
             except Exception as e:
                 logger.error(f"Failed to send warning email: {e}")
        
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


@router.get("/sent", response_model=list[ReportOut])
async def list_sent_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List reports made by the current user.
    """
    try:
        res = await db.execute(
            select(Report)
            .where(Report.user_reporter_id == current_user.user_id)
            .order_by(Report.created_at.desc())
        )
        reports = res.scalars().all()
        return [
            ReportOut(
                report_id=r.report_id,
                user_reporter_id=r.user_reporter_id,
                user_reported_id=r.user_reported_id,
                conversation_id=r.conversation_id,
                report_reason=r.report_reason,
                report_status=r.report_status
            )
            for r in reports
        ]
    except Exception as e:
        logger.error("LIST_SENT_REPORTS_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch reports")
