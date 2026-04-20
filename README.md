# AI Flashcard Learning App

An AI-powered web application that converts PDFs into interactive flashcards to enhance learning through active recall and smart review.

---

##  Live Demo

Frontend: https://69e6705a950ff70dc5a036ae--thunderous-swan-90e94d.netlify.app/
Backend: https://flashcard-backend-r4ag.onrender.com

---

##  Problem Statement

Traditional studying methods rely heavily on passive reading, which leads to poor retention.
This project addresses that by transforming static PDF content into **interactive flashcards** using AI-driven techniques.

---

##  Features

* Upload any PDF and generate flashcards
* AI-based question-answer generation (with fallback handling)
* Interactive flashcard UI with flip animation
* Mark cards as **Easy / Hard**
* Progress tracking (completed, easy, hard)
* Smart review logic (hard cards repeated more)
* "Explain Answer" feature with graceful fallback
* Fast and clean UI for seamless experience

---

## Key Design Decisions

* Focused on **learning effectiveness** rather than just generation
* Implemented **difficulty-based review system** instead of full spaced repetition
* Used **localStorage** instead of database for simplicity and speed
* Added **fallback mechanisms** to ensure app never crashes even if AI fails

---

## Trade-offs

* No full SM-2 spaced repetition algorithm (time constraint)
* No authentication system
* Limited persistence (client-side storage only)

---

## Tech Stack

### Frontend

* React (Vite)
* CSS (custom styling)
* LocalStorage (state persistence)

### Backend

* Django
* Gunicorn (production server)
* PyPDF2 (PDF parsing)
* Django CORS Headers

### Deployment

* Frontend: Netlify
* Backend: Render

---

## Project Structure

```
Flashcard/
│
├── backend_server/
│   ├── api/
│   │   ├── views.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── models.py
│   │
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── assets/
│   │
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## Setup Instructions (Local)

### Backend

```bash
cd backend_server
pip install -r requirements.txt
python manage.py runserver
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create `.env` in backend:

```
OPENAI_API_KEY=your_key (optional)
```

---

## Challenges Faced

* Handling inconsistent PDF parsing
* Ensuring AI response reliability
* Preventing backend crashes with proper fallback logic
* Managing full-stack deployment under time constraints

---

## Future Improvements

* Implement full spaced repetition algorithm (SM-2)
* Add authentication and cloud storage
* Improve AI-generated flashcard quality
* Add analytics dashboard for learning insights

---

## Author

Developed by Yanvi
GitHub: https://github.com/Yanvi09

---

## Conclusion

This project focuses on delivering a **practical, reliable, and user-friendly learning tool**, showcasing strong product thinking and full-stack execution under constraints.
