"""
Provider-agnostic LLM client.

Talks to any OpenAI-compatible `/chat/completions` endpoint, so the AI provider
is a configuration choice and not a code dependency:

    LLM_API_KEY    API key for the chosen provider (optional for local servers)
    LLM_BASE_URL   Base URL of the provider's OpenAI-compatible API
    LLM_MODEL      Model name to request

Examples of LLM_BASE_URL:
    OpenAI      https://api.openai.com/v1
    Groq        https://api.groq.com/openai/v1
    Gemini      https://generativelanguage.googleapis.com/v1beta/openai
    OpenRouter  https://openrouter.ai/api/v1
    Ollama      http://localhost:11434/v1
"""
import logging
import os
from typing import Dict, List, Optional

import httpx

logger = logging.getLogger("smartlands.llm")

DEFAULT_BASE_URL = "https://api.openai.com/v1"


class LLMNotConfigured(RuntimeError):
    """Raised when no model is configured."""


class LLMRateLimited(RuntimeError):
    """Raised when the provider answers 429."""


def _settings() -> tuple:
    return (
        os.getenv("LLM_API_KEY"),
        os.getenv("LLM_BASE_URL", DEFAULT_BASE_URL).rstrip("/"),
        os.getenv("LLM_MODEL"),
    )


def is_configured() -> bool:
    api_key, base_url, model = _settings()
    if not model:
        return False
    # A key is required for hosted providers; local servers (e.g. Ollama) may run without one.
    is_local = "localhost" in base_url or "127.0.0.1" in base_url
    return bool(api_key) or is_local


async def chat(
    messages: List[Dict[str, str]],
    *,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    timeout: float = 60.0,
) -> str:
    """Send chat messages ({"role": "system|user|assistant", "content": ...}) and return the reply text."""
    if not is_configured():
        raise LLMNotConfigured("LLM_MODEL / LLM_API_KEY are not set")

    api_key, base_url, model = _settings()
    payload: Dict = {"model": model, "messages": messages}
    if temperature is not None:
        payload["temperature"] = temperature
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)

    if resp.status_code == 429:
        raise LLMRateLimited(resp.text[:200])
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()
