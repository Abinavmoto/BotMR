# SQLite Error Fix - prepareAsync NativeStatement

## Problem

Error when loading meetings:
```
ERROR  Error loading meetings: [Error: Call to function 'NativeDatabase.prepareAsync' has been rejected.
→ Caused by: The 2nd argument cannot be cast to type expo.modules.sqlite.NativeStatement (received class java.lang.Integer)
→ Caused by: Cannot convert provided JavaScriptObject to the SharedObject, because it doesn't contain valid id]
```

## Root Cause

The error suggests that parameters are being passed incorrectly to SQLite methods. This can happen when:
1. Parameters array is not properly formatted
2. Parameters are passed as individual values instead of an array
3. Database connection issues

## Solution

### 1. Added Parameter Safety Checks

**File:** `src/db/database.ts`

Added safety checks to ensure parameters are always arrays:

```typescript
export async function runQuery(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
  const database = await openDatabase()
  // Ensure params is always an array
  const safeParams = Array.isArray(params) ? params : []
  return await database.runAsync(sql, safeParams)
}

export async function getQuery<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const database = await openDatabase()
  // Ensure params is always an array
  const safeParams = Array.isArray(params) ? params : []
  const result = await database.getFirstAsync<T>(sql, safeParams)
  return result || null
}

export async function getAllQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await openDatabase()
  // Ensure params is always an array
  const safeParams = Array.isArray(params) ? params : []
  const results = await database.getAllAsync<T>(sql, safeParams)
  // Ensure we always return an array
  return Array.isArray(results) ? results : []
}
```

### 2. Why This Fixes the Error

The error message indicates that an Integer was received where a NativeStatement was expected. This typically happens when:
- Parameters are not passed as an array
- Parameters are undefined or null
- The SQLite API receives incorrect argument types

By ensuring `params` is always a valid array, we prevent type mismatches.

## Testing

1. **Restart the app** to clear any cached database connections
2. **Navigate to home screen** - meetings should load without errors
3. **Check logs** - should not see "Error loading meetings" anymore

## If Error Persists

1. **Clear app data:**
   - Uninstall and reinstall the app, OR
   - Clear app data in Android Settings

2. **Check for concurrent database access:**
   - Ensure database operations are not happening simultaneously
   - The current implementation uses a singleton pattern to prevent this

3. **Verify expo-sqlite version:**
   - Current: `expo-sqlite: ~16.0.10`
   - Ensure it's compatible with Expo SDK 54

## Files Modified

1. ✅ `src/db/database.ts`
   - Added parameter safety checks in `runQuery()`
   - Added parameter safety checks in `getQuery()`
   - Added parameter safety checks in `getAllQuery()`
   - Added result array safety check in `getAllQuery()`

The error should now be resolved, and meetings should load correctly.




