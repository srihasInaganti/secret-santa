// replace with .env value
const API_BASE = "http://localhost:8000"

// ============ Types ============

export interface UserPublic {
  _id: string;
  name: string;
  email: string;
}

export interface Round {
  _id: string;
  name: string;
  owner_user_id: string;
  access_code: string;
  status: 'pending' | 'started' | 'closed';
  created_at: string;
}

export interface AssignedDeed {
  title: string;
  description?: string;
}

export interface GoodDeedPublic {
  _id: string;
  user_id: string;
  round_id: string;
  target_user_id: string;
  title: string;
  description?: string;
  created_at: string;
}

export interface DeedTemplate {
  _id: string;
  title: string;
  description?: string;
  active: boolean;
}

// For GroupTree component - user + completion status
export interface MemberWithStatus extends UserPublic {
  completed: boolean;
  completedAt?: string;
}

// ============ Round Endpoints ============

export async function fetchRound(roundId: string): Promise<Round> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}`);
  if (!response.ok) throw new Error('Failed to fetch round');
  return response.json();
}

export async function fetchRoundMembers(roundId: string): Promise<UserPublic[]> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/members`);
  if (!response.ok) throw new Error('Failed to fetch round members');
  return response.json();
}

export async function fetchRoundDeeds(roundId: string): Promise<GoodDeedPublic[]> {
  const response = await fetch(`${API_BASE}/rounds/${roundId}/deeds`);
  if (!response.ok) throw new Error('Failed to fetch round deeds');
  return response.json();
}

export async function fetchDeedTemplates(): Promise<DeedTemplate[]> {
  const response = await fetch(`${API_BASE}/deed-templates/`);
  if (!response.ok) throw new Error('Failed to fetch deed templates');
  return response.json();
}

// ============ Combined Fetcher for GroupTree ============

export async function fetchMembersWithStatus(roundId: string): Promise<MemberWithStatus[]> {
  const [members, deeds] = await Promise.all([
    fetchRoundMembers(roundId),
    fetchRoundDeeds(roundId),
  ]);

  const deedsByUserId = new Map<string, GoodDeedPublic>();
  deeds.forEach(deed => deedsByUserId.set(deed.user_id, deed));

  return members.map(member => ({
    ...member,
    completed: deedsByUserId.has(member._id),
    completedAt: deedsByUserId.get(member._id)?.created_at,
  }));
}