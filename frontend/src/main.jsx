import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateGroupPage from './pages/CreateGroupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import YourDeedPage from './pages/YourDeedPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import VerificationBox from './pages/VerificationBox.jsx'; // <-- 1. NEW IMPORT
import NavBar from './components/NavBar';
import './components/NavBar.css';

function AppContent() {
  var navigate = useNavigate();
  var location = useLocation();

  function getActiveTab() {
    if (location.pathname === '/dashboard') return 'group';
    if (location.pathname === '/deed') return 'deed';
    if (location.pathname === '/profile') return 'profile';
    if (location.pathname === '/login') return 'join';
    if (location.pathname === '/create') return 'create';
    return '';
  }

  function handleTabChange(tab) {
    if (tab === 'group') navigate('/dashboard');
    if (tab === 'deed') navigate('/deed');
    if (tab === 'profile') navigate('/profile');
    if (tab === 'join') navigate('/login');
    if (tab === 'create') navigate('/create');
  }

  var showNavBar = location.pathname !== '/';

  return (
    <>
      {showNavBar && <NavBar activeTab={getActiveTab()} onTabChange={handleTabChange} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create" element={<CreateGroupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/deed" element={<YourDeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify-inbox" element={<VerificationBox />} /> {/* <-- 2. NEW ROUTE */}
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