// import React, { useState } from "react";

// function Login({ toggleForm }) {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             const response = await fetch("http://127.0.0.1:8000/token", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//                 body: new URLSearchParams({
//                     username: email,   // FastAPI OAuth2 expects `username`, even if it's actually email
//                     password: password,
//                 }),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 alert("Login failed: " + errorData.detail);
//                 return;
//             }

//             const data = await response.json();
//             console.log("Login success, token:", data.access_token);

//             // Save token to localStorage after successful login
//             localStorage.setItem("access_token", data.access_token);

//             // Now you can retrieve it if needed
//             const token = localStorage.getItem("access_token");

//             // Redirect or post-login action


//         } catch (error) {
//             console.error("Login error:", error);
//             alert("Something went wrong.");
//         }
//     };


//     return (
//         <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
//             <h2 className="text-2xl font-bold mb-4">Login</h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <input
//                     type="email"
//                     name="email"
//                     placeholder="Email Address"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="w-full p-2 border rounded"
//                 /><br /><br />
//                 <input
//                     type="password"
//                     name="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="w-full p-2 border rounded"
//                 /><br /><br />
//                 <button
//                     type="submit"
//                     className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//                 >
//                     Login
//                 </button>
//             </form><br /><br />
//             <div className="text-sm text-center mt-4">
//                 <span>Don't have an account? </span>&nbsp;
//                 <span
//                     className="text-blue-500 cursor-pointer"
//                     onClick={toggleForm}
//                 >
//                     Signup
//                 </span>
//             </div>

//         </div>
//     );
// }

// export default Login;

// import React, { useState } from "react";
// import { useAuth } from './AuthContext';
// import { useNavigate } from "react-router-dom";


// function Login({ toggleForm }) {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const { login } = useAuth();
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             const response = await fetch("http://127.0.0.1:8000/token", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/x-www-form-urlencoded",
//                 },
//                 body: new URLSearchParams({
//                     username: email,
//                     password: password,
//                 }),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 alert("Login failed: " + errorData.detail);
//                 return;
//             }

//             const data = await response.json();
//             console.log("Login success, token:", data.access_token);

//             login(data.access_token); // ✅ save token using context

//             // Optional redirect after login
//             window.location.href = "/dashboard"; // or another route
//         } catch (error) {
//             console.error("Login error:", error);
//             alert("Something went wrong.");
//         }
//     };


//     return (
//         <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
//             <h2 className="text-2xl font-bold mb-4">Login</h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <input
//                     type="email"
//                     name="email"
//                     placeholder="Email Address"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="w-full p-2 border rounded"
//                 />
//                 <br />
//                 <br />
//                 <input
//                     type="password"
//                     name="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="w-full p-2 border rounded"
//                 />
//                 <br />
//                 <br />
//                 <button
//                     type="submit"
//                     className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//                 >
//                     Login
//                 </button>
//             </form>
//             <br />
//             <br />
//             <div className="text-sm text-center mt-4">
//                 <span>Don't have an account? </span>
//                 <span
//                     className="text-blue-500 cursor-pointer"
//                     onClick={toggleForm}
//                 >
//                     Signup
//                 </span>
//             </div>
//         </div>
//     );
// }

// export default Login;

import React, { useState } from "react";
import { useAuth } from './AuthContext';
import { useNavigate } from "react-router-dom";

function Login({ toggleForm }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://127.0.0.1:8000/token", {
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
                return;
            }

            const data = await response.json();
            login(data.access_token); 
            navigate("/dashboard"); 

        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong.");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <br />
                <br />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <br />
                <br />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Login
                </button>
            </form>
            <br />
            <br />
            <div className="text-sm text-center mt-4">
                <span>Don't have an account? </span>
                <span
                    className="text-blue-500 cursor-pointer"
                    onClick={toggleForm}
                >
                    Signup
                </span>
            </div>
        </div>
    );
}

export default Login;
