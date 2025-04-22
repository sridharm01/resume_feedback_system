import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const AdaptiveTest = () => {
  const { resumeText } = useAuth();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [testInProgress, setTestInProgress] = useState(true);
  const [testComplete, setTestComplete] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);

  const MAX_QUESTIONS = 10;

  const fetchQuestion = async () => {
    try {
      setIsLoading(true);
      setSelectedAnswer("");
      setFeedback("");

      const response = await axios.post("http://localhost:8000/adaptive_test/start", {
        resume_text: resumeText,
      });

      setQuestionData(response.data);
    } catch (error) {
      console.error("Failed to fetch question:", error);
      setFeedback("Failed to load question.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) {
      alert("Please select an answer.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/adaptive_test/answer", {
        selected_answer: selectedAnswer,
        current_question: questionData,
      });

      const correctAnswerObj = questionData.options.find(option => option.isCorrect);
      const correctAnswer = correctAnswerObj ? correctAnswerObj.answer : "Unknown";

      if (response.data.correct) {
        setFeedback("Correct!");
      } else {
        setFeedback(`Incorrect. Correct answer: ${correctAnswer}`);
      }

      const newHistoryItem = {
        question: questionData.question,
        options: questionData.options,
        user_answer: selectedAnswer,
        correct_answer: correctAnswer,
        is_correct: response.data.correct,
        difficulty: questionData.difficulty_level
      };

      setQuestionHistory(prev => [...prev, newHistoryItem]);
      setQuestionNumber(prev => prev + 1);

      if (questionNumber >= MAX_QUESTIONS) {
        setTimeout(() => {
          setTestInProgress(false);
          setTestComplete(true);
        }, 1500);
      } else {
        setTimeout(() => {
          fetchQuestion();
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedback("Something went wrong submitting your answer.");
    }
  };

  

  const getDetailedFeedback = async () => {
    try {
      setIsFetchingFeedback(true);
      const response = await axios.post("http://localhost:8000/adaptive_test/results", {
        questions: questionHistory,
        resume_text: resumeText
      });

      setTestResults(response.data.feedback);
    } catch (error) {
      console.error("Error getting feedback:", error);
      alert("Failed to generate detailed feedback.");
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const startNewTest = async () => {
    try {
      await axios.post("http://localhost:8000/adaptive_test/reset");
      setQuestionHistory([]);
      setQuestionData(null);
      setTestComplete(false);
      setTestInProgress(true);
      setQuestionNumber(1);
      setTestResults(null);
      fetchQuestion();
    } catch (error) {
      console.error("Error resetting test:", error);
      alert("Failed to reset test.");
    }
  };

  const returnToHome = () => {
    navigate("/");
  };

  useEffect(() => {
    if (!resumeText) {
      alert("No resume data available. Please upload a resume first.");
      navigate("/");
      return;
    }

    fetchQuestion();

    return () => {
      axios.post("http://localhost:8000/adaptive_test/reset").catch(err =>
        console.error("Failed to reset test on unmount:", err)
      );
    };
  }, []);

  if (isLoading || !questionData) {
    return <div className="text-center p-4">Loading question...</div>;
  }

  if (testInProgress) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white shadow-md rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Question {questionNumber}</h2>
        <p className="text-gray-800">{questionData.question}</p>

        <div className="space-y-2 mb-4">
          {questionData.options.map((option, index) => (
            <label key={index} className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="answer"
                value={option.answer}
                checked={selectedAnswer === option.answer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="mr-2"
              />
              {option.answer}<br />
            </label>
          ))}
        </div>
        <br />
        <button
          onClick={submitAnswer}
          disabled={!selectedAnswer}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Submit Answer
        </button>

        {feedback && (
          <div className={`mt-4 p-3 rounded-lg ${feedback.includes("") ? "bg-green-100" : "bg-red-100"}`}>
            {feedback}
          </div>
        )}
      </div>
    );
  }

  if (testComplete) {
    // Calculate performance metrics
    const totalQuestions = questionHistory.length;
    const correctAnswers = questionHistory.filter(item => item.is_correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const highestDifficulty = Math.max(...questionHistory.map(item => item.difficulty));

    return (
      <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-xl">
        <h2 className="text-2xl font-bold mb-6">Test Results</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-gray-600">Questions Answered</div>
            <div className="text-3xl font-bold text-blue-600">{totalQuestions}</div>
          </div><br />
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-gray-600">Correct Answers</div>
            <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
          </div><br />
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-gray-600">Accuracy</div>
            <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
          </div>
        </div>

        <p className="mb-6">Highest difficulty level reached: <span className="font-bold">{highestDifficulty}/10</span></p>

        <h3 className="text-xl font-bold mb-3">Question Review</h3>
        <div className="mb-6">
          {questionHistory.map((item, index) => (
            <div key={index} className="border-b py-4">
              <details className="cursor-pointer">
                <summary className="font-medium flex justify-between items-center">
                  <span>Question {index + 1} (Difficulty: {item.difficulty}/10)</span>&nbsp;&nbsp;
                  <span className={item.is_correct ? "text-green-600" : "text-red-600"}>
                    {item.is_correct ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </summary>
                <div className="mt-2 pl-4">
                  <p className="mb-2"><strong>Q:</strong> {item.question}</p>
                  <p className="mb-1"><strong>Your answer:</strong> {item.user_answer}</p>
                  <p><strong>Correct answer:</strong> {item.correct_answer}</p>
                </div>
              </details><br />
            </div>
          ))}
        </div>

        {/* {!testResults ? (
          <button
            onClick={getDetailedFeedback}
            disabled={isFetchingFeedback}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 mr-3"
          >
            {isFetchingFeedback ? "Generating..." : "Get Detailed Feedback"}
          </button>
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-3">Personalized Feedback</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p>{testResults.feedback_summary}</p>
            </div>

            <h4 className="font-bold text-lg mb-2">Skill Level Assessment</h4>
            <div className="mb-4">
              {testResults.skill_levels.map((skill, index) => (
                <div key={index} className="mb-3 border-l-4 border-blue-500 pl-3">
                  <p className="font-medium">{skill.skill}: {skill.level}</p>
                  <p className="text-sm text-gray-600">Evidence: {skill.evidence}</p>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-lg mb-2">Strengths</h4>
            <ul className="list-disc pl-5 mb-4">
              {testResults.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>

            <h4 className="font-bold text-lg mb-2">Areas for Improvement</h4>
            <ul className="list-disc pl-5 mb-4">
              {testResults.areas_for_improvement.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>

            <h4 className="font-bold text-lg mb-2">Suggested Learning Path</h4>
            <ul className="list-disc pl-5 mb-4">
              {testResults.suggested_improvements.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )} */}
        {!testResults ? (
          <button
            onClick={getDetailedFeedback}
            disabled={isFetchingFeedback}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 mr-3"
          >
            {isFetchingFeedback ? "Generating..." : "Get Detailed Feedback"}
          </button>
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-3">Personalized Feedback</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {formatResponse(testResults.feedback_summary)}
            </div>

            <h4 className="font-bold text-lg mb-2">Skill Level Assessment</h4>
            <div className="mb-4">
              {testResults.skill_levels.map((skill, index) => (
                <div key={index} className="mb-3 border-l-4 border-blue-500 pl-3">
                  <p className="font-medium">{skill.skill}: {skill.level}</p>
                  {formatResponse(skill.evidence)}
                </div>
              ))}
            </div>

            <h4 className="font-bold text-lg mb-2">Strengths</h4>
            <div className="mb-4">
              {formatResponse(testResults.strengths.join("\n"))}
            </div>

            <h4 className="font-bold text-lg mb-2">Areas for Improvement</h4>
            <div className="mb-4">
              {formatResponse(testResults.areas_for_improvement.join("\n"))}
            </div>

            <h4 className="font-bold text-lg mb-2">Suggested Learning Path</h4>
            <div className="mb-4">
              {formatResponse(testResults.suggested_improvements.join("\n"))}
            </div>
          </div>
        )}


        <br /><br />
        <div className="mt-6 flex">
          <button
            onClick={startNewTest}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-3"
          >
            Start New Test
          </button>&nbsp;&nbsp;&nbsp;&nbsp;
          <button
            onClick={returnToHome}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
};

export default AdaptiveTest;
