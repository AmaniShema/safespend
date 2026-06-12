import { getDatabase, isNative } from './database';

export interface Contributor {
  id: string;
  name: string;
  amount: number;
  status: 'active' | 'left';
  createdAt: string;
}

const LOCAL_KEY = 'safespend_household';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getLocal = (): Contributor[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLocal = (contributors: Contributor[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(contributors));
};

export const initHouseholdTable = async (): Promise<void> => {
  if (!isNative()) return;
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS household_contributors (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL
    )
  `);
};

export const getAllContributors = async (): Promise<Contributor[]> => {
  if (!isNative()) return getLocal();
  const db = getDatabase();
  try {
    const result = await db.query('SELECT * FROM household_contributors ORDER BY createdAt ASC');
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      amount: row.amount as number,
      status: row.status as 'active' | 'left',
      createdAt: row.createdAt as string,
    }));
  } catch {
    return [];
  }
};

export const addContributor = async (
  data: { name: string; amount: number }
): Promise<Contributor> => {
  const contributor: Contributor = {
    ...data,
    id: generateId(),
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  if (!isNative()) {
    saveLocal([...getLocal(), contributor]);
    return contributor;
  }
  const db = getDatabase();
  await db.run(
    `INSERT INTO household_contributors (id, name, amount, status, createdAt)
     VALUES (?, ?, ?, 'active', ?)`,
    [contributor.id, contributor.name, contributor.amount, contributor.createdAt]
  );
  return contributor;
};

export const updateContributorAmount = async (id: string, amount: number): Promise<void> => {
  if (!isNative()) {
    saveLocal(getLocal().map((c) => (c.id === id ? { ...c, amount } : c)));
    return;
  }
  const db = getDatabase();
  await db.run('UPDATE household_contributors SET amount = ? WHERE id = ?', [amount, id]);
};

export const toggleContributorStatus = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocal(
      getLocal().map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'left' : 'active' } : c
      )
    );
    return;
  }
  const db = getDatabase();
  const result = await db.query('SELECT status FROM household_contributors WHERE id = ?', [id]);
  const current = (result.values?.[0]?.status as string) || 'active';
  const next = current === 'active' ? 'left' : 'active';
  await db.run('UPDATE household_contributors SET status = ? WHERE id = ?', [next, id]);
};

export const deleteContributor = async (id: string): Promise<void> => {
  if (!isNative()) {
    saveLocal(getLocal().filter((c) => c.id !== id));
    return;
  }
  const db = getDatabase();
  await db.run('DELETE FROM household_contributors WHERE id = ?', [id]);
};
