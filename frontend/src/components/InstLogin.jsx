import React, { useState } from 'react';
import InstituteSignup from './InstSignup';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";

function InstLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    console.log('Logging in with', { email, password });
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="login-container" style={styles.container}>
      <h2>Institute Login</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button}>Login</button>
        <br></br><br/>
        <h1>Create an account <button><Route path="/instsignup" element={<InstituteSignup />} />
        </button></h1>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: '300px',
    margin: 'auto',
    paddingTop: '100px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '10px',
  },
  input: {
    padding: '8px',
    width: '100%',
    marginTop: '5px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  button: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
  }
};

export default InstLogin;
