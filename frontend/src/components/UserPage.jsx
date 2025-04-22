import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import "../toggleswitch.css";

function UserPage() {
  const [isSignup, setIsSignup] = useState(true);  

  const toggleForm = () => {
    setIsSignup((prev) => !prev);  
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-lg flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="toggle-switch">
            <input
              type="checkbox"
              className="checkbox"
              id="login-signup-toggle"
              checked={isSignup}
              onChange={toggleForm}  
            />
            <label className="label" htmlFor="login-signup-toggle">
              <span className="inner" />
              <span className="switch" />
            </label>
          </div>
        </div>

        <div className="w-full">

          {isSignup ? (
            <Signup toggleForm={toggleForm} />
          ) : (
            <Login toggleForm={toggleForm} />
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPage;
