/*
  SQLite helper for Expo apps.

  - Provides promise-based wrapper around expo-sqlite transactions
  - Creates an `accounts` table: id, email (unique), password, created_at

  SECURITY NOTE: Storing raw passwords on-device is unsafe. Prefer hashing
  on a server or using secure authentication providers. This module stores
  whichever string you provide as `password`.
*/
// expo-sqlite doesn't ship with separate types in some setups; if your
// project has @types/expo__sqlite you can remove the ts-ignore.
// Note: we intentionally avoid statically importing 'expo-sqlite' here so
// that web builds (and other runtimes) don't force-resolve a native-only
// module. We'll dynamically import it in `nativeInit` when running on a
// native platform.
/*
  Cross-platform DB helper for accounts.

  - On native (Android/iOS) uses expo-sqlite
  - On web uses localStorage fallback

  SECURITY NOTE: Storing raw passwords on-device is unsafe. Prefer hashing
  on a server or using secure authentication providers. This module stores
  whichever string you provide as `password`.
*/
import { Platform } from "react-native";

// Allow dynamic import of expo-sqlite without type errors
declare module 'expo-sqlite';

export type Account = {
  id: number;
  email: string;
  password: string;
  created_at: number; // epoch ms
};

const STORAGE_KEY = "myexpoapp_accounts_v1";

// In-memory fallback store when localStorage isn't available (native devices)
let inMemoryAccounts: Account[] | null = null;

// Web fallback using localStorage
async function webInit(): Promise<void> {
  if (typeof globalThis.localStorage === 'undefined') {
    // Ensure we have an in-memory array available
    if (!inMemoryAccounts) inMemoryAccounts = [];
    return;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

async function webGetAll(): Promise<Account[]> {
  if (typeof globalThis.localStorage === 'undefined') {
    return inMemoryAccounts ?? [];
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Account[];
    return parsed;
  } catch (err) {
    console.error("Failed to parse accounts from localStorage", err);
    return [];
  }
}

async function webSaveAll(accounts: Account[]): Promise<void> {
  if (typeof globalThis.localStorage === 'undefined') {
    inMemoryAccounts = accounts.slice();
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// Native sqlite implementation will be lazily loaded
let sqliteDb: any = null;
let sqliteOpenDatabase: any = null;
let isNativeAvailable = true;

async function nativeInit(): Promise<void> {
  if (!sqliteDb) {
    // Dynamically import expo-sqlite only on native platforms so bundlers
    // (Metro/Webpack) won't try to resolve it for web builds.
    try {
      const sqliteModule = await import('expo-sqlite');
      sqliteOpenDatabase = (sqliteModule as any).openDatabase;
      sqliteDb = sqliteOpenDatabase('app.db');
      console.info('[db] expo-sqlite loaded successfully');
    } catch (err) {
        console.warn('Failed to dynamically import expo-sqlite, falling back to in-memory storage', err);
        // Mark native as unavailable and set up in-memory fallback.
        isNativeAvailable = false;
        sqliteDb = null;
        if (!inMemoryAccounts) inMemoryAccounts = [];
        return;
    }
  }

  return new Promise((resolve, reject) => {
    sqliteDb.transaction((tx: any) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at INTEGER NOT NULL);`,
        [],
        () => resolve(undefined),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    }, (tErr: any) => reject(tErr));
  });
}

async function nativeExecuteSql(sql: string, params: any[] = []): Promise<any> {
  // Defensive: if sqlite is not available, return a safe fake result
  if (!isNativeAvailable || !sqliteDb) {
    return new Promise((resolve) => {
      // Basic heuristics: SELECT -> rows structure, INSERT/DELETE -> rowsAffected
      const sqlUpper = sql.trim().toUpperCase();
      if (sqlUpper.startsWith('SELECT')) {
        resolve({ rows: { length: 0, item: (_: number) => ({}), _array: [] } });
      } else {
        resolve({ rowsAffected: 0 });
      }
    });
  }

  return new Promise((resolve, reject) => {
    try {
      sqliteDb.transaction((tx: any) => {
        tx.executeSql(
          sql,
          params,
          (_tx: any, result: any) => resolve(result),
          (_tx: any, err: any) => {
            reject(err);
            return false;
          }
        );
      }, (tErr: any) => reject(tErr));
    } catch (err) {
      reject(err);
    }
  });
}

export async function initDatabase(): Promise<void> {
  if (Platform.OS === "web") {
    await webInit();
    console.info('[db] initDatabase: using web/localStorage fallback');
  } else {
    await nativeInit();
    console.info('[db] initDatabase: nativeInit completed, isNativeAvailable=', isNativeAvailable);
  }
}

export async function addAccount(email: string, password: string): Promise<number> {
  const createdAt = Date.now();
  if (Platform.OS === "web" || !isNativeAvailable || !sqliteDb) {
    const accounts = await webGetAll();
    const exists = accounts.find((a) => a.email === email);
    if (exists) throw new Error("Account already exists");
    const id = accounts.length > 0 ? accounts[accounts.length - 1].id + 1 : 1;
    const acc: Account = { id, email, password, created_at: createdAt };
    accounts.push(acc);
    await webSaveAll(accounts);
    return id;
  }

  // native
  await nativeExecuteSql(`INSERT INTO accounts (email, password, created_at) VALUES (?, ?, ?);`, [email, password, createdAt]);
  // try to read last insert id
  // Some native implementations return insertId on result
  return 0;
}

export async function getAccountByEmail(email: string): Promise<Account | null> {
  if (Platform.OS === "web") {
    const accounts = await webGetAll();
    const found = accounts.find((a) => a.email === email);
    return found ?? null;
  }

  if (!isNativeAvailable || !sqliteDb) {
    const accounts = await webGetAll();
    const found = accounts.find((a) => a.email === email);
    return found ?? null;
  }

  const res = await nativeExecuteSql(`SELECT * FROM accounts WHERE email = ? LIMIT 1;`, [email]);
  if (res.rows.length > 0) {
    const row = res.rows.item(0);
    return { id: row.id, email: row.email, password: row.password, created_at: row.created_at } as Account;
  }
  return null;
}

export async function getAllAccounts(): Promise<Account[]> {
  if (Platform.OS === "web") {
    return await webGetAll();
  }
  if (!isNativeAvailable || !sqliteDb) {
    return await webGetAll();
  }

  const res = await nativeExecuteSql(`SELECT * FROM accounts ORDER BY created_at DESC;`, []);
  const out: Account[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows.item(i);
    out.push({ id: row.id, email: row.email, password: row.password, created_at: row.created_at });
  }
  return out;
}

export async function deleteAccountByEmail(email: string): Promise<number> {
  if (Platform.OS === "web") {
    const accounts = await webGetAll();
    const filtered = accounts.filter((a) => a.email !== email);
    await webSaveAll(filtered);
    return accounts.length - filtered.length;
  }
  if (!isNativeAvailable || !sqliteDb) {
    const accounts = await webGetAll();
    const filtered = accounts.filter((a) => a.email !== email);
    await webSaveAll(filtered);
    return accounts.length - filtered.length;
  }

  const res = await nativeExecuteSql(`DELETE FROM accounts WHERE email = ?;`, [email]);
  return res.rowsAffected ?? 0;
}

export default {
  initDatabase,
  addAccount,
  getAccountByEmail,
  getAllAccounts,
  deleteAccountByEmail,
};
