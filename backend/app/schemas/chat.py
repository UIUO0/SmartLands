from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

# --- Messages ---

class ChatMessageCreate(BaseModel):
    content_text: Optional[str] = None
    attachment_url: Optional[str] = None

class ChatMessageOut(BaseModel):
    message_id: int
    conversation_id: int
    sender_user_id: int
    content_text: Optional[str] = None
    attachment_url: Optional[str] = None
    created_at: datetime
    
    # Optional: Include sender name if needed immediately
    # sender_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Conversations ---

class ChatConversationOut(BaseModel):
    conversation_id: int
    agreement_id: int
    buyer_user_id: int
    seller_user_id: int
    created_at: datetime
    
    # We will likely want to show the "other party" name and last message
    other_party_name: Optional[str] = None
    last_message: Optional[ChatMessageOut] = None

    model_config = ConfigDict(from_attributes=True)

class ChatListOut(BaseModel):
    items: List[ChatConversationOut]
    total: int
