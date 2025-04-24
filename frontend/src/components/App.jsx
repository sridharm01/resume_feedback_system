import { Routes, Route, useNavigate } from "react-router-dom";
import "../app.css";
import UserPage from "./UserPage";
import User from "./User";
import AdaptiveTest from "./AdaptiveTest";
import AdminPage from "./AdminPage";
import Admin from "./Admin";

function Buttons() {
  const navigate = useNavigate();

  return (
    <div className="text-center mt-20" style={{marginTop:20, textAlign:'center'}}>
      <h2 className="text-2xl mb-4">Select Usage Type</h2>
      <button
        onClick={() => navigate("/user")}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4" style={{
          padding: "5px 25px",
          fontSize: "15px"
        }}
      >
        User
      </button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <button
        onClick={() => navigate("/instlogin")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" style={{
          padding: "5px 25px",
          fontSize: "15px"
        }}
      >
        Institute
      </button>
    </div>
  );
}

function App() {
  return (
      <Routes>
        <Route path="/" element={<Buttons />}/>
        <Route path="/user" element={ <UserPage/> } />
        <Route path="/instlogin" element={ <AdminPage /> } />
        <Route path="/dashboard" element={ <User/> }/>
        <Route path="/adaptive-test" element={ <AdaptiveTest /> } />
        <Route path="/institute-dashboard" element={<Admin/>}/>
      </Routes>
  );
}

export default App;

