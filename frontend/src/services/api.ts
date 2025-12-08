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
  status: 'active' | 'completed' | 'celebrating';
}

export interface MemberStatus {
  _id: string;
  name: string;
  completed: boolean;
  deed_description?: string;
}

export interface DeedAssignment {
  _id: string;
  round_id: string;
  user_id: string;
  target_user_id?: string;
  target_user_name?: string;
  deed_description: string;
  completed: boolean;
  completed_at?: string;
}

export interface DeedTemplate {
  _id: string;
  description: string;
}

export interface RoundCompletion {
  round_id: string;
  total_members: number;
  completed_count: number;
  all_complete: boolean;
  show_celebration: boolean;
  round_completed: boolean;
  new_round_id: string | null;
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

export async function createGroup(name: string): Promise<Group> {
  const response = await fetch(`${API_BASE}/groups/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create group');
  return response.json();
}

export async function joinGroup(groupId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/groups/${groupId}/join?user_id=${userId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to join group');
}

export async function getCurrentRound(groupId: string): Promise<Round> {
  const response = await fetch(`${API_BASE}/groups/${groupId}/current-round`);
  if (!response.ok) throw new Error('No active round');
  return response.json();
}

export async function createRound(groupId: string, name: string): Promise<Round> {
  const response = await fetch(`${API_BASE}/groups/${groupId}/rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create round');
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

export async function checkRoundComplete(roundId: string, userId?: string): Promise<RoundCompletion> {
  let url = `${API_BASE}/rounds/${roundId}/check-complete`;
  if (userId) {
    url += `?user_id=${userId}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to check completion');
  return response.json();
}

export async function markCelebrationSeen(roundId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/celebration-seen?user_id=${userId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to mark celebration seen');
}

export async function advanceToNextRound(roundId: string): Promise<Round> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/advance`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to advance round');
  return response.json();
}

// ============ Deeds ============

export async function getMyDeed(roundId: string, userId: string): Promise<DeedAssignment> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/my-deed?user_id=${userId}`);
  if (!response.ok) throw new Error('No deed assigned');
  return response.json();
}

export async function completeDeed(roundId: string, userId: string): Promise<DeedAssignment> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/complete?user_id=${userId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to complete deed');
  return response.json();
}

export async function getAllDeeds(roundId: string): Promise<DeedAssignment[]> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/deeds`);
  if (!response.ok) throw new Error('Failed to fetch deeds');
  return response.json();
}

// ============ Deed Templates ============

export async function getDeedTemplates(): Promise<DeedTemplate[]> {
  const response = await fetch(`${API_BASE}/deeds/templates`);
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export async function getRandomDeed(): Promise<DeedTemplate> {
  const response = await fetch(`${API_BASE}/deeds/random`);
  if (!response.ok) throw new Error('Failed to get random deed');
  return response.json();
}

export async function createDeedTemplate(description: string): Promise<DeedTemplate> {
  const response = await fetch(`${API_BASE}/deeds/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error('Failed to create template');
  return response.json();
}

export async function seedDeedTemplates(): Promise<void> {
  const response = await fetch(`${API_BASE}/deeds/seed`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to seed templates');
}