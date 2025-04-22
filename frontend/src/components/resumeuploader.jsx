import React, { useState } from "react";
import { useAuth } from "./AuthContext";

const ResumeUploader = ({ onResumeData }) => {
  const [uploadStatus, setUploadStatus] = useState("");
  const { uploadResume } = useAuth();
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
    setUploadStatus("Uploading...");
  
    try {
      const response = await fetch("http://localhost:8000/upload_resume", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem("resume_text", data.resume_text);
        onResumeData(data.resume_text);  // Pass to parent
        setUploadStatus("Upload successful!");
        await uploadResume(data.resume_text);

      } else {
        console.error("Upload failed:", data.detail);
        setUploadStatus("Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("Upload error. Is the backend running?");
    }
  };
  

  return (
    <div>
      <h3>Upload Your Resume (PDF only)</h3>
      <input type="file" accept="application/pdf" onChange={handleUpload} />
      <p>{uploadStatus}</p>
    </div>
  );
};

export default ResumeUploader;
