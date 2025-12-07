import React from "react";
import "./GoodDeed.css";

export default function YourGoodDeed() {
  return (
    <div className="gooddeed-page">
      <nav className="navbar">
        <span>Your Group</span>
        <span className="active">Your Good Deed</span>
        <span>Profile</span>
      </nav>

      <div className="card">
        <img
          className="avatar"
          src="https://via.placeholder.com/120"
          alt="avatar"
        />

        <h2 className="title">Your Target:</h2>
        <h1 className="name">Gabby</h1>

        <h2 className="title">Your Good Deed:</h2>
        <h1 className="deed">Write them a letter of encouragement!</h1>

        <div className="snowman">⛄</div>

        <button className="complete-btn">
          Click here when task has been completed
        </button>
      </div>
    </div>
  );
}
