import logging
import os
from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import requests
from supabase import create_client, Client

from utils import extract_text_from_pdf, clean_text, save_podcast_metadata, get_podcast_metadata
from podcast_generator import generate_podcast_script, create_audio

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Log environment variables (without sensitive values)
logger.info("Environment variables:")
logger.info(f"VITE_SUPABASE_URL set: {bool(os.getenv('VITE_SUPABASE_URL'))}")
logger.info(f"VITE_SUPABASE_ANON_KEY set: {bool(os.getenv('VITE_SUPABASE_ANON_KEY'))}")
logger.info(f"GROQ_API_KEY set: {bool(os.getenv('GROQ_API_KEY'))}")
logger.info(f"GROQ_MODEL: {os.getenv('GROQ_MODEL')}")
logger.info(f"PORT: {os.getenv('PORT')}")
logger.info(f"HOST: {os.getenv('HOST')}")

try:
    # Initialize Supabase client
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Missing Supabase configuration")
        
    logger.info("Initializing Supabase client...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    logger.info("Supabase client initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise

# Set default values for required environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
GROQ_MODEL = os.getenv("GROQ_MODEL", "mistral-saba-24b")

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)

# Initialize FastAPI app
app = FastAPI(title="Podcast Generator API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/podcasts", StaticFiles(directory="podcasts"), name="podcasts")
templates = Jinja2Templates(directory="templates")

# Create necessary directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("podcasts", exist_ok=True)
os.makedirs("metadata", exist_ok=True)

# Store tasks in memory (in production, use a proper database)
TASKS = {}

class PodcastStatus(BaseModel):
    status: str
    message: str
    progress: Optional[float] = None
    audio_url: Optional[str] = None

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Serve the main page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/create-podcast")
async def create_podcast(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    model: Optional[str] = Form(None),
    sync: bool = Form(False)
):
    # Use requested model or default from GROQ_MODEL
    model = model or GROQ_MODEL
    """Create a podcast from a PDF file"""
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    task_id = str(uuid4())
    
    try:
        # Save uploaded file
        file_path = f"uploads/{task_id}_{pdf_file.filename}"
        with open(file_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        # Initialize task status
        TASKS[task_id] = {
            "status": "processing",
            "message": "Processing PDF...",
            "progress": 0.1
        }
        
        # Process podcast (sync or async)
        if sync:
            await process_podcast_creation(
                task_id,
                file_path,
                model,
                pdf_file.filename
            )
        else:
            background_tasks.add_task(
                process_podcast_creation,
                task_id,
                file_path,
                model,
                pdf_file.filename
            )
        return {"task_id": task_id}
    except Exception as e:
        logger.error(f"Error in create_podcast: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/podcast_status/{task_id}")
async def get_podcast_status(task_id: str):
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.get("/get_podcast/{task_id}")
async def get_podcast(task_id: str):
    metadata = get_podcast_metadata(task_id)
    if not metadata or metadata.get("status") != "completed":
        raise HTTPException(status_code=404, detail="Podcast not found or not completed")
    audio_path = metadata.get("output_path")
    if not audio_path or not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename=os.path.basename(audio_path),
        headers={"Accept-Ranges": "bytes"}
    )

# Legacy endpoints for backward compatibility
@app.get("/podcast/{task_id}/status")
async def legacy_get_podcast_status(task_id: str):
    return await get_podcast_status(task_id)

@app.get("/podcast/{task_id}")
async def legacy_get_podcast(task_id: str):
    return await get_podcast(task_id)

@app.post("/api/generate_podcast_from_note")
async def generate_podcast_from_note(
    background_tasks: BackgroundTasks,
    payload: dict = Body(...)
):
    note_id = payload.get("note_id")
    podcast_title = payload.get("title", "Podcast")
    user_id = payload.get("user_id")
    if not note_id or not user_id:
        raise HTTPException(status_code=400, detail="note_id and user_id are required")

    # 1. Fetch note record from Supabase
    note_resp = supabase.table("notes").select("file_path,title").eq("id", note_id).single().execute()
    if not note_resp.data:
        raise HTTPException(status_code=404, detail="Note not found")
    file_path = note_resp.data["file_path"]
    note_title = note_resp.data["title"]

    # 2. Download PDF from Supabase Storage
    # file_path is a public URL, so we can use requests.get
    pdf_resp = requests.get(file_path)
    if pdf_resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Could not download PDF from storage")
    pdf_bytes = pdf_resp.content

    # 3. Generate podcast audio (reuse your logic)
    task_id = str(uuid4())
    pdf_filename = f"{task_id}.pdf"
    audio_filename = f"{task_id}.mp3"
    pdf_local_path = os.path.join("uploads", pdf_filename)
    audio_local_path = os.path.join("podcasts", audio_filename)
    with open(pdf_local_path, "wb") as f:
        f.write(pdf_bytes)

    # Use your existing process_podcast_creation logic, but synchronously
    TASKS[task_id] = {
        "status": "processing",
        "message": "Processing PDF...",
        "progress": 0.1
    }

    try:
        await process_podcast_creation(
            task_id,
            pdf_local_path,
            GROQ_MODEL,
            pdf_filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Podcast generation failed: {str(e)}")

    # 4. Upload audio to Supabase Storage (podcasts bucket)
    metadata = get_podcast_metadata(task_id)
    actual_audio_path = metadata.get("output_path", audio_local_path)
    with open(actual_audio_path, "rb") as f:
        audio_data = f.read()
    storage_path = f"{user_id}/{os.path.basename(actual_audio_path)}"
    upload_resp = supabase.storage.from_("podcast_audio").upload(storage_path, audio_data)
    if not upload_resp:
        raise HTTPException(status_code=500, detail="Failed to upload podcast audio to Supabase")
    # Get public URL
    public_url = supabase.storage.from_("podcast_audio").get_public_url(storage_path)

    # 5. Insert podcast record in Supabase
    podcast_insert = supabase.table("podcasts").insert({
        "user_id": user_id,
        "note_id": note_id,
        "title": podcast_title or note_title,
        "description": f"Podcast generated from note {note_title}",
        "file_path": public_url,
        "duration": None  # You can update this if you have duration info
    }).execute()
    if not podcast_insert.data:
        raise HTTPException(status_code=500, detail="Failed to insert podcast record")

    # 6. Return podcast info
    return {
        "podcast": podcast_insert.data[0],
        "audio_url": public_url
    }

@app.post("/api/summarize_note")
async def summarize_note(
    note_id: str = Body(...),
    format: str = Body("bullet"),
    length: str = Body("medium")
):
    # 1. Fetch note record from Supabase
    note_resp = supabase.table("notes").select("file_path,title").eq("id", note_id).single().execute()
    if not note_resp.data:
        raise HTTPException(status_code=404, detail="Note not found")
    file_path = note_resp.data["file_path"]

    # 2. Download PDF from Supabase Storage
    pdf_resp = requests.get(file_path)
    if pdf_resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Could not download PDF from storage")
    pdf_bytes = pdf_resp.content

    # 3. Extract text from PDF
    text_content = extract_text_from_pdf(pdf_bytes)
    text_content = clean_text(text_content)

    # 4. Build prompt for Groq LLM
    prompt = f"Summarize the following content in {format} format and {length} length:\n\n{text_content[:32000]}"

    # 5. Call Groq LLM
    summary_response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful study note summarizer."},
            {"role": "user", "content": prompt}
        ]
    )
    summary = summary_response.choices[0].message.content.strip()
    return {"summary": summary}

@app.post("/api/chat")
async def chat_with_note(
    request: Request,
    note_id: str = Body(..., embed=True, min_length=1, description="The ID of the note to chat about"),
    question: str = Body(..., embed=True, min_length=1, description="The user's question"),
    history: list = Body(default=[], embed=True, description="Chat history for context")
):
    logger.info(f"=== New Chat Request ===")
    logger.info(f"Note ID: {note_id}")
    logger.info(f"Question: {question[:100]}{'...' if len(question) > 100 else ''}")
    
    try:
        # 1. Validate inputs
        if not note_id or not isinstance(note_id, str):
            logger.error("Invalid note_id provided")
            raise HTTPException(status_code=400, detail="A valid note ID is required")
            
        if not question or not isinstance(question, str) or len(question.strip()) < 2:
            logger.error("Invalid question provided")
            raise HTTPException(status_code=400, detail="A valid question is required")

        # 2. Fetch note record from Supabase
        try:
            logger.info(f"Fetching note {note_id} from database...")
            note_resp = supabase.table("notes").select("file_path,title").eq("id", note_id).single().execute()
            
            if not note_resp.data:
                logger.error(f"Note {note_id} not found in database")
                raise HTTPException(status_code=404, detail="Note not found")
                
            file_path = note_resp.data.get("file_path")
            note_title = note_resp.data.get("title", "Untitled Note")
            
            if not file_path:
                logger.error(f"Note {note_id} has no file_path")
                raise HTTPException(status_code=400, detail="Note has no associated file")
                
            logger.info(f"Found note: {note_title} (File: {file_path})")
            
        except HTTPException:
            raise
        except Exception as e:
            error_msg = f"Database error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise HTTPException(status_code=500, detail=error_msg)

        # 3. Download PDF from Supabase Storage
        try:
            logger.info(f"Downloading PDF from: {file_path}")
            pdf_resp = requests.get(file_path, timeout=15)  # Increased timeout
            pdf_resp.raise_for_status()
            pdf_bytes = pdf_resp.content
            
            if not pdf_bytes:
                raise ValueError("Downloaded PDF is empty")
                
            logger.info("Successfully downloaded PDF file")
            
        except requests.Timeout:
            error_msg = "Timed out while downloading PDF"
            logger.error(error_msg)
            raise HTTPException(status_code=504, detail=error_msg)
            
        except requests.RequestException as e:
            error_msg = f"Error downloading PDF: {str(e)}"
            logger.error(error_msg)
            status_code = 404 if isinstance(e, requests.HTTPError) and e.response.status_code == 404 else 500
            raise HTTPException(status_code=status_code, detail=error_msg)

        # 4. Extract text from PDF
        try:
            logger.info("Extracting text from PDF...")
            text_content = extract_text_from_pdf(pdf_bytes)
            
            if not text_content or not isinstance(text_content, str):
                raise ValueError("Failed to extract text from PDF")
                
            text_content = clean_text(text_content)
            
            if not text_content.strip():
                raise ValueError("Extracted text is empty")
                
            logger.info(f"Extracted {len(text_content)} characters from PDF")
            
        except Exception as e:
            error_msg = f"Error processing PDF: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise HTTPException(status_code=400, detail=error_msg)

        # 5. Build prompt for Groq LLM
        try:
            logger.info("Building prompt for Groq LLM...")
            
            # Truncate content to fit within token limits
            max_content_length = 32000
            if len(text_content) > max_content_length:
                logger.warning(f"Truncating note content from {len(text_content)} to {max_content_length} characters")
                text_content = text_content[:max_content_length]
            
            system_prompt = (
                "You are an expert study assistant. Answer questions about the provided note content. "
                "Be accurate, concise, and helpful. If the answer isn't in the note, say so. "
                f"The note is titled: {note_title}"
            )
            
            user_prompt = f"""Note Content:
{text_content}

Question: {question}

Please provide a detailed answer based on the note content above."""
            
            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if available
            if history and isinstance(history, list):
                for msg in history:
                    if (isinstance(msg, dict) and 
                        msg.get("role") in ["user", "assistant"] and 
                        msg.get("content") and 
                        isinstance(msg["content"], str)):
                        
                        messages.append({
                            "role": msg["role"], 
                            "content": msg["content"][:2000]  # Limit history length
                        })
            
            # Add current question
            messages.append({"role": "user", "content": question})
            
            logger.info(f"Sending request to Groq with {len(messages)} messages")

            # 6. Call Groq LLM
            try:
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=messages,
                    max_tokens=1500,
                    temperature=0.7,
                    top_p=0.9,
                    timeout=30  # seconds
                )
                
                if not response.choices or not response.choices[0].message.content:
                    raise ValueError("Empty response from AI model")
                    
                answer = response.choices[0].message.content.strip()
                logger.info("Successfully received response from Groq")
                
                # Simple source citation (can be enhanced with RAG in the future)
                sources = [{
                    "text": "Answer is based on the provided note content.",
                    "page": 1,
                    "document": f"{note_title}.pdf"
                }]
                
                logger.info("Returning successful response")
                return {
                    "answer": answer,
                    "sources": sources
                }
                
            except Exception as e:
                error_msg = f"Groq API error: {str(e)}"
                logger.error(error_msg, exc_info=True)
                raise HTTPException(status_code=502, detail=error_msg)
            
        except Exception as e:
            error_msg = f"Error in chat processing: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise HTTPException(status_code=500, detail=error_msg)
            
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        logger.error(f"HTTP Error {he.status_code}: {he.detail}")
        raise
        
    except Exception as e:
        error_msg = f"Unexpected error in chat_with_note: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")

async def process_podcast_creation(
    task_id: str,
    file_path: str,
    model: str,
    original_filename: str
):
    try:
        # 1. Extract text from PDF
        TASKS[task_id].update({
            "message": "Extracting text from PDF",
            "progress": 0.2
        })
        with open(file_path, "rb") as f:
            text_content = extract_text_from_pdf(f.read())
        text_content = clean_text(text_content)
        
        # 2. Generate podcast script using Groq
        TASKS[task_id].update({
            "message": "Generating podcast script",
            "progress": 0.4
        })
        script = generate_podcast_script(client, text_content, model)
        
        # 3. Generate audio (Edge TTS)
        TASKS[task_id].update({
            "message": "Generating audio",
            "progress": 0.8
        })
        audio_path = None
        try:
            audio_path = await create_audio(script, task_id)
        except Exception as e:
            logger.error(f"create_audio failed: {e}", exc_info=True)
            # Fallback: create 2-second silent audio
            from pydub import AudioSegment
            silent = AudioSegment.silent(duration=2000)
            os.makedirs("podcasts", exist_ok=True)
            audio_path = f"podcasts/podcast_{task_id}.mp3"
            silent.export(audio_path, format="mp3")
            logger.info(f"Silent fallback audio saved to {audio_path}")
        finally:
            # 4. Save metadata and update status regardless of error
            save_podcast_metadata(
                task_id=task_id,
                metadata={
                    "original_filename": original_filename,
                    "output_path": audio_path,
                    "status": "completed"
                }
            )
            TASKS[task_id].update({
                "status": "completed",
                "message": "Podcast created successfully",
                "progress": 1.0,
                "audio_path": audio_path,
                "audio_url": f"/get_podcast/{task_id}"
            })
        
    except Exception as e:
        logger.error(f"Error processing podcast: {str(e)}")
        TASKS[task_id].update({
            "status": "failed",
            "message": f"Error: {str(e)}",
            "progress": 0
        })
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn, os
    # Use PORT env var or default to 8006
    port = int(os.getenv("PORT", 8006))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
