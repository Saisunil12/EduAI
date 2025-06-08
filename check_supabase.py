import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def check_supabase_connection():
    """Check if Supabase connection is working."""
    try:
        supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase URL or Anon Key in environment variables")
            return False
            
        print(f"🔌 Connecting to Supabase at: {supabase_url}")
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test authentication
        auth_response = supabase.auth.get_session()
        print("✅ Successfully connected to Supabase")
        
        # Test database connection
        try:
            result = supabase.table('notes').select("*").limit(1).execute()
            print(f"✅ Successfully connected to 'notes' table. Found {len(result.data)} notes.")
        except Exception as e:
            print(f"⚠️  Could not access 'notes' table: {str(e)}")
        
        # Test storage
        try:
            storage_response = supabase.storage.list_buckets()
            buckets = [bucket.name for bucket in storage_response.data]
            print(f"✅ Found {len(buckets)} storage buckets: {', '.join(buckets)}")
            
            if 'pdf-files' not in buckets:
                print("⚠️  Warning: 'pdf-files' bucket not found. You may need to create it.")
            
        except Exception as e:
            print(f"⚠️  Could not access storage: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {str(e)}")
        return False

def check_required_tables():
    """Check if all required database tables exist."""
    required_tables = ['notes', 'profiles']
    missing_tables = []
    
    try:
        supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase URL or Anon Key")
            return False
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        for table in required_tables:
            try:
                result = supabase.table(table).select("*").limit(1).execute()
                print(f"✅ Table '{table}' exists")
            except Exception as e:
                print(f"❌ Table '{table}' is missing: {str(e)}")
                missing_tables.append(table)
        
        if missing_tables:
            print(f"\n⚠️  Missing tables: {', '.join(missing_tables)}")
            print("   Please run the SQL migrations in the 'supabase/migrations' folder.")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking tables: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Checking Supabase Configuration...\n")
    
    # Check environment variables
    print("📋 Environment Variables:")
    supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
    groq_key = os.getenv('GROQ_API_KEY')
    
    print(f"   VITE_SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Missing'}")
    print(f"   VITE_SUPABASE_ANON_KEY: {'✅ Set' if supabase_key else '❌ Missing'}")
    print(f"   GROQ_API_KEY: {'✅ Set' if groq_key else '❌ Missing'}")
    
    if not all([supabase_url, supabase_key]):
        print("\n❌ Missing required environment variables. Please check your .env file.")
        sys.exit(1)
    
    print("\n🔌 Testing Supabase Connection...")
    if not check_supabase_connection():
        sys.exit(1)
    
    print("\n📊 Checking Database Tables...")
    if not check_required_tables():
        print("\n⚠️  Some database tables are missing. Please run the migrations.")
    
    print("\n✅ Supabase configuration check completed!")
