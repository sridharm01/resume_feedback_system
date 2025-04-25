import React, { useState, useEffect } from "react";
import axios from "axios";

const MCQSection = ({ resumeData }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.post("http://127.0.0.1:8000/generate_questions/", resumeData);
        setQuestions(res.data.questions);
      } catch (err) {
        console.error("Error generating questions", err);
      }
    };

    if (resumeData) fetchQuestions();
  }, [resumeData]);

  const handleChange = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const submitAnswers = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/evaluate_answer/", {
        answers,
        resume_data: resumeData
      });
      setScore(res.data.score);
    } catch (err) {
      console.error("Error evaluating", err);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">MCQ Section</h3>

      {questions.map((question) => (
        <div key={question.id} className="mb-6">
          <p className="mb-2 font-medium">{question.text}</p>
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const answer = option.answer;
              const selected = answers[question.id]?.skill === answer.skill;

              return (
                <label
                  key={index}
                  className="block p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={answer.skill}
                    checked={selected}
                    onChange={() => handleChange(question.id, answer)}
                    className="mr-2"
                  />
                  {answer.skill} ({answer.level})
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={submitAnswers}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit Answers
      </button>

      {score !== null && (
        <p className="mt-4 text-green-700 font-semibold">Your Score: {score}</p>
      )}
    </div>
  );
};

export default MCQSection;
