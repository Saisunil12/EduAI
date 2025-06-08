# EduAI - Interactive Learning Platform

**EduAI** is a smart, AI-powered platform designed to make learning more interactive and accessible. It allows users to upload their study notes in PDF format, ask AI questions related to the content, generate concise summaries, and even convert notes into podcasts for auditory learning.

---

## ✅ Features

- 📄 Upload and manage PDF notes with cloud storage
- ❓ AI-powered Q&A from uploaded notes
- 📝 AI-generated note summarization
- 🎙️ Convert notes into podcasts (text-to-speech)
- 🌓 Modern, responsive user interface with dark/light mode
- 🔒 Secure authentication and cloud storage using Supabase
- ⚡ Real-time updates and chat functionality

---

## 👨‍💻 Developed By

- **Mohit R** – R22EK044  
- **SP Monish** – R22EK049  
- **Sai Sunil G** – R22EA052  
- **Sai Akhil V** – R22EA051

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- Python 3.8+
- FFmpeg (for audio processing)
- Supabase account (for authentication and storage)
- Groq API key (for AI capabilities)

### 1. Clone the Repository

```bash
git clone https://github.com/SpMonish84/EduAI.git
cd EduAI
```

### 2. Install FFmpeg

Download and install FFmpeg from [FFmpeg official builds](https://github.com/BtbN/FFmpeg-Builds/releases). Make sure to add it to your system PATH.

### 3. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Groq API Configuration
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=mistral-saba-24b
   
   # Backend Configuration
   PORT=8006
   ```

### 4. Backend Setup (Python)

1. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python app.py
   ```
   The backend will start on: http://localhost:8006

### 5. Frontend Setup (Node.js + Vite)

1. Navigate to the UI directory:
   ```bash
   cd ui
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will start on: http://localhost:3000

### 6. Initialize Supabase

1. Create a new project on [Supabase](https://supabase.com/)
2. Set up the required tables by running the SQL migrations in the `supabase/migrations` folder
3. Create a storage bucket named `pdf-files` with the appropriate Row Level Security (RLS) policies

## 🔧 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required environment variables are set in the `.env` file
   - The frontend needs `VITE_` prefixed variables to be accessible in the browser

2. **Supabase Connection Issues**
   - Verify your Supabase URL and anon key
   - Check that CORS is properly configured in your Supabase project settings
   - Ensure the required tables and storage buckets exist

3. **PDF Upload/Processing Failures**
   - Check that the Supabase storage bucket exists and has the correct permissions
   - Verify that the file size is within limits
   - Ensure the PDF is not password protected

4. **AI Chat Not Working**
   - Verify your Groq API key is valid
   - Check the backend logs for any errors
   - Ensure the note ID being passed is valid

## 📚 Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
