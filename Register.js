import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import logo from './Logo1.png';

const Register = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      alert('You must accept the terms and conditions to register.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('yearOfBirth', yearOfBirth);
    formData.append('phoneNumber', phoneNumber);
    if (image) {
      formData.append('image', image);
    }

    try {
      await axios.post('http://localhost:3000/api/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('User registered successfully');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error registering user', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-container">
      <img src={logo} alt="Logo" className="logo" />
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="register-email">Email:</label>
          <input
            id="register-email"
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="register-password">Password:</label>
          <input
            id="register-password"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="register-yearOfBirth">Year of Birth:</label>
          <input
            id="register-yearOfBirth"
            type="text"
            name="yearOfBirth"
            placeholder="Year of Birth"
            value={yearOfBirth}
            onChange={(e) => setYearOfBirth(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="register-phoneNumber">Phone Number:</label>
          <input
            id="register-phoneNumber"
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="register-image">Upload Image:</label>
          <input
            id="register-image"
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <small>Upload an image to compare if you want</small>
        </div>
        <div className="terms-container">
          <input
            type="checkbox"
            name="termsAccepted"
            id="termsAccepted"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
           <label htmlFor="termsAccepted">
            I accept the <a href="http://localhost:3000/terms" target="_blank" rel="noopener noreferrer">terms and conditions</a>
           </label>

        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
