import React from 'react';
import './NavBar.css';

function NavBar(props: { activeTab: string; onTabChange: Function }) {
  return (
    <nav className="nav-bar">
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
      <button
        className="nav-btn join-btn"
        onClick={function() { props.onTabChange('join'); }}
      >
        Join Group
      </button>
      <button
        className={props.activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
        onClick={function() { props.onTabChange('profile'); }}
      >
        Profile
      </button>
    </nav>
  );
}

export default NavBar;