import uuid
from typing import List
from io import BytesIO
from PyPDF2 import PdfReader
import chromadb
from chromadb import PersistentClient
from pydantic import BaseModel
import google.generativeai as genai
import logging
import os
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeMetadata(BaseModel):
    name: str

    model_config = {
        "extra": "forbid",
        "populate_by_name": True,
    }

class ResumeProcessor:
    def __init__(self, gemini_api_key: str = None, chroma_dir: str = "./chroma_resumes", collection_name: str = "resume_collection"):
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("Missing GEMINI_API_KEY. Please set it in the environment variables.")

        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

        self.chroma_client = PersistentClient(path=chroma_dir)
        self.collection = self.chroma_client.get_or_create_collection(name=collection_name)

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        reader = PdfReader(BytesIO(file_bytes))
        text = " ".join([page.extract_text() or "" for page in reader.pages])
        if not text:
            logger.warning("No text extracted from PDF.")
        return text

    def store_in_vector_db(self, resume_texts: List[str], filenames: List[str]) -> None:
        for idx, text in enumerate(resume_texts):
            doc_id = f"{filenames[idx]}-{uuid.uuid4()}"
            self.collection.add(
                documents=[text],
                ids=[doc_id],
                metadatas=[{"filename": filenames[idx]}]
            )
            logger.info(f"Stored document {doc_id} in vector database.")

    def generate_top_resume(self, resume_texts: List[str], filenames: List[str]) -> str:
        default_prompt = (
            "You are an expert recruiter. Analyze the following resumes and determine which candidate is "
            "best suited for the given role based on skills, experience, and education."
            "give the **name of the resumer only how you think is selected**"
        )
        base_prompt = default_prompt
        combined_prompt = ("You are an expert recruiter evaluating multiple resumes for a job opening."

"Based on the content of each resume, choose the candidate(s) who are the best fit for the role in terms of relevant skills, experience, and education."

"Return only the full names of the top 1–3 candidates in order of suitability. Do not include any explanation — just output their names.")

        for i, text in enumerate(resume_texts):
            combined_prompt += f"Resume {i + 1} ({filenames[i]}):\n{text[:1500]}\n\n"

        try:
            response = self.model.generate_content(combined_prompt)
            if hasattr(response, "text"):
                return response.text
            else:
                return "No response from Gemini."
        except Exception as e:
            logger.error(f"Error generating resume analysis: {e}")
            return f"Error generating resume analysis: {str(e)}"