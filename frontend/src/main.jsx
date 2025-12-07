import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HomePage from './pages/HomePage.jsx'
import CreateGroup from './pages/CreateGroup.jsx'

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  if (currentPage === 'home') {
    return (
      <div>
        <HomePage />
        <button 
          onClick={() => setCurrentPage('create-group')}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '15px 30px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Create Group
        </button>
      </div>
    );
  }

  if (currentPage === 'create-group') {
    return (
      <div>
        <CreateGroup />
        <button 
          onClick={() => setCurrentPage('home')}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            padding: '10px 20px',
            backgroundColor: '#gray',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)