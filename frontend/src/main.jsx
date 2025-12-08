import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateGroupPage from './pages/CreateGroupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NavBar from './components/NavBar.jsx';
import './components/NavBar.css';

function AppContent() {
  var navigate = useNavigate();
  var location = useLocation();

  function getActiveTab() {
    if (location.pathname === '/dashboard') return 'group';
    return '';
  }

  function handleTabChange(tab) {
    if (tab === 'group') navigate('/dashboard');
    if (tab === 'deed') navigate('/dashboard');
    if (tab === 'profile') navigate('/dashboard');
    if (tab === 'join') navigate('/');
  }

  return (
    <>
      <NavBar activeTab={getActiveTab()} onTabChange={handleTabChange} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateGroupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </StrictMode>,
);