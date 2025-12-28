# Directory Permissions Fix

## Problem
`Location '/data/user/0/com.botmr.app/files/recordings/' isn't writable.`

The directory creation is failing because we're using the wrong path format.

## Root Cause
We were removing the `file://` prefix from `FileSystem.documentDirectory`, but `FileSystem.makeDirectoryAsync` expects the full URI format that includes the `file://` prefix.

## Fix Applied

### 1. ✅ Use Document Directory As-Is

**File:** `src/services/audioService.ts`

Changed from:
```typescript
// Remove file:// prefix
const getDocumentDirectory = () => {
  const docDir = FileSystem.documentDirectory || ''
  return docDir.replace(/^file:\/\//, '')
}
const RECORDINGS_DIR = getDocumentDirectory() + 'recordings/'
```

To:
```typescript
// Use documentDirectory as-is - FileSystem operations handle the file:// prefix automatically
const RECORDINGS_DIR = (FileSystem.documentDirectory || '') + 'recordings/'
```

### 2. ✅ Enhanced Directory Creation

**File:** `src/services/audioService.ts`

Added better error handling and verification:

```typescript
export async function ensureRecordingsDirectory(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true })
      
      // Verify it was created
      const verifyInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR)
      if (!verifyInfo.exists) {
        throw new Error(`Failed to create recordings directory: ${RECORDINGS_DIR}`)
      }
    }
  } catch (error) {
    console.error('Error ensuring recordings directory:', error)
    throw error
  }
}
```

### 3. ✅ Return Path As-Is

**File:** `src/services/audioService.ts`

Removed the manual `file://` prefix addition - `FileSystem.documentDirectory` already includes it:

```typescript
// Return path as-is - FileSystem.documentDirectory already includes file:// prefix
return permanentPath
```

## Expected Behavior

### Directory Creation:
- ✅ Uses full URI format from `FileSystem.documentDirectory`
- ✅ Creates directory with proper permissions
- ✅ Verifies directory was created successfully

### Path Format:
- ✅ `FileSystem.documentDirectory` = `file:///data/user/0/com.botmr.app/files/`
- ✅ `RECORDINGS_DIR` = `file:///data/user/0/com.botmr.app/files/recordings/`
- ✅ File paths = `file:///data/user/0/com.botmr.app/files/recordings/{meetingId}.m4a`

## Files Modified

1. ✅ `src/services/audioService.ts`
   - Use `FileSystem.documentDirectory` as-is
   - Enhanced directory creation with verification
   - Return paths as-is (already have file:// prefix)

## Testing

The directory should now be created successfully, and files should be saved correctly.

**Fix complete!** 🎉
