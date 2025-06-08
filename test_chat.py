import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_chat_api(note_id=None, question="What is this document about?"):
    """Test the chat API endpoint."""
    try:
        # Get API URL from environment or use default
        api_url = os.getenv('VITE_API_URL', 'http://localhost:8006')
        chat_endpoint = f"{api_url.rstrip('/')}/api/chat"
        
        # If no note_id provided, try to get a note from Supabase
        if not note_id:
            supabase_url = os.getenv('VITE_SUPABASE_URL') or os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
            
            if not supabase_url or not supabase_key:
                print("❌ Error: Missing Supabase URL or Anon Key")
                return False
                
            # Import here to avoid dependency if not needed
            from supabase import create_client
            supabase = create_client(supabase_url, supabase_key)
            
            # Get the first note
            result = supabase.table('notes').select('id,title').limit(1).execute()
            
            if not result.data:
                print("❌ No notes found in the database. Please upload a note first.")
                return False
                
            note_id = result.data[0]['id']
            note_title = result.data[0]['title']
            print(f"📝 Using note: {note_title} (ID: {note_id})")
        
        # Prepare the request payload
        payload = {
            "note_id": note_id,
            "question": question,
            "history": []
        }
        
        print(f"\n📤 Sending request to: {chat_endpoint}")
        print(f"   Question: {question}")
        print("\n⏳ Waiting for response...")
        
        # Make the request
        response = requests.post(
            chat_endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # 60 seconds timeout
        )
        
        # Process the response
        print(f"\n📥 Response status code: {response.status_code}")
        
        try:
            response_data = response.json()
            print("\n📄 Response body:")
            print(json.dumps(response_data, indent=2))
            
            if response.status_code == 200 and 'answer' in response_data:
                print("\n✅ Chat API test successful!")
                return True
            else:
                print(f"\n❌ Error in response: {response_data.get('detail', 'Unknown error')}")
                return False
                
        except json.JSONDecodeError:
            print(f"\n❌ Invalid JSON response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ An error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test the chat API')
    parser.add_argument('--note-id', type=str, help='Note ID to use for the chat')
    parser.add_argument('--question', type=str, default="What is this document about?", 
                        help='Question to ask about the document')
    
    args = parser.parse_args()
    
    print("🔍 Testing Chat API...\n")
    
    success = test_chat_api(note_id=args.note_id, question=args.question)
    
    if not success:
        print("\n❌ Chat API test failed. Please check the error messages above.")
        sys.exit(1)
    else:
        print("\n✅ All tests completed successfully!")
