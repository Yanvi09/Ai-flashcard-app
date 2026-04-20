import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const USER_KEY = "flash_user";
const DECKS_KEY = "flash_decks";

function readDecks() {
  const raw = localStorage.getItem(DECKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeDecks(decks) {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

function buildReviewQueue(cards, hardIds, easyIds) {
  const hard = cards.filter((card) => hardIds.includes(card.id));
  const medium = cards.filter((card) => !hardIds.includes(card.id) && !easyIds.includes(card.id));
  const easy = cards.filter((card) => easyIds.includes(card.id));
  return [...hard, ...medium, ...hard, ...easy];
}

function LoginPage({ username, onSave }) {
  const [name, setName] = useState(username);
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    const cleaned = name.trim();
    if (!cleaned) return;
    onSave(cleaned);
    navigate("/dashboard");
  };

  return (
    <main className="page center">
      <section className="panel login-panel">
        <h1>Flashcraft</h1>
        <p>Turn any PDF into polished AI flashcards.</p>
        <form onSubmit={submit}>
          <label htmlFor="name">Your first name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
          />
          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}

function DashboardPage({ username }) {
  const [decks, setDecks] = useState(readDecks());
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onUpload = async (event) => {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const response = await fetch(`${API_BASE}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to generate flashcards from this PDF.");
      const payload = await response.json();

      const newDeck = {
        id: crypto.randomUUID(),
        title: file.name.replace(".pdf", ""),
        sourceFile: file.name,
        createdAt: new Date().toISOString(),
        cards: payload.flashcards.map((card, index) => ({
          id: `${index}-${crypto.randomUUID()}`,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty ?? "medium",
          type: card.type ?? "concept",
        })),
        progress: {
          completedIds: [],
          easyIds: [],
          hardIds: [],
        },
      };

      const updatedDecks = [newDeck, ...decks];
      setDecks(updatedDecks);
      writeDecks(updatedDecks);
      setFile(null);
      navigate(`/practice/${newDeck.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Welcome, {username}</h1>
          <p>Upload a PDF and practice instantly.</p>
        </div>
      </header>

      <section className="panel upload-panel">
        <h2>Create a new deck</h2>
        <form onSubmit={onUpload} className="upload-form">
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button type="submit" disabled={loading || !file}>
            {loading ? "Generating..." : "Upload PDF"}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Your decks</h2>
        <div className="deck-grid">
          {decks.length === 0 ? <p className="muted">No decks yet. Upload your first PDF.</p> : null}
          {decks.map((deck) => (
            <button key={deck.id} className="deck-card" onClick={() => navigate(`/practice/${deck.id}`)}>
              <h3>{deck.title}</h3>
              <p>{deck.cards.length} cards</p>
              <small>{new Date(deck.createdAt).toLocaleDateString()}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function PracticePage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [decks, setDecks] = useState(readDecks());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);

  const deck = decks.find((item) => item.id === deckId);
  const queue = useMemo(() => {
    if (!deck) return [];
    return buildReviewQueue(deck.cards, deck.progress.hardIds, deck.progress.easyIds);
  }, [deck]);

  if (!deck) {
    return (
      <main className="page center">
        <section className="panel">
          <p>Deck not found.</p>
          <button onClick={() => navigate("/dashboard")}>Back to dashboard</button>
        </section>
      </main>
    );
  }

  const card = queue[index % queue.length];
  const completed = deck.progress.completedIds.length;
  const percent = Math.round((completed / deck.cards.length) * 100);

  const updateProgress = (updater) => {
    const updatedDecks = decks.map((item) => {
      if (item.id !== deckId) return item;
      return {
        ...item,
        progress: updater(item.progress),
      };
    });
    setDecks(updatedDecks);
    writeDecks(updatedDecks);
  };

  const markDifficulty = (mode) => {
    updateProgress((progress) => {
      const completedIds = Array.from(new Set([...progress.completedIds, card.id]));
      const hardIds = mode === "hard"
        ? Array.from(new Set([...progress.hardIds, card.id]))
        : progress.hardIds.filter((id) => id !== card.id);
      const easyIds = mode === "easy"
        ? Array.from(new Set([...progress.easyIds, card.id]))
        : progress.easyIds.filter((id) => id !== card.id);
      return { completedIds, hardIds, easyIds };
    });
    setIndex((prev) => prev + 1);
    setFlipped(false);
    setExplanation("");
  };

  const explainAnswer = async () => {
    setExplaining(true);
    setExplanation("");
    try {
      const response = await fetch(`${API_BASE}/explain/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: card.answer }),
      });
      if (!response.ok) throw new Error("Could not explain this answer.");
      const payload = await response.json();
      setExplanation(payload.explanation);
    } catch (err) {
      setExplanation(err.message);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>{deck.title}</h1>
          <p>Practice mode with smart weighting for hard cards.</p>
        </div>
        <button className="ghost" onClick={() => navigate("/dashboard")}>Back</button>
      </header>

      <section className="panel progress-panel">
        <div className="stats">
          <span>Total: {deck.cards.length}</span>
          <span>Completed: {completed}</span>
          <span>Easy: {deck.progress.easyIds.length}</span>
          <span>Hard: {deck.progress.hardIds.length}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <section className="panel card-panel">
        <button className={`card ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped((prev) => !prev)}>
          <div className="card-face">
            <small>{card.type} · {card.difficulty}</small>
            <h2>{flipped ? card.answer : card.question}</h2>
          </div>
        </button>

        <div className="actions">
          <button onClick={() => { setIndex((prev) => Math.max(0, prev - 1)); setFlipped(false); setExplanation(""); }}>Previous</button>
          <button onClick={() => { setIndex((prev) => prev + 1); setFlipped(false); setExplanation(""); }}>Next</button>
          <button className="easy" onClick={() => markDifficulty("easy")}>Mark Easy</button>
          <button className="hard" onClick={() => markDifficulty("hard")}>Mark Hard</button>
          <button onClick={explainAnswer} disabled={explaining}>
            {explaining ? "Explaining..." : "Explain Answer"}
          </button>
        </div>

        {explanation ? <p className="explanation">{explanation}</p> : null}
      </section>
    </main>
  );
}

function App() {
  const [username, setUsername] = useState(localStorage.getItem(USER_KEY) ?? "");

  const saveUsername = (value) => {
    localStorage.setItem(USER_KEY, value);
    setUsername(value);
  };

  return (
    <Routes>
      <Route path="/" element={username ? <Navigate to="/dashboard" replace /> : <LoginPage username={username} onSave={saveUsername} />} />
      <Route path="/dashboard" element={username ? <DashboardPage username={username} /> : <Navigate to="/" replace />} />
      <Route path="/practice/:deckId" element={username ? <PracticePage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
