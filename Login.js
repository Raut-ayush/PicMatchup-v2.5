// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import logo from './Logo1.png';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Invalid credentials', error);
      alert('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="logo" />
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">Email:</label>
          <input
            id="login-email"
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="login-password">Password:</label>
          <input
            id="login-password"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
