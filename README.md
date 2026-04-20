# Flashcraft - AI Flashcard Web App

A polished full-stack flashcard app with:
- React (Vite) frontend
- Django backend
- PDF upload + AI flashcard generation
- Smart review (hard cards appear more often)
- Progress tracking and explanation mode
- No auth/database for user data (all decks and progress in localStorage)

## Folder Structure

```text
Flashcard/
  frontend/
    src/
      App.jsx
      main.jsx
      index.css
    .env.example
    package.json
  backend_server/
    backend/
      settings.py
      urls.py
    api/
      urls.py
      views.py
      services.py
    requirements.txt
    .env.example
    manage.py
```

## Backend Setup (Django)

```bash
cd backend_server
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

API endpoints:
- `POST /upload-pdf/` - upload PDF, returns generated flashcards
- `POST /explain/` - explain an answer in simple language

## Frontend Setup (React + Vite)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on Vite default (`http://localhost:5173`).

## Environment Variables

Backend (`backend_server/.env`):
- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional, default `gpt-4.1-mini`)
- `DJANGO_SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOW_ALL_ORIGINS`

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL` (default `http://127.0.0.1:8000`)

## Product Features

- **Login page:** simple username stored in localStorage
- **Dashboard:** upload PDF, generate deck, list all decks
- **Practice mode:** flip cards, next/previous, mark easy/hard
- **Smart review logic:** weighted queue repeats hard cards more often
- **Progress panel:** total, completed, easy/hard counts + progress bar
- **Explain Answer:** calls backend AI explanation endpoint
- **Responsive UI:** modern cards, smooth transitions, soft visual design

## Deployment Notes

### Backend on Render
1. Create a Web Service from `backend_server`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT`
4. Add environment variables from `.env.example`.

### Frontend on Vercel
1. Import `frontend` directory as project.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add env var `VITE_API_BASE_URL` pointing to deployed Render backend URL.
