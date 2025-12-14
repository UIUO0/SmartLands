import urllib.request
import json

KEY = "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"
URL = "https://openrouter.ai/api/v1/chat/completions"

def test_chat():
    headers = {
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Smart Lands Helper"
    }
    payload = {
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [
            {"role": "user", "content": "Hello"}
        ]
    }
    data = json.dumps(payload).encode("utf-8")
    
    try:
        req = urllib.request.Request(URL, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            print("Response:")
            print(result['choices'][0]['message']['content'])
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
