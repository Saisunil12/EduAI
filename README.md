# EduAI - Interactive Learning Platform

**EduAI** is a smart, AI-powered platform designed to make learning more interactive and accessible. It allows users to upload their study notes in PDF format, ask AI questions related to the content, generate concise summaries, and even convert notes into podcasts for auditory learning.

---

## ✅ Features

- Upload and manage PDF notes
- AI-powered Q&A from uploaded notes
- AI-generated note summarization
- Convert notes into podcasts (text-to-speech)
- Modern, responsive user interface with dark/light mode
- Secure authentication and cloud storage using Supabase

---

## 👨‍💻 Developed By

- **Mohit R** – R22EK044  
- **SP Monish** – R22EK049  
- **Sai Sunil G** – R22EA052  
- **Sai Akhil V** – R22EA051

---

## 📦 How to Clone and Run the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/SpMonish84/EduAI.git
cd EduAI
```

### 2. FFmpeg Setup
Download FFmpeg from [FFmpeg official builds](https://github.com/BtbN/FFmpeg-Builds/releases) and store it in the project folder.

### 3. Backend Setup (Python)
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```
```bash 
python app.py 
```
###4. Frontend Setup (Node.js + Next.js)
```bash
cd ui
npm install
npm run dev
```
 - The frontend will start on: http://localhost:3000

### 5. Environment Variables
 - Copy .env.example to .env in both backend and ui/ folder.

 - Add the following keys:

```bash
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

