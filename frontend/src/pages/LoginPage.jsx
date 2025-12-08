import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getUserGroups, getCurrentRound } from '../services/api';
import {SnowForeground, SnowBackground} from "../components/Snow.jsx";

export default function LoginPage() {
  var [name, setName] = useState('');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);
  var navigate = useNavigate();

  // Check if already logged in
  useEffect(function() {
    var storedUser = localStorage.getItem('user');
    var storedGroup = localStorage.getItem('group');
    var storedRound = localStorage.getItem('round');

    if (storedUser && storedGroup && storedRound) {
      // Already logged in, go to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  async function handleLogin() {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      var user = await login(name.trim());

      localStorage.setItem('user', JSON.stringify(user));


      navigate('/profile');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }

  return (
    <>
      <SnowForeground />
      <SnowBackground />
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        gap: '20px'
      }}>
        <h1 style={{
          fontFamily: "'Mountains of Christmas', cursive",
          fontSize: '42px',
          marginBottom: '20px'
        }}>
          Check out your Groups!
        </h1>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={function(e) { setName(e.target.value); }}
          onKeyPress={handleKeyPress}
          style={{
            padding: '15px 20px',
            fontSize: '18px',
            borderRadius: '8px',
            border: '2px solid #34D399',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            width: '300px',
            fontFamily: "'Quicksand', sans-serif",
            outline: 'none'
          }}
        />

        {error && (
          <p style={{ color: '#F87171', margin: '0' }}>{error}</p>
        )}

        <button
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </div>
    </>
  );
}