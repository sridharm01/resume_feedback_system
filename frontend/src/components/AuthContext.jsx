import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [resumeText, setResumeText] = useState("");

    // Load token and resumeText from localStorage on initial load
    useEffect(() => {
        const storedToken = localStorage.getItem("access_token");
        if (storedToken) {
            setToken(storedToken);
        }

        const storedResume = localStorage.getItem("resume_text");
        if (storedResume) {
            setResumeText(storedResume);
        }
    }, []);

    // Save resumeText to localStorage whenever it changes
    useEffect(() => {
        if (resumeText) {
            localStorage.setItem("resume_text", resumeText);
        }
    }, [resumeText]);

    // Optional: centralized resume upload logic
    const uploadResume = async (resume_text) => {
        setResumeText(resume_text);
    };

    // Login function to set token
    const login = (newToken) => {
        localStorage.setItem("access_token", newToken);
        setToken(newToken);
    };

    // Logout function to clear token and resumeText
    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("resume_text");
        setToken(null);
        setResumeText("");
    };

    return (
        <AuthContext.Provider value={{ 
            token, 
            login, 
            logout, 
            resumeText, 
            setResumeText,
            uploadResume
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
