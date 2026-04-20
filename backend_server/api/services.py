import json
import os
from io import BytesIO

from openai import OpenAI
from PyPDF2 import PdfReader


def extract_pdf_text(uploaded_pdf) -> str:
    data = uploaded_pdf.read()
    reader = PdfReader(BytesIO(data))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing in backend environment variables.")
    return OpenAI(api_key=api_key)


def generate_flashcards_from_text(source_text: str):
    client = _get_client()
    prompt = (
        "Convert the following text into high-quality study flashcards. "
        "Each flashcard should include: question, answer, difficulty (easy/medium/hard), "
        "type (definition, concept, example). Return ONLY valid JSON array.\n\n"
        f"{source_text[:12000]}"
    )
    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        input=prompt,
        temperature=0.4,
    )
    content = response.output_text.strip()
    cards = json.loads(content)
    if not isinstance(cards, list):
        raise ValueError("AI response was not a JSON array.")
    return cards


def explain_answer(answer_text: str) -> str:
    client = _get_client()
    prompt = (
        "Explain this answer in a simple and friendly way like teaching a 10-year-old:\n\n"
        f"{answer_text}"
    )
    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        input=prompt,
        temperature=0.5,
    )
    return response.output_text.strip()
