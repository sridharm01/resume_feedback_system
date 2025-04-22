import { Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./app.css";
import Login from "./components/Login";
import UserPage from "./components/UserPage";
import User from "./components/User";
import AdaptiveTest from "./components/AdaptiveTest";

function Buttons() {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-20">
      <h2 className="text-2xl mb-4">Select Login Type</h2>
      <button
        onClick={() => navigate("/user")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
      >
        User
      </button>

      <br /><br/>
      <button
        onClick={() => navigate("/instlogin")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Institute
      </button>
    </div>
  );
}

function App() {
  return (
      <Routes>
        <Route path="/" element={<Buttons />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/instlogin" element={<Login type="institute" />} />
        <Route path="/dashboard" element={<User/>}/>
        <Route path="/adaptive-test" element={<AdaptiveTest />} />
      </Routes>
  );
}

export default App;

