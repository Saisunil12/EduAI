import os
from dotenv import load_dotenv

def check_environment():
    """Check if all required environment variables are set."""
    load_dotenv()  # Load environment variables from .env file
    
    required_vars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'GROQ_API_KEY',
        'GROQ_MODEL'
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nPlease create a .env file with the required variables (see .env.example)")
        return False
    
    print("✅ All required environment variables are set")
    return True

if __name__ == "__main__":
    check_environment()
