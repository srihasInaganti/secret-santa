import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateGroupPage from './pages/CreateGroupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import YourDeedPage from './pages/YourDeedPage.jsx';
import NavBar from './components/NavBar.jsx';
import './components/NavBar.css';

function AppContent() {
  var navigate = useNavigate();
  var location = useLocation();

  function getActiveTab() {
    if (location.pathname === '/dashboard') return 'group';
    if (location.pathname === '/deed') return 'deed';
    return '';
  }

  function handleTabChange(tab) {
    if (tab === 'group') navigate('/dashboard');
    if (tab === 'deed') navigate('/deed');
    if (tab === 'profile') navigate('/dashboard');
    if (tab === 'join') navigate('/dashboard');
  }

  return (
    <>
      <NavBar activeTab={getActiveTab()} onTabChange={handleTabChange} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateGroupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/deed" element={<YourDeedPage />} />
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