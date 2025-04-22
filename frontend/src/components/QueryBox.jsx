import React, { useState } from "react";

const QueryBox = ({ resumeData }) => {
  const [userQuery, setUserQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async () => {
    if (!userQuery.trim()) {
      setError("Please enter a query.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/ask-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_query: userQuery,
          resume_text: resumeData,
        }),
      });

      if (!res.ok) {
        throw new Error("Backend error occurred");
      }

      const data = await res.json();
      if (data.response) {
        setResponse(data.response);
      } else {
        setResponse("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setError("Request failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const formatBulletPoints = (text) => {
    let cleaned = text.replace(/\*\*(.+?)\*\*:/g, (_, match) => `${match}:`);
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "$1");
    cleaned = cleaned.replace(/\*(.+?)\*/g, "$1");
    return cleaned;
  };

  const formatResponse = (responseText) => {
    const sections = responseText.split("\n").filter(line => line.trim() !== "");

    const formatted = sections.map((line, index) => {
      const trimmed = line.trim();

      if (/^\*\*.*\*\*:/.test(trimmed)) {
        const cleaned = formatBulletPoints(trimmed);
        return (
          <h4 key={index} style={{ marginBottom: "8px", fontWeight: "bold" }}>
            {cleaned.replace(/\*\*|\*/g, "")}
          </h4>
        );
      }

      if (trimmed.startsWith("•") || trimmed.startsWith("*") || /^[-*]\s/.test(trimmed)) {
        const cleaned = formatBulletPoints(trimmed.replace(/^[-*•]\s*/, ""));
        return (
          <li key={index} style={{ marginBottom: "8px" }}>
            {cleaned}
          </li>
        );
      }

      const cleaned = formatBulletPoints(trimmed);
      return (
        <p key={index} style={{ marginBottom: "12px" }}>
          {cleaned}
        </p>
      );
    });

    const bulletItems = formatted.filter(item => item.type === 'li');
    const nonBulletItems = formatted.filter(item => item.type === 'p' || item.type === 'h4');

    return (
      <div style={{ marginTop: "20px" }}>
        <h4>AI Response:</h4>
        {nonBulletItems}
        {bulletItems.length > 0 && <ul>{bulletItems}</ul>}
      </div>
    );
  };

  if (!resumeData) return null;

  return (
    <div>
      <h3>Ask a Query</h3>
      <input
        type="text"
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        placeholder="Enter your question"
        style={{ width: "25%", padding: "8px" }}
      />
      <br />
      <br />
      <button onClick={handleQuery} disabled={loading} style={{ marginLeft: "10px" }}>
        {loading ? "Fetching..." : "Get Response"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "20px" }}>
          <strong>{error}</strong>
        </div>
      )}

      {response && formatResponse(response)}
    </div>
  );
};

export default QueryBox;
