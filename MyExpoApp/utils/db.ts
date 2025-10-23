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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as SQLite from 'expo-sqlite';
/*
  Cross-platform DB helper for accounts.

  - On native (Android/iOS) uses expo-sqlite
  - On web uses localStorage fallback

  SECURITY NOTE: Storing raw passwords on-device is unsafe. Prefer hashing
  on a server or using secure authentication providers. This module stores
  whichever string you provide as `password`.
*/
import { Platform } from "react-native";

export type Account = {
  id: number;
  email: string;
  password: string;
  created_at: number; // epoch ms
};

const STORAGE_KEY = "myexpoapp_accounts_v1";

// Web fallback using localStorage
async function webInit(): Promise<void> {
  if (!globalThis.localStorage) return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

async function webGetAll(): Promise<Account[]> {
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// Native sqlite implementation will be lazily loaded
let sqliteDb: any = null;
let sqliteOpenDatabase: any = null;

async function nativeInit(): Promise<void> {
  if (!sqliteDb) {
    // Use a runtime require via eval to avoid bundlers (Metro/Webpack)
    // statically resolving native-only modules like 'expo-sqlite' when
    // building for web.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const r = eval("require");
    const SQLite = r("expo-sqlite");
    sqliteOpenDatabase = SQLite.openDatabase;
    sqliteDb = sqliteOpenDatabase("app.db");
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
  return new Promise((resolve, reject) => {
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
  });
}

export async function initDatabase(): Promise<void> {
  if (Platform.OS === "web") {
    await webInit();
  } else {
    await nativeInit();
  }
}

export async function addAccount(email: string, password: string): Promise<number> {
  const createdAt = Date.now();
  if (Platform.OS === "web") {
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
