import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def check_notes():
    """Check for valid note IDs in the database."""
    try:
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase URL or Anon Key in environment variables")
            return False
            
        print(f"🔌 Connecting to Supabase at: {supabase_url}")
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test database connection
        try:
            result = supabase.table('notes').select("id,title,file_path").execute()
            print(f"\n✅ Found {len(result.data)} notes:")
            for note in result.data:
                print(f"  - ID: {note['id']}")
                print(f"    Title: {note['title']}")
                print(f"    File Path: {note['file_path']}")
                print()
            
        except Exception as e:
            print(f"⚠️  Could not access 'notes' table: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Checking Notes in Database...\n")
    check_notes() 