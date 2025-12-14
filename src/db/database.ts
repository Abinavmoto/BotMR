import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db
  }

  db = await SQLite.openDatabaseAsync('botmr.db')
  await runMigrations()
  return db
}

async function runMigrations() {
  if (!db) return

  try {
    // Create meetings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        duration_sec INTEGER NOT NULL,
        status TEXT NOT NULL,
        local_audio_uri TEXT NOT NULL,
        error_message TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);
    `)
    
    // Migration: Add error_message column if it doesn't exist (for existing databases)
    try {
      await db.execAsync(`ALTER TABLE meetings ADD COLUMN error_message TEXT`)
    } catch (error) {
      // Column already exists, ignore
    }
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

export async function runQuery(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
  const database = await openDatabase()
  return await database.runAsync(sql, params)
}

export async function getQuery<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const database = await openDatabase()
  const result = await database.getFirstAsync<T>(sql, params)
  return result || null
}

export async function getAllQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await openDatabase()
  return await database.getAllAsync<T>(sql, params)
}
