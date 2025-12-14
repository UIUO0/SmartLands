import httpx
import asyncio
import json

KEY = "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"
URL = "https://openrouter.ai/api/v1/chat/completions"

async def test_chat():
    headers = {
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "User-Agent": "OpenAI/Python 1.55.0", # Mimic library
        "Accept": "application/json",
    }
    payload = {
        "model": "mistralai/devstral-2512:free",
        "messages": [
            {"role": "user", "content": "Hello! Say 'It works' if you can hear me."}
        ]
    }
    
    try:
        print("Testing with httpx (async)...")
        async with httpx.AsyncClient() as client:
            response = await client.post(URL, headers=headers, json=payload, timeout=30.0)
            
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Response:")
            print(response.json()['choices'][0]['message']['content'])
        else:
            print(f"Failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
