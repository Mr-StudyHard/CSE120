SQLite DB utility

This folder contains a small TypeScript helper `db.ts` which wraps Expo's
SQLite API and provides helper functions to initialize a local database and
manage an `accounts` table (email, password, created_at).

Setup

1. Install the native SQLite package for Expo:

   - If you use Expo managed workflow (SDK 44+):
     npx expo install expo-sqlite

2. Rebuild or restart the Expo app to ensure native modules are available.

Usage

Example (React component):

```ts
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import db from '../utils/db';

export default function TestDb() {
  useEffect(() => {
    async function run() {
      await db.initDatabase();
      const id = await db.addAccount('me@example.com', 's3cret');
      const acct = await db.getAccountByEmail('me@example.com');
      console.log('created id', id, acct);
    }
    run();
  }, []);

  return (
    <View>
      <Text>DB Test - check console</Text>
    </View>
  );
}
```

Security note

Do not store plaintext passwords in production. Use secure authentication
backends, federation, or at minimum store hashed credentials and device
protected secure storage.
