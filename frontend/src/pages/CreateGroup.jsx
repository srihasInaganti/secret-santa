import React, { useState } from 'react';

export default function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState(['', '', '']); // Start with 3 empty users

  const handleComplete = () => {
    const filledUsers = users.filter(user => user.trim() !== '');
    
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    
    if (filledUsers.length < 3) {
      alert('Please add at least 3 users');
      return;
    }
    
    alert(`Group "${groupName}" created with ${filledUsers.length} users: ${filledUsers.join(', ')}`);
  };

  const addUser = () => {
    if (users.length < 10) {
      setUsers([...users, '']);
    }
  };

  const removeUser = (index) => {
    if (users.length > 3) {
      const newUsers = users.filter((_, i) => i !== index);
      setUsers(newUsers);
    }
  };

  const updateUser = (index, value) => {
    const newUsers = [...users];
    newUsers[index] = value;
    setUsers(newUsers);
  };

  const styles = {
    container: {
      backgroundColor: '#991b1b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    },
    content: {
      width: '100%',
      maxWidth: '1000px',
      display: 'flex',
      gap: '2rem'
    },
    leftPanel: {
      width: '280px',
      backgroundColor: '#22c55e',
      borderRadius: '8px',
      boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      maxHeight: '600px',
      display: 'flex',
      flexDirection: 'column'
    },
    panelHeader: {
      backgroundColor: '#15803d',
      color: 'white',
      padding: '1rem',
      fontSize: '1.5rem',
      fontWeight: 'bold'
    },
    userList: {
      padding: '1rem',
      color: 'white',
      overflowY: 'auto',
      flex: 1
    },
    userItem: {
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    userInput: {
      flex: 1,
      padding: '0.5rem',
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '1rem',
      color: '#333'
    },
    removeButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 'bold'
    },
    addButton: {
      margin: '0 1rem 1rem 1rem',
      padding: '0.5rem',
      backgroundColor: '#15803d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold'
    },
    userCount: {
      padding: '0.5rem 1rem',
      backgroundColor: '#15803d',
      color: 'white',
      fontSize: '0.875rem',
      textAlign: 'center'
    },
    rightPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: 'black',
      marginBottom: '3rem'
    },
    formContainer: {
      width: '100%',
      maxWidth: '450px'
    },
    label: {
      display: 'block',
      color: 'white',
      fontSize: '1.25rem',
      marginBottom: '1rem'
    },
    input: {
      width: '100%',
      padding: '0.5rem 1rem',
      backgroundColor: 'transparent',
      borderBottom: '2px solid white',
      border: 'none',
      borderBottom: '2px solid white',
      color: 'white',
      fontSize: '1.125rem',
      outline: 'none'
    },
    button: {
      marginTop: '4rem',
      padding: '0.75rem 2rem',
      backgroundColor: 'black',
      color: 'white',
      borderRadius: '9999px',
      fontSize: '1.125rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Left Panel - Add Users */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <h2>Add Users</h2>
          </div>
          <div style={styles.userCount}>
            {users.filter(u => u.trim()).length} / {users.length} users (min: 3, max: 10)
          </div>
          <div style={styles.userList}>
            {users.map((user, index) => (
              <div key={index} style={styles.userItem}>
                <input
                  type="text"
                  value={user}
                  onChange={(e) => updateUser(index, e.target.value)}
                  placeholder={`User ${index + 1}`}
                  style={styles.userInput}
                />
                {users.length > 3 && (
                  <button
                    onClick={() => removeUser(index)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {users.length < 10 && (
            <button onClick={addUser} style={styles.addButton}>
              + Add User
            </button>
          )}
        </div>

        {/* Right Panel - Group Name */}
        <div style={styles.rightPanel}>
          <h1 style={styles.title}>Create Group</h1>
          
          <div style={styles.formContainer}>
            <label style={styles.label}>
              Enter Group Name:
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={styles.input}
              placeholder="Group name..."
            />
          </div>

          <button
            onClick={handleComplete}
            style={styles.button}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1f2937'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'black'}
          >
            Complete group
          </button>
        </div>
      </div>
    </div>
  );
}