# File Path Format Fix

## Problem
`FileDataSourceException` errors when trying to load audio files. The file paths might be in the wrong format.

## Root Cause
1. **Path format inconsistency**: `FileSystem.documentDirectory` might already have `file://` prefix
2. **Double prefix**: Adding `file://` again creates invalid paths like `file://file:///...`
3. **Path normalization**: Paths need to be normalized before saving and loading

## Fixes Applied

### 1. ✅ Normalize Document Directory Path

**File:** `src/services/audioService.ts`

Remove `file://` prefix when constructing paths:

```typescript
const getDocumentDirectory = () => {
  const docDir = FileSystem.documentDirectory || ''
  // Remove file:// prefix if present (we'll add it back when needed)
  return docDir.replace(/^file:\/\//, '')
}

const RECORDINGS_DIR = getDocumentDirectory() + 'recordings/'
```

### 2. ✅ Add file:// Prefix When Returning Path

**File:** `src/services/audioService.ts`

Ensure returned path has `file://` prefix for Android:

```typescript
// CRITICAL: Return path with file:// prefix for Android compatibility
let finalPath = permanentPath
if (!finalPath.startsWith('file://')) {
  finalPath = `file://${finalPath}`
}
return finalPath
```

### 3. ✅ Better URI Normalization in Load

**File:** `components/meeting-detail-screen.tsx`

Normalize URI properly before loading:

```typescript
// Remove any duplicate file:// prefixes
while (normalizedUri.startsWith('file://')) {
  normalizedUri = normalizedUri.substring(7)
}

// Ensure we have a proper file:// URI
if (!normalizedUri.startsWith('file://') && !normalizedUri.startsWith('http://') && !normalizedUri.startsWith('https://')) {
  normalizedUri = `file://${normalizedUri}`
}
```

### 4. ✅ Try Both Original and Normalized URI

**File:** `components/meeting-detail-screen.tsx`

Check both the original URI from database and normalized URI:

```typescript
// Try both the original URI and normalized URI
let fileInfo = null
let finalUri = normalizedUri

try {
  fileInfo = await FileSystem.getInfoAsync(meeting.local_audio_uri)
  if (fileInfo.exists) {
    finalUri = meeting.local_audio_uri
  }
} catch (e) {
  // Try normalized URI
  const checkUri = normalizedUri.startsWith('file://') ? normalizedUri.substring(7) : normalizedUri
  fileInfo = await FileSystem.getInfoAsync(checkUri)
  if (fileInfo.exists) {
    finalUri = normalizedUri
  }
}
```

### 5. ✅ Enhanced Logging

Added comprehensive logging:
- Document directory format
- Recordings directory path
- File paths during save
- URI normalization during load
- File existence checks

## Expected Behavior

### Path Format:
- **During save**: Path is normalized (no double `file://`)
- **In database**: Path stored with `file://` prefix
- **During load**: Path is normalized and verified

### File Loading:
1. ✅ Try original URI from database
2. ✅ Try normalized URI (remove/add `file://` as needed)
3. ✅ Verify file exists before loading
4. ✅ Use correct URI format for Audio.Sound.createAsync

## Files Modified

1. ✅ `src/services/audioService.ts`
   - Normalize document directory path
   - Add `file://` prefix when returning path
   - Enhanced logging

2. ✅ `components/meeting-detail-screen.tsx`
   - Better URI normalization
   - Try both original and normalized URI
   - Enhanced logging

## Testing

The logs will now show:
- Document directory format
- Recordings directory path
- File paths during save/load
- URI normalization steps
- File existence verification

This should fix the `FileDataSourceException` errors! 🎉
