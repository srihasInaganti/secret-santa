const API_BASE = 'http://localhost:8000';

// ============ Types ============

export interface User {
  _id: string;
  name: string;
}

export interface Group {
  _id: string;
  name: string;
}

export interface Round {
  _id: string;
  group_id: string;
  name: string;
  status: 'active' | 'completed';
}

export interface MemberStatus {
  _id: string;
  name: string;
  completed: boolean;
}

// ============ Users ============

export async function login(name: string): Promise<User> {
  const response = await fetch(`${API_BASE}/users/login/${name}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
}

export async function createUser(name: string): Promise<User> {
  const response = await fetch(`${API_BASE}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const response = await fetch(`${API_BASE}/users/${userId}/groups`);
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
}

// ============ Groups ============

export async function getGroup(groupId: string): Promise<Group> {
  const response = await fetch(`${API_BASE}/groups/${groupId}`);
  if (!response.ok) throw new Error('Failed to fetch group');
  return response.json();
}

export async function getCurrentRound(groupId: string): Promise<Round> {
  const response = await fetch(`${API_BASE}/groups/${groupId}/current-round`);
  if (!response.ok) throw new Error('No active round');
  return response.json();
}

// ============ Rounds ============

export async function getRound(roundId: string): Promise<Round> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}`);
  if (!response.ok) throw new Error('Failed to fetch round');
  return response.json();
}

export async function getRoundStatus(roundId: string): Promise<MemberStatus[]> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/status`);
  if (!response.ok) throw new Error('Failed to fetch status');
  return response.json();
}

export async function completeDeed(roundId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/complete?user_id=${userId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to complete deed');
}