import os
import google.generativeai as genai
from store_main import ChromaDBManager
from dotenv import load_dotenv
import json
import re

load_dotenv()

class QueryEngine:
    def __init__(self, gemini_api_key=None):
        """Initializes the Query Engine with Gemini API."""
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("Missing GEMINI_API_KEY. Please set it in the environment variables.")

        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.db_manager = ChromaDBManager()
        
        # Initialize adaptive difficulty engine
        self.difficulty_engine = AdaptiveDifficultyEngine()

    def query(self, user_query, resume_text):
        """Fetches relevant feedback from ChromaDB and generates a response using Gemini."""
        relevant_feedback = self.db_manager.retrieve_documents(user_query)

        # Ensure valid text is passed
        relevant_feedback = relevant_feedback if relevant_feedback else "No relevant feedback available."

        # Combine resume and retrieved feedback as context
        combined_context = f"Resume:\n{resume_text}\n\nRelevant Feedback:\n{relevant_feedback}"

        return self.generate_ai_response(user_query, combined_context)
        
    def generate_ai_response(self, user_query, context):
        """Generates a concise and insightful AI response using Google Gemini."""
        prompt = f"""
        You are a professional career coach specializing in personalized resume analysis and career growth. Your task is to analyze the user's resume and relevant feedback to provide a **tailored, actionable, and insightful** response.

        **User Query:** {user_query}

        **Relevant Context (Resume + Feedback):**
        {context}

        **Instructions for Personalized Response:**
        1. Begin by mentioning specific details from their resume that are relevant to their query (skills, experience, educational background)
        2. Connect your advice directly to their background and career trajectory
        3. Structure your response clearly with:
        - A brief personalized introduction acknowledging their specific situation
        - Targeted advice that addresses their exact query
        - Actionable next steps tailored to their experience level and background
        4. Use a supportive, professional tone
        5. Keep your response concise (max 3-4 paragraphs or 5-7 bullet points)
        6. If appropriate, mention industry-specific advice based on their field

        **IMPORTANT:** Ensure your advice is specifically tailored to THEIR resume details - avoid generic responses that could apply to anyone.

        **Generate the response in a professional yet conversational way.**
        """

        try:
            response = self.model.generate_content([{"role": "user", "parts": [{"text": prompt}]}])
            return response.text.strip() if hasattr(response, "text") else "No response generated."
        except Exception as e:
            return f"Error generating response: {str(e)}"
        
    def generate_next_question(self, resume_text):
        """Generates the next MCQ question based on current difficulty."""
        current_difficulty = self.difficulty_engine.get_current_difficulty()
        
        # Debug print to verify difficulty level
        print(f"Generating question at difficulty level: {current_difficulty}")
        
        prompt = f"""
        You are an AI interviewer creating an **adaptive** technical test.

        **Candidate's Resume:**  
        {resume_text}

        **Current Difficulty Level:** {current_difficulty} (Scale: 1 to 10)

        **Your Task:**  
        - Generate **ONE** multiple-choice question based on the candidate's skills.  
        - Ensure the question EXACTLY matches the current difficulty level of {current_difficulty} (where 1 is easiest, 10 is hardest).
        - Include **4 answer choices** (1 correct, 3 incorrect).  
        - For difficulty level {current_difficulty}/10, adjust complexity accordingly:
            - Lower levels (1-3): Focus on basic concepts and definitions
            - Medium levels (4-6): Test application of concepts and problem-solving
            - Higher levels (7-10): Test advanced understanding, edge cases, and integration of multiple concepts
        - Output only JSON with no explanations.

        **Expected JSON Format:**  
        {{
            "question": "Which of the following best describes encapsulation in OOP?",
            "options": [
                "Hiding data within a class and restricting access",
                "Allowing all variables to be accessed globally",
                "Using a class only for data storage",
                "Executing code in a hidden environment"
            ],
            "answer": "Hiding data within a class and restricting access",
            "difficulty_level": {current_difficulty}
        }}
        """

        try:
            response = self.model.generate_content([{"role": "user", "parts": [{"text": prompt}]}])
            response_text = response.text.strip() if hasattr(response, "text") else None

            if not response_text:
                return None, "No question generated."

            # Clean response & extract JSON
            response_text = re.sub(r"```json|```", "", response_text).strip()
            question_data = json.loads(response_text)

            if "question" in question_data and "options" in question_data and "answer" in question_data:
                # IMPORTANT: Explicitly set the difficulty level to match current difficulty
                question_data["difficulty_level"] = current_difficulty
                print(f"Question generated with difficulty level: {current_difficulty}")
                return question_data, None  # Successfully generated
            else:
                return None, "Unexpected response format."

        except json.JSONDecodeError:
            return None, "AI response is not in valid JSON format."
        except Exception as e:
            return None, f"Error generating question: {str(e)}"

    def update_difficulty(self, user_answer, correct_answer):
        """Adjusts difficulty based on user performance."""
        is_correct = (user_answer == correct_answer)
        
        # Debugging - Print before updating
        print(f"Before update: Difficulty = {self.difficulty_engine.get_current_difficulty()}")
        print(f"Answer correct: {is_correct}")
        
        # Update difficulty based on answer
        self.difficulty_engine.record_response(is_correct)
        
        # Debugging - Print after updating
        print(f"After update: Difficulty = {self.difficulty_engine.get_current_difficulty()}")
        # Remove reference to correct_at_level which no longer exists
        
        # Return feedback about the answer
        return {
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "new_difficulty": self.difficulty_engine.get_current_difficulty()
        }

    def analyze_user_answers(self, user_answers, resume_text):
        """Analyzes user responses to MCQs and provides detailed feedback."""
        
        # Retrieve relevant feedback for comparison
        feedback_data = self.db_manager.retrieve_documents(resume_text)
        feedback_context = feedback_data if feedback_data else "No previous feedback available."

        # Format answers with difficulty level if available
        formatted_answers = []
        for i, (q, a) in enumerate(user_answers.items()):
            difficulty = self.difficulty_engine.response_history[i].get("difficulty_level", "Unknown") if i < len(self.difficulty_engine.response_history) else "Unknown"
            formatted_answers.append(f"Q: {q} (Difficulty: {difficulty}/10)\nA: {a}")
        
        formatted_answers_str = "\n".join(formatted_answers)

        # Get performance metrics
        performance = self.difficulty_engine.get_performance_summary()

        prompt = f"""
        You are an expert technical interviewer and career mentor providing personalized feedback.

        **Candidate's Resume Summary:**  
        {resume_text}

        **Relevant Feedback Reports:**  
        {feedback_context}

        **Candidate's Performance Metrics:**
        - Total Questions: {performance['total_questions']}
        - Correct Answers: {performance['correct_answers']}
        - Incorrect Answers: {performance['incorrect_answers']}
        - Accuracy: {performance['accuracy']}%
        - Highest Difficulty Level Reached: {performance['highest_difficulty']}/10

        **Candidate's Responses:**  
        {formatted_answers_str}

        **Your Task:**  
        Create a highly personalized feedback assessment by:
        
        1. Analyzing how the specific skills mentioned in their resume align with their test performance
        2. Identifying connections between their work experience and areas where they did well or struggled
        3. Noting patterns in their responses related to their technical background
        4. Recommending growth strategies that consider their current role and career trajectory
        5. Suggesting learning resources tailored to their specific tech stack and industry

        **Skill Level Assessment:**
        Based on their performance, categorize each tested technical skill into one of these levels:
        - Beginner (correctly answered questions up to difficulty level 3-4)
        - Intermediate (correctly answered questions up to difficulty level 5-7)
        - Advanced (correctly answered questions at difficulty level 8-10)

        **Expected JSON Output Format:**  
        {{
            "feedback_summary": "Personalized summary addressing them by name if available and mentioning specific points about their background in relation to their test performance",
            "skill_levels": [
                {{"skill": "Programming Language (e.g., Python)", "level": "Intermediate", "evidence": "Details about their performance on relevant questions"}},
                {{"skill": "Another Skill Name", "level": "Beginner/Intermediate/Advanced", "evidence": "Evidence from their test"}}
            ],
            "strengths": [
                "3-5 specific strengths directly tied to their resume skills and test answers",
                "Include specific examples from their test responses"
            ],
            "areas_for_improvement": [
                "3-5 targeted improvement areas based on gaps between their resume skills and test performance",
                "Reference specific questions they struggled with"
            ],
            "suggested_improvements": [
                "5-7 personalized learning recommendations related to their current skills and career goals",
                "Include specific resources (books, courses, practice exercises) relevant to their industry and experience level"
            ]
        }}

        **Guidelines:**  
        - Be specific and reference actual content from their resume
        - For skill_levels, identify 3-5 key technical skills that were tested based on the questions
        - Provide evidence for each skill level assessment based on their actual test performance
        - Avoid generic advice that could apply to anyone
        - Make connections between their professional experience and test performance
        - Provide actionable advice considering their current career stage (entry, mid, senior)
        - Do NOT return explanations outside of the JSON format
        """

        try:
            response = self.model.generate_content([{"role": "user", "parts": [{"text": prompt}]}])

            if not response or not hasattr(response, "text") or not response.text.strip():
                return "No feedback generated. Try again."

            raw_text = response.text.strip()

            # Extract JSON from response
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
            else:
                return "AI response did not contain valid JSON."

            # Parse JSON response
            feedback_dict = json.loads(json_text)

            # Validate JSON structure
            required_keys = {"feedback_summary", "skill_levels", "strengths", "areas_for_improvement", "suggested_improvements"}
            if required_keys.issubset(feedback_dict):
                return feedback_dict
            else:
                return "JSON missing required fields."

        except json.JSONDecodeError:
            return "AI response is not in valid JSON format."
        except Exception as e:
            return f"Error generating feedback: {str(e)}"

class AdaptiveDifficultyEngine:
    def __init__(self, min_level=1, max_level=10, initial_level=3):
        """Initialize the adaptive difficulty engine with specified levels."""
        self.min_level = min_level
        self.max_level = max_level
        self.current_level = initial_level
        self.response_history = []
        
    def record_response(self, is_correct):
        """Record user response and adjust difficulty with strict control."""
        # Store the response at the current difficulty level
        self.response_history.append({
            'was_correct': is_correct,
            'difficulty_level': self.current_level
        })
        
        # Simple but effective difficulty adjustment
        if is_correct:
            # Increase difficulty by 1 if correct
            if self.current_level < self.max_level:
                old_level = self.current_level
                self.current_level += 1
                print(f"CORRECT ANSWER: Increasing difficulty from {old_level} to {self.current_level}")
        else:
            # Decrease difficulty by 1 if incorrect
            if self.current_level > self.min_level:
                old_level = self.current_level
                self.current_level -= 1
                print(f"WRONG ANSWER: Decreasing difficulty from {old_level} to {self.current_level}")
        
        # Always log the current difficulty level for debugging
        print(f"Current difficulty level is now: {self.current_level}")
        
    def get_current_difficulty(self):
        """Return the current difficulty level."""
        return self.current_level
    
    def reset(self):
        """Reset the difficulty engine to initial state."""
        self.current_level = 3
        self.response_history = []
        print(f"Engine reset. Difficulty set to {self.current_level}")
    
    def get_performance_summary(self):
        """Return a summary of user performance."""
        if not self.response_history:
            return {
                "total_questions": 0,
                "correct_answers": 0,
                "incorrect_answers": 0,
                "accuracy": 0,
                "highest_difficulty": self.current_level,
                "current_difficulty": self.current_level
            }
            
        total = len(self.response_history)
        correct = sum(1 for resp in self.response_history if resp['was_correct'])
        incorrect = total - correct
        highest_diff = max([resp['difficulty_level'] for resp in self.response_history], default=self.current_level)
        
        return {
            "total_questions": total,
            "correct_answers": correct,
            "incorrect_answers": incorrect,
            "accuracy": round((correct / total) * 100, 2) if total > 0 else 0,
            "highest_difficulty": highest_diff,
            "current_difficulty": self.current_level
        }