import React, { useState } from "react";
import { useAuth } from './AuthContext';
import { useNavigate } from "react-router-dom";

function AdminLogin({ toggleForm }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/admin_token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert("Login failed: " + errorData.detail);
                setLoading(false);
                return;
            }

            const data = await response.json();
            login(data.access_token);
            navigate("/institute-dashboard");
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
            <h2 className="text-2xl font-bold mb-4">Institute Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <br /><br />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <br /><br />
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 rounded text-white ${loading ? "bg-green-600 disabled:bg-green-600"  : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

            </form>
            <br /><br />
            <div className="text-sm text-center mt-4">
                <span>Don't have an account? </span>
                <span
                    className="text-blue-500 cursor-pointer"
                    onClick={toggleForm}
                >
                    Sign Up
                </span>
            </div>
        </div>
    );
}

export default AdminLogin;
