import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import ResumeUploader from "./resumeuploader";
import QueryBox from "./QueryBox";
import AdaptiveTest from "./AdaptiveTest";
import "../app.css";

function MainUser() {
  const [resumeData, setResumeData] = useState("");
  const navigate = useNavigate();

  const handleTakeTest = () => {
    if (resumeData) {
      navigate("/adaptive-test", { state: { resumeData } });
    } else {
      alert("Please upload your resume first!");
    }
  };

  const handleLogout = () => {
    localStorage.clear(); 
    setResumeData(""); 
    navigate("/");
  };

  return (
    <div className="App p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          AI Resume & Feedback Query Assistant
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
         >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <ResumeUploader onResumeData={setResumeData} />
      </div>

      {resumeData && (
        <>
          <div className="mb-6">
            <QueryBox resumeData={resumeData} />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-medium mb-2">
              Ready to test your knowledge?
            </h2>
            <p className="mb-3">
              Take an adaptive assessment based on your resume to identify
              strengths and areas for improvement.
            </p>
            <button
              onClick={handleTakeTest}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Knowledge Test
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AdaptiveTestWrapper() {
  const location = useLocation();
  const resumeData = location.state?.resumeData || "";
  const navigate = useNavigate();

  if (!resumeData) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-600">
            Error: No resume data available. Please upload a resume first.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return <AdaptiveTest resumeText={resumeData} />;
}

function User() {
  return (
    <Routes>
      <Route path="/" element={<MainUser />} />
      <Route path="/adaptive-test" element={<AdaptiveTestWrapper />} />
    </Routes>
  );
}

export default User;
