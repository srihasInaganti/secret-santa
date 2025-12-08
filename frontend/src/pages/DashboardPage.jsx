import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupTree from '../components/GroupTree';
import {SnowForeground, SnowBackground} from "../components/Snow.jsx";

export default function DashboardPage() {
  var [user, setUser] = useState(null);
  var [group, setGroup] = useState(null);
  var [round, setRound] = useState(null);
  var navigate = useNavigate();

  useEffect(function() {
    // Get data from localStorage
    var storedUser = localStorage.getItem('user');
    var storedGroup = localStorage.getItem('group');
    var storedRound = localStorage.getItem('round');

    if (!storedUser || !storedGroup || !storedRound) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }

    setUser(JSON.parse(storedUser));
    setGroup(JSON.parse(storedGroup));
    setRound(JSON.parse(storedRound));
  }, [navigate]);

  if (!user || !group || !round) {
    return (
      <>
        <SnowForeground />
        <SnowBackground />
        <div style={{ paddingTop: '100px', color: 'white', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SnowForeground />
      <SnowBackground />
      <GroupTree roundId={round._id} groupName={group.name} />
    </>
  );
}