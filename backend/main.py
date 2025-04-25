from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
from pydantic import BaseModel
from typing import List
import os
import tempfile
from query_engine import QueryEngine
from dotenv import load_dotenv
from typing import List,Dict
from auth import router as auth_router
from db import get_collection
from pymongo import MongoClient
from passlib.context import CryptContext
from schemas import UserCreate
from auth import get_password_hash,create_access_token

load_dotenv()

# Connect to MongoDB
uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(uri)
db = client["resume_analyzer"]
users_collection = db["users"]
admin_collection = db["admins"]
users_collection = get_collection("users")
admin_collection = get_collection("admins")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

app = FastAPI()
app.include_router(auth_router)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Retrieve API Key for Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize QueryEngine
query_engine = QueryEngine(gemini_api_key=GEMINI_API_KEY)

class QueryRequest(BaseModel):
    user_query: str
    resume_text: str

class ResumeRequest(BaseModel):
    resume_text: str

class Question(BaseModel):
    question: str
    options: List[str]
    answer: str

class SubmitAnswerRequest(BaseModel):
    user_answer: str
    correct_answer: str
    resume_text: str
    question: str
    history: List[Dict]

class GetFeedbackRequest(BaseModel):
    history: List[Dict]
    resume_text: str

class ResumeData(BaseModel):
    resume_text: str 

class UserQueryRequest(BaseModel):
    user_query: str
    resume_text: str

class UserAnswerRequest(BaseModel):
    user_answer: str
    correct_answer: str

class UserAnswersRequest(BaseModel):
    user_answers: dict
    resume_text: str

class UserLogin(BaseModel):
    email: str
    password: str

class TestResultsRequest(BaseModel):
    questions: List[dict]
    resume_text: str

class AnswerRequest(BaseModel):
    selected_answer: str
    current_question: dict

def extract_text_from_pdf(file_path):
    with open(file_path, "rb") as f:
        reader = PdfReader(f)
        text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    return text

# Resume Upload Endpoint
@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            temp_path = tmp.name

        with open(temp_path, "rb") as f:
            reader = PdfReader(f)
            resume_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

        os.remove(temp_path)

        return {"resume_text": resume_text}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
    
    
# Query Handler Endpoint
@app.post("/ask-query")
async def ask_query(request: QueryRequest):
    """Endpoint to process the user's query based on the uploaded resume."""
    if not request.user_query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")
    
    # Process the query using the QueryEngine (replace with your actual logic)
    response = query_engine.query(request.user_query, request.resume_text)
    
    return JSONResponse({"response": response}, status_code=200)

@app.post("/adaptive_test/start")
def start_adaptive_test(request: ResumeRequest):
    resume_text = request.resume_text
    question_data, error = query_engine.generate_next_question(resume_text)
    
    if error:
        return {"error": error}
    
    formatted_options = [
        {"answer": opt, "isCorrect": opt.strip() == question_data["answer"].strip()}
        for opt in question_data["options"]
    ]

    return {
        "question": question_data["question"],
        "options": formatted_options,
        "difficulty_level": question_data["difficulty_level"]
    }

@app.post("/adaptive_test/submit")
async def submit_answer(user_answer_request: UserAnswerRequest):
    try:
        user_answer = user_answer_request.user_answer
        correct_answer = user_answer_request.correct_answer
        
        # Update difficulty based on user's answer
        result = query_engine.update_difficulty(user_answer, correct_answer)
        
        # Generate next question
        question_data, error = query_engine.generate_next_question(user_answer_request.correct_answer)
        
        print(f"Next Question: {question_data}")  # Debugging log
        
        if error:
            raise HTTPException(status_code=500, detail=error)
        
        return {
            "is_correct": result["is_correct"],
            "new_difficulty": result["new_difficulty"],
            "next_question": question_data["question"],
            "options": question_data["options"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adaptive_test/feedback")
async def provide_feedback(user_answers_request: UserAnswersRequest):
    """
    Analyzes the user's answers and provides detailed feedback.
    """
    try:
        user_answers = user_answers_request.user_answers
        resume_text = user_answers_request.resume_text
        
        feedback = query_engine.analyze_user_answers(user_answers, resume_text)
        
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset_difficulty")
async def reset_difficulty():
    """
    Resets the difficulty engine to the initial state.
    """
    try:
        query_engine.difficulty_engine.reset()
        return {"message": "Difficulty reset to the initial state."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/adaptive_test/answer")
def process_answer(request: AnswerRequest):
    """Processes the user's answer and returns feedback."""
    try:
        selected_answer = request.selected_answer
        current_question = request.current_question
        
        # Extract the correct answer from the current question
        correct_answer = None
        for option in current_question["options"]:
            if option.get("isCorrect", False):
                correct_answer = option["answer"]
                break
        
        if not correct_answer:
            raise HTTPException(status_code=400, detail="No correct answer found in the question data")
        
        # Check if the answer is correct
        is_correct = selected_answer.strip() == correct_answer.strip()
        
        # Update difficulty based on the answer
        query_engine.difficulty_engine.record_response(is_correct)
        
        return {
            "correct": is_correct,
            "correct_answer": correct_answer,
            "new_difficulty": query_engine.difficulty_engine.get_current_difficulty()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/adaptive_test/results")
def get_test_results(request: TestResultsRequest):
    """Analyzes the complete test results and provides detailed feedback."""
    try:
        questions = request.questions
        resume_text = request.resume_text
        
        # Format question history for analysis
        question_answers = {item["question"]: item["user_answer"] for item in questions}
        
        # Generate feedback analysis
        feedback = query_engine.analyze_user_answers(question_answers, resume_text)
        
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adaptive_test/reset")
def reset_test():
    """Resets the adaptive test difficulty engine."""
    try:
        query_engine.difficulty_engine.reset()
        return {"message": "Test reset successfully", "new_difficulty": query_engine.difficulty_engine.get_current_difficulty()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/signup")
async def signup(user: UserCreate):
    try:
        if users_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered.")

        user_dict = user.dict()
        user_dict["password"] = get_password_hash(user_dict["password"])

        # Insert user into MongoDB
        result = users_collection.insert_one(user_dict)

        if result.inserted_id:
            return {"message": "Signup successful!"}
        else:
            raise HTTPException(status_code=500, detail="Signup failed.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/adminsignup")
async def signup(user: UserCreate):
    try:
        if admin_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered.")

        user_dict = user.dict()
        user_dict["password"] = get_password_hash(user_dict["password"])

        result = admin_collection.insert_one(user_dict)

        if result.inserted_id:
            return {"message": "Signup successful!"}
        else:
            raise HTTPException(status_code=500, detail="Signup failed.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(user: UserLogin):
    try:
        # Find user by email
        user_record = users_collection.find_one({"email": user.email})
        if not user_record:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        # Verify password
        if not pwd_context.verify(user.password, user_record["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        # Generate JWT token
        access_token = create_access_token(data={"sub": user.email})
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/adminlogin")
async def login(user: UserLogin):
    try:
        # Find user by email
        user_record = admin_collection.find_one({"email": user.email})
        if not user_record:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        # Verify password
        if not pwd_context.verify(user.password, user_record["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        # Generate JWT token
        access_token = create_access_token(data={"sub": user.email})
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
from process import ResumeProcessor

processor = ResumeProcessor(gemini_api_key=os.getenv("GEMINI_API_KEY"))

@app.post("/upload-resumes/")
async def upload_resumes(
    files: List[UploadFile] = File(...),
):
    resumes_text = []
    filenames = []

    for file in files:
        content = await file.read()
        text = processor.extract_text_from_pdf(content)
        resumes_text.append(text)
        filenames.append(file.filename)

    processor.store_in_vector_db(resumes_text, filenames)

    top_result = processor.generate_top_resume(resumes_text, filenames)

    top_result_names = top_result.split("\n")  
    return {"top_result": top_result_names}
