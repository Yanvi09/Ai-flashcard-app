import json
import os
import re
from io import BytesIO

from openai import OpenAI
from PyPDF2 import PdfReader
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import explain_answer


def _fallback_flashcards(source_name: str = "your file"):
    return [
        {
            "question": f"What is the core idea of {source_name}?",
            "answer": "It presents key concepts that should be reviewed in short, clear chunks.",
            "difficulty": "easy",
            "type": "concept",
        },
        {
            "question": "Why is spaced repetition useful when studying?",
            "answer": "Reviewing information over time helps move it into long-term memory.",
            "difficulty": "medium",
            "type": "definition",
        },
        {
            "question": "How can you use this deck effectively?",
            "answer": "Mark hard cards honestly, revisit them often, and explain answers in your own words.",
            "difficulty": "easy",
            "type": "example",
        },
    ]


def _normalize_flashcards(cards):
    if not isinstance(cards, list):
        return []

    normalized = []
    for item in cards:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question", "")).strip()
        answer = str(item.get("answer", "")).strip()
        if not question or not answer:
            continue

        difficulty = str(item.get("difficulty", "medium")).strip().lower()
        if difficulty not in {"easy", "medium", "hard"}:
            difficulty = "medium"

        card_type = str(item.get("type", "concept")).strip().lower()
        if card_type not in {"definition", "concept", "example"}:
            card_type = "concept"

        normalized.append(
            {
                "question": question,
                "answer": answer,
                "difficulty": difficulty,
                "type": card_type,
            }
        )
    return normalized


def _extract_pdf_text_safe(uploaded_pdf):
    try:
        data = uploaded_pdf.read()
        if not data:
            return ""

        reader = PdfReader(BytesIO(data))
        page_texts = []
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                page_texts.append(page_text if page_text else "")
            except Exception:
                page_texts.append("")

        return "\n".join(page_texts).strip()
    except Exception as exc:
        print(f"[upload-pdf] PDF extraction failed: {exc}")
        return ""


def _parse_ai_json_array(raw_text: str):
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _generate_flashcards_with_ai(source_text: str):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing.")

    prompt = (
        "Convert the following text into high-quality study flashcards. "
        "Each flashcard should include: question, answer, difficulty (easy/medium/hard), "
        "type (definition, concept, example). Return ONLY valid JSON array.\n\n"
        f"{source_text[:12000]}"
    )

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        input=prompt,
        temperature=0.4,
    )
    ai_text = (response.output_text or "").strip()
    print(f"[upload-pdf] AI raw response: {ai_text}")
    return _parse_ai_json_array(ai_text)


class UploadPdfView(APIView):
    def post(self, request):
        pdf = request.FILES.get("pdf", None)
        if not pdf:
            return Response({"error": "Missing pdf file."}, status=status.HTTP_400_BAD_REQUEST)

        source_name = getattr(pdf, "name", "your file")
        extracted_text = _extract_pdf_text_safe(pdf)
        print(f"[upload-pdf] Extracted text length: {len(extracted_text)}")

        # If extraction failed or is too short, return stable fallback output.
        if len(extracted_text) < 80:
            return Response({"flashcards": _fallback_flashcards(source_name)}, status=status.HTTP_200_OK)

        try:
            parsed_cards = _generate_flashcards_with_ai(extracted_text)
            normalized_cards = _normalize_flashcards(parsed_cards)
            if not normalized_cards:
                return Response({"flashcards": _fallback_flashcards(source_name)}, status=status.HTTP_200_OK)
            return Response({"flashcards": normalized_cards}, status=status.HTTP_200_OK)
        except Exception as exc:
            print(f"[upload-pdf] AI generation/parsing failed: {exc}")
            return Response({"flashcards": _fallback_flashcards(source_name)}, status=status.HTTP_200_OK)


class ExplainView(APIView):
    def post(self, request):
        answer = request.data.get("answer", "").strip()
        if not answer:
            return Response({"error": "Answer text is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Keep the prompt simple and beginner-friendly.
            prompt_answer = f"Explain this in very simple terms like teaching a beginner: {answer}"
            explanation = explain_answer(prompt_answer)
            if not explanation:
                explanation = f"This concept means: {answer}"
            return Response({"explanation": explanation}, status=status.HTTP_200_OK)
        except Exception as exc:
            print(f"[explain] AI explanation failed: {exc}")
            fallback = f"This concept means: {answer}"
            return Response({"explanation": fallback}, status=status.HTTP_200_OK)
