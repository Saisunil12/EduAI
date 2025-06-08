import os
import uvicorn

def set_env_vars():
    os.environ["VITE_SUPABASE_URL"] = "https://guxewmpocounzgrgklsh.supabase.co"
    os.environ["VITE_SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZndxYmhpd2VjYnVtd2JqdG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MjE2MDAsImV4cCI6MjAyNTM5NzYwMH0.RHELKzLJBDmwOhWNH5LwQOXXlPi-QmxnQgE6_T7YlQE"
    os.environ["GROQ_API_KEY"] = "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"
    os.environ["GROQ_MODEL"] = "mistral-saba-24b"
    os.environ["PORT"] = "8006"
    os.environ["HOST"] = "127.0.0.1"

if __name__ == "__main__":
    set_env_vars()
    uvicorn.run("app:app", host="127.0.0.1", port=8006, reload=False) 