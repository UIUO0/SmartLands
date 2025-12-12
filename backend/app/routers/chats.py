from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage
from app.schemas.chat import (
    ChatConversationOut,
    ChatMessageOut,
    ChatMessageCreate,
    ChatListOut
)

# For file uploads
import cloudinary
import cloudinary.uploader
import os

logger = logging.getLogger("smartlands.chats")

router = APIRouter(prefix="/chats", tags=["chats"])


# ---------------------------
# List Conversations
# ---------------------------
@router.get("", response_model=ChatListOut)
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List all conversations for the current user (sent or received).
    Also populates 'other_party_name' and 'last_message'.
    """
    try:
        # Find conversations where I am buyer OR seller
        stmt = (
            select(ChatConversation)
            .options(
                selectinload(ChatConversation.buyer),
                selectinload(ChatConversation.seller),
                # We want the LAST message. 
                # Doing this efficiently in one query is hard in pure ORM without lateral joins.
                # We'll fetch messages separately or eager load all (inefficient)
                # For now: eager load messages order by desc limit 1? 
                # SQLAlchemy eager load limit is tricky.
                # Let's just load messages and pick the last one in python for small lists
                selectinload(ChatConversation.messages)
            )
            .where(
                or_(
                    ChatConversation.buyer_user_id == current_user.user_id,
                    ChatConversation.seller_user_id == current_user.user_id
                )
            )
            .order_by(ChatConversation.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        # Count total
        count_stmt = select(func.count()).select_from(ChatConversation).where(
             or_(
                    ChatConversation.buyer_user_id == current_user.user_id,
                    ChatConversation.seller_user_id == current_user.user_id
                )
        )
        res_total = await db.execute(count_stmt)
        total = res_total.scalar_one()

        res = await db.execute(stmt)
        conversations = res.scalars().all()

        results = []
        for conv in conversations:
            # Determine other party
            if conv.buyer_user_id == current_user.user_id:
                other = conv.seller
            else:
                other = conv.buyer
            
            other_name = other.full_name if other else "Unknown"

            # Find last message from loaded relationship
            # Note: without proper ordering in relationship, this might be random. 
            # Ideally we should define relationship with order_by.
            # But let's sort in python for now since we have a limit.
            last_msg = None
            if conv.messages:
                # Sort by id desc
                sorted_msgs = sorted(conv.messages, key=lambda m: m.message_id, reverse=True)
                if sorted_msgs:
                    m = sorted_msgs[0]
                    last_msg = ChatMessageOut.model_validate(m)

            out = ChatConversationOut(
                conversation_id=conv.conversation_id,
                agreement_id=conv.agreement_id,
                buyer_user_id=conv.buyer_user_id,
                seller_user_id=conv.seller_user_id,
                created_at=conv.created_at,
                other_party_name=other_name,
                last_message=last_msg
            )
            results.append(out)

        return {"total": total, "items": results}

    except Exception as e:
        logger.error("LIST_CHATS_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list chats")


# ---------------------------
# Get Messages (History)
# ---------------------------
@router.get("/{conversation_id}/messages", response_model=List[ChatMessageOut])
async def get_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        # Verify access
        res = await db.execute(select(ChatConversation).where(ChatConversation.conversation_id == conversation_id))
        conv = res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_user_id != current_user.user_id and conv.seller_user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not a participant")

        # Fetch messages
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.desc()) # Newest first usually for frontend logic, or asc
            .limit(limit)
            .offset(offset)
        )
        res_msgs = await db.execute(stmt)
        msgs = res_msgs.scalars().all()
        
        # Reverse to get chronological order (Oldest -> Newest)
        # We queried DESC to get the *latest* N, now we flip them for display.
        msgs = list(reversed(msgs))
        
        return [ChatMessageOut.model_validate(m) for m in msgs]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("GET_MESSAGES_ERROR: %r", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch messages")


# ---------------------------
# Send Message
# ---------------------------
@router.post("/{conversation_id}/messages", response_model=ChatMessageOut)
async def send_message(
    conversation_id: int,
    payload: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Verify access
        res = await db.execute(select(ChatConversation).where(ChatConversation.conversation_id == conversation_id))
        conv = res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_user_id != current_user.user_id and conv.seller_user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not a participant")

        if not payload.content_text and not payload.attachment_url:
            raise HTTPException(status_code=400, detail="Message must have text or attachment")

        msg = ChatMessage(
            conversation_id=conversation_id,
            sender_user_id=current_user.user_id,
            content_text=payload.content_text,
            attachment_url=payload.attachment_url
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        
        return ChatMessageOut.model_validate(msg)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("SEND_MESSAGE_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message")


# ---------------------------
# Upload Attachment (Optional helper)
# ---------------------------
@router.post("/{conversation_id}/attachments", response_model=ChatMessageOut)
async def upload_attachment(
    conversation_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Uploads an image, then creates a message with that image url.
    """
    try:
        # Verify access
        res = await db.execute(select(ChatConversation).where(ChatConversation.conversation_id == conversation_id))
        conv = res.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conv.buyer_user_id != current_user.user_id and conv.seller_user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not a participant")

        # Upload to Cloudinary
        if not cloudinary.config().api_key and not os.getenv("CLOUDINARY_API_KEY"):
             raise HTTPException(status_code=500, detail="Cloudinary not configured")

        content = await file.read()
        if not content:
             raise HTTPException(status_code=400, detail="Empty file")

        folder = f"smartlands/chats/{conversation_id}"
        result = await run_in_threadpool(
            cloudinary.uploader.upload,
            content,
            folder=folder,
            resource_type="auto" # or 'image'
        )
        secure_url = result.get("secure_url")
        
        # Create message
        msg = ChatMessage(
            conversation_id=conversation_id,
            sender_user_id=current_user.user_id,
            content_text=None,
            attachment_url=secure_url
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        
        return ChatMessageOut.model_validate(msg)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("UPLOAD_ATTACHMENT_ERROR: %r", e, exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to upload attachment")


# Helper for running sync upload in threadpool
from fastapi.concurrency import run_in_threadpool
