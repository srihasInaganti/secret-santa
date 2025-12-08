import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';

function NavBar(props: { activeTab: string; onTabChange: Function }) {
  var navigate = useNavigate();

  function getUser() {
    var storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  }

  var user = getUser();
  var isLoggedIn = user !== null;

  function handleProfileClick() {
    props.onTabChange('profile');
  }

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        {isLoggedIn ? (
          <>
            <button
              className={props.activeTab === 'group' ? 'nav-btn active' : 'nav-btn'}
              onClick={function() { props.onTabChange('group'); }}
            >
              Your Group
            </button>
            <button
              className={props.activeTab === 'deed' ? 'nav-btn active' : 'nav-btn'}
              onClick={function() { props.onTabChange('deed'); }}
            >
              Your Good Deed
            </button>
          </>
        ) : (
          <>
            <button
              className="nav-btn join-btn"
              onClick={function() { props.onTabChange('join'); }}
            >
              Join Group
            </button>
            <button
              className="nav-btn"
              onClick={function() { props.onTabChange('create'); }}
            >
              Create Group
            </button>
          </>
        )}
      </div>

      {isLoggedIn && user && (
        <div className="nav-right">
          <button
            className={props.activeTab === 'profile' ? 'user-badge active' : 'user-badge'}
            onClick={handleProfileClick}
          >
            <span className="user-icon">👤</span>
            <span className="user-name">{user.name}</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default NavBar;