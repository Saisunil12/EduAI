import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_api():
    """Test Supabase API access directly."""
    try:
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase URL or Anon Key in environment variables")
            return False
            
        print(f"🔌 Testing connection to: {supabase_url}")
        
        # Test REST API endpoint
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
        
        # Try to get notes
        notes_url = f"{supabase_url}/rest/v1/notes?select=id,title,file_path"
        print(f"\n📡 Making request to: {notes_url}")
        
        response = requests.get(notes_url, headers=headers)
        print(f"\n📝 Response Status: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")
        
        if response.ok:
            notes = response.json()
            print(f"\n✅ Found {len(notes)} notes:")
            for note in notes:
                print(f"  - ID: {note['id']}")
                print(f"    Title: {note['title']}")
                print(f"    File Path: {note['file_path']}")
                print()
        else:
            print(f"❌ Error: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Supabase API Access...\n")
    test_supabase_api() 