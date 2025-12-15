import sys
import os
import py_compile
from google.api_core.exceptions import ResourceExhausted

print("Successfully imported ResourceExhausted from google.api_core.exceptions")

file_path = "app/routers/ai_agent.py"
try:
    py_compile.compile(file_path, doraise=True)
    print(f"Successfully compiled {file_path} (Syntax OK)")
except py_compile.PyCompileError as e:
    print(f"Syntax error in {file_path}: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error compiling {file_path}: {e}")
    sys.exit(1)
