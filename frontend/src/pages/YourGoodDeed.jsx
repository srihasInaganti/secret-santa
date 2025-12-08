import React, { useEffect, useState } from "react";
import "./GoodDeed.css";

export default function YourGoodDeed({ token, roundId }) {
  const [target, setTarget] = useState("");
  const [deed, setDeed] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch your assigned target
        const targetRes = await fetch(`/rounds/${roundId}/my-target`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const targetData = await targetRes.json();

        // Fetch your assigned deed (mission)
        const deedRes = await fetch(`/rounds/${roundId}/my-mission`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const deedData = await deedRes.json();

        setTarget(targetData.name || targetData.full_name || "Unknown");
        setDeed(deedData.deed?.title || "No deed assigned");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching target or deed:", err);
        setTarget("Unknown");
        setDeed("No deed assigned");
        setLoading(false);
      }
    }

    fetchData();
  }, [token, roundId]);

  if (loading) {
    return <div className="gooddeed-page">Loading your target and deed...</div>;
  }

  return (
    <div className="gooddeed-page">
      <nav className="navbar">
        <span>Your Group</span>
        <span className="active">Your Good Deed</span>
        <span>Profile</span>
      </nav>

      <div className="content-wrapper">
        <div className="target-section">
          <h2 className="section-title">Your Target</h2>
          <h1 className="name">{target}</h1>
        </div>

        <div className="deed-section">
          <h2 className="section-title">Your Good Deed</h2>
          <p className="deed">{deed}</p>
        </div>

        <div className="snowman">⛄</div>

        <button className="complete-btn">
          Task Completed
        </button>
      </div>
    </div>
  );
}
