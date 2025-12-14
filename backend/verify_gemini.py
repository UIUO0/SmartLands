import google.generativeai as genai
import os

# We can rely on the env var or hardcode for safety in this script
# os.environ["GOOGLE_API_KEY"] is likely set if I launch it right. 
# But I'll read from .env if needed or just use the key I know.
KEY = "AIzaSyDAXdygtbhlY0oYkx2KS_OR7k9ITGleq-k"
genai.configure(api_key=KEY)

def test_gemini():
    try:
        print("Testing Gemini 2.5 Flash...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Hello! Are you working?")
        
        print("Response:")
        print(response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gemini()
