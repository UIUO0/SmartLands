import urllib.request
import json

KEY = "sk-or-v1-JUNKJUNKJUNK"

def list_models():
    url = "https://openrouter.ai/api/v1/models"
    headers = {"Authorization": f"Bearer {KEY}"}
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            models = data.get("data", [])
            with open("models_list.txt", "w", encoding="utf-8") as f:
                for m in models:
                    mid = m["id"]
                    if "mistral" in mid.lower() or "devstral" in mid.lower():
                        f.write(mid + "\n")
            print("Done writing models_list.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
