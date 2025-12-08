import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupTree from '../components/GroupTree';

export default function DashboardPage() {
  var [user, setUser] = useState(null);
  var [group, setGroup] = useState(null);
  var [round, setRound] = useState(null);
  var navigate = useNavigate();

  useEffect(function() {
    var storedUser = localStorage.getItem('user');
    var storedGroup = localStorage.getItem('group');
    var storedRound = localStorage.getItem('round');

    if (!storedUser) {
      navigate('/login');
      return;
    }

    if (!storedGroup || !storedRound) {
      // Logged in but no group - go to profile
      navigate('/profile');
      return;
    }

    setUser(JSON.parse(storedUser));
    setGroup(JSON.parse(storedGroup));
    setRound(JSON.parse(storedRound));
  }, [navigate]);

  if (!user || !group || !round) {
    return (
      <div style={{ paddingTop: '100px', color: 'white', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <GroupTree roundId={round._id} groupName={group.name} />
  );
}