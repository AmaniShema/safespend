import { getDatabase, isNative } from './database';

export interface Contributor {
  id: string;
  name: string;
  status: 'active' | 'left';
  createdAt: string;
}

export interface HouseholdContribution {
  id: string;
  contributorId: string;
  amount: number;
  month: string; // format: "2026-07"
  note: string;
  recorded: boolean;
  createdAt: string;
}

const LOCAL_KEY = 'safespend_household';
const CONTRIB_KEY = 'safespend_household_contributions';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocalMembers = (): Contributor[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalMembers = (members: Contributor[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(members));
};

const getLocalContributions = (): HouseholdContribution[] => {
  const raw = localStorage.getItem(CONTRIB_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalContributions = (contributions: HouseholdContribution[]): void => {
  localStorage.setItem(CONTRIB_KEY, JSON.stringify(contributions));
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMonth = (month: string): string => {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const initHouseholdTable = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS household_members (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS household_contributions (
      id TEXT PRIMARY KEY NOT NULL,
      contributorId TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      month TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      recorded INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);
};

export const getAllMembers = async (): Promise<Contributor[]> => {
  if (!isNative()) return getLocalMembers();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM household_members ORDER BY createdAt ASC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      status: row.status as 'active' | 'left',
      createdAt: row.createdAt as string,
    }));
  } catch { return []; }
};

export const getAllContributions = async (): Promise<HouseholdContribution[]> => {
  if (!isNative()) return getLocalContributions();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM household_contributions ORDER BY month DESC, createdAt ASC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      contributorId: row.contributorId as string,
      amount: row.amount as number,
      month: row.month as string,
      note: row.note as string,
      recorded: Boolean(row.recorded),
      createdAt: row.createdAt as string,
    }));
  } catch { return []; }
};

export const addMember = async (name: string): Promise<Contributor> => {
  const member: Contributor = {
    id: generateId(),
    name,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocalMembers([...getLocalMembers(), member]);
    return member;
  }
  const db = getDatabase();
  await db.run(
    'INSERT INTO household_members (id, name, status, createdAt) VALUES (?, ?, ?, ?)',
    [member.id, member.name, member.status, member.createdAt]
  );
  return member;
};

export const toggleMemberStatus = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalMembers(
      getLocalMembers().map((m) =>
        m.id === id ? { ...m, status: m.status === 'active' ? 'left' : 'active' } : m
      )
    );
    return;
  }
  const db = getDatabase();
  const result = await db.query('SELECT status FROM household_members WHERE id = ?', [id]);
  const current = result.values?.[0]?.status as string || 'active';
  await db.run('UPDATE household_members SET status = ? WHERE id = ?',
    [current === 'active' ? 'left' : 'active', id]);
};

export const deleteMember = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalMembers(getLocalMembers().filter((m) => m.id !== id));
    saveLocalContributions(getLocalContributions().filter((c) => c.contributorId !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM household_members WHERE id = ?', [id]);
  await db.run('DELETE FROM household_contributions WHERE contributorId = ?', [id]);
};

export const addContribution = async (
  contributorId: string,
  amount: number,
  month: string,
  note: string
): Promise<HouseholdContribution> => {
  const contribution: HouseholdContribution = {
    id: generateId(),
    contributorId,
    amount,
    month,
    note,
    recorded: false,
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocalContributions([...getLocalContributions(), contribution]);
    return contribution;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO household_contributions (id, contributorId, amount, month, note, recorded, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [contribution.id, contribution.contributorId, contribution.amount,
     contribution.month, contribution.note, contribution.createdAt]
  );
  return contribution;
};

export const updateContribution = async (id: string, amount: number, note: string): Promise<void> => {
  if (!isNative()) {
    saveLocalContributions(
      getLocalContributions().map((c) => c.id === id ? { ...c, amount, note } : c)
    );
    return;
  }
  const db = getDatabase();
  await db.run('UPDATE household_contributions SET amount = ?, note = ? WHERE id = ?', [amount, note, id]);
};

export const setContributionRecorded = async (id: string, recorded: boolean): Promise<void> => {
  if (!isNative()) {
    saveLocalContributions(
      getLocalContributions().map((c) => c.id === id ? { ...c, recorded } : c)
    );
    return;
  }
  const db = getDatabase();
  await db.run('UPDATE household_contributions SET recorded = ? WHERE id = ?', [recorded ? 1 : 0, id]);
};

export const deleteContribution = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocalContributions(getLocalContributions().filter((c) => c.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM household_contributions WHERE id = ?', [id]);
};
