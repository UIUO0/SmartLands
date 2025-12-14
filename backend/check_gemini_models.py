import google.generativeai as genai
import os

KEY = "AIzaSyDAXdygtbhlY0oYkx2KS_OR7k9ITGleq-k"
genai.configure(api_key=KEY)

def list_models():
    try:
        print("Listing available models...")
        with open("gemini_models_list.txt", "w", encoding="utf-8") as f:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    f.write(f"{m.name}\n")
        print("Done writing gemini_models_list.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
