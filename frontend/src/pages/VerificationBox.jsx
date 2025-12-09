// VerificationInbox.jsx (NEW FILE)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDeeds, verifyDeed } from '../services/api';
import { SnowForeground, SnowBackground } from "../components/Snow.jsx";

export default function VerificationInbox() {
    const [user, setUser] = useState(null);
    const [round, setRound] = useState(null);
    const [pendingDeeds, setPendingDeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const storedUser = localStorage.getItem('user');
        const storedRound = localStorage.getItem('round');

        if (!storedUser || !storedRound) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(storedUser);
        const roundData = JSON.parse(storedRound);

        setUser(userData);
        setRound(roundData);

        try {
            // Fetch deeds where the current user is the receiver AND status is pending
            const deeds = await getAllDeeds(roundData._id, userData._id);
            setPendingDeeds(deeds);
        } catch (err) {
            setError('Failed to fetch deeds for verification.');
        } finally {
            setLoading(false);
        }
    }

    async function handleVerification(deedId, action) {
        if (!user || !round) return;

        try {
            // We need to pass the deed ID, the verifier ID (current user), and the action (approve/reject)
            await verifyDeed(deedId, user._id, action); 
            
            // Remove the verified deed from the list
            setPendingDeeds(prev => prev.filter(d => d._id !== deedId));
            alert(`${action === 'approve' ? 'Approved' : 'Rejected'} deed successfully!`);
        } catch (err) {
            alert(`Failed to ${action} deed. Check console for details.`);
            console.error(err);
        }
    }

    if (loading) {
        return (
            <div style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>
                ❄️ Checking your Verification Inbox...
            </div>
        );
    }

    return (
        <>
            <SnowForeground />
            <SnowBackground />
            <div style={{
                width: '100vw',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'white',
                padding: '100px 20px 40px 20px',
            }}>
                <h1 style={{
                    fontFamily: "'Mountains of Christmas', cursive",
                    fontSize: '40px',
                    marginBottom: '30px'
                }}>
                    📥 Verification Inbox 📥
                </h1>

                {error && <p style={{color: '#EF4444'}}>{error}</p>}
                
                {pendingDeeds.length === 0 ? (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        padding: '40px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        maxWidth: '500px'
                    }}>
                        <p style={{fontSize: '20px'}}>
                            ✅ You have no pending deeds to verify. Enjoy the season!
                        </p>
                    </div>
                ) : (
                    <div style={{ width: '100%', maxWidth: '700px' }}>
                        <p style={{marginBottom: '20px', fontSize: '18px', textAlign: 'center'}}>
                            You have **{pendingDeeds.length}** deed{pendingDeeds.length > 1 ? 's' : ''} awaiting your approval.
                        </p>
                        {pendingDeeds.map(deed => (
                            <div key={deed._id} style={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                padding: '25px',
                                margin: '15px 0',
                                borderRadius: '15px',
                                borderLeft: '5px solid #FFD700',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>
                                    Deed Submission
                                </h3>
                                <p style={{ color: '#D4D4D4', marginBottom: '15px' }}>
                                    **Task:** "{deed.deed_description}"
                                </p>
                                
                                {deed.proof && (
                                    <blockquote style={{
                                        borderLeft: '4px solid #34D399',
                                        paddingLeft: '15px',
                                        margin: '10px 0',
                                        fontStyle: 'italic',
                                        fontSize: '14px',
                                        color: '#E0E0E0'
                                    }}>
                                        **Giver's Proof:** {deed.proof}
                                    </blockquote>
                                )}

                                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                    <button 
                                        onClick={() => handleVerification(deed._id, 'approve')}
                                        style={{ 
                                            padding: '10px 20px', 
                                            background: '#34D399', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '25px', 
                                            cursor: 'pointer',
                                            fontWeight: '700'
                                        }}
                                    >
                                        👍 Approve
                                    </button>
                                    <button 
                                        onClick={() => handleVerification(deed._id, 'reject')}
                                        style={{ 
                                            padding: '10px 20px', 
                                            background: '#EF4444', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '25px', 
                                            cursor: 'pointer',
                                            fontWeight: '700'
                                        }}
                                    >
                                        👎 Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        marginTop: '40px',
                        padding: '12px 30px',
                        background: 'transparent',
                        border: '2px solid #D4D4D4',
                        color: '#D4D4D4',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>
        </>
    );
}