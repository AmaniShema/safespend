import { getDatabase, isNative } from './database';

const LOCAL_KEY = 'safespend_settings';

const getLocalSettings = (): Record<string, string> => {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveLocalSettings = (settings: Record<string, string>): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
};

export const getSetting = async (key: string): Promise<string | null> => {
  if (!isNative()) {
    return getLocalSettings()[key] ?? null;
  }
  const db = getDatabase();
  const result = await db.query(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result.values?.[0]?.value ?? null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  if (!isNative()) {
    const settings = getLocalSettings();
    settings[key] = value;
    saveLocalSettings(settings);
    return;
  }
  const db = getDatabase();
  await db.run(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
};
