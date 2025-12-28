# State Machine & Background Service Analysis

## Issues Identified

### Issue 1: App Redirects to Settings on Open - Permission Not Requested
**Problem:**
- When app opens, if microphone permission is not granted, the recording screen's `requestPermissions()` is called
- If permission is denied, it shows an alert with "Open Settings" button
- User gets redirected to settings, but permission dialog is not shown first
- The app should request permission first, then only redirect to settings if denied

**Root Cause:**
- `RecordingScreen` calls `requestPermissions()` on mount (line 51)
- If permission check fails or is denied, it immediately shows alert with "Open Settings"
- No initial permission request dialog is shown
- App doesn't check permissions on startup - only when recording screen mounts

**Current Flow:**
```
App Start → Home Screen → User taps Record → Recording Screen mounts → requestPermissions() → 
  If denied → Alert with "Open Settings" → User redirected to Settings
```

**Expected Flow:**
```
App Start → Check permissions → If not granted, request → If denied, show info → 
  User can choose to go to settings OR try recording later
```

---

### Issue 2: Audio Continues Playing When Navigating Back to Home
**Problem:**
- User plays audio in meeting detail screen
- User clicks back button to go to home screen
- Audio continues playing in background
- No way to stop it except closing the app

**Root Cause:**
- `MeetingDetailScreen` cleanup function (line 37-43) only unloads sound if component unmounts
- When navigating away, the cleanup runs, but:
  - The sound object might still be playing
  - `unloadAsync()` is called but not awaited properly
  - No explicit `stopAsync()` before `unloadAsync()`
  - The sound state persists across navigation

**Current Cleanup:**
```typescript
return () => {
  if (sound) {
    sound.unloadAsync().catch((error) => {
      console.warn('Error unloading sound on cleanup:', error)
    })
  }
}
```

**Problem:**
- Doesn't stop playback before unloading
- Not awaited, so cleanup might not complete before navigation
- Sound might continue playing even after component unmounts

---

## State Machine Requirements

### 1. Permission State Machine

```
States:
- UNKNOWN: Initial state, haven't checked yet
- CHECKING: Currently checking permission status
- GRANTED: Permission is granted
- DENIED: Permission is denied (user denied)
- BLOCKED: Permission is permanently denied (user selected "Don't ask again")
- REQUESTING: Currently showing permission dialog

Transitions:
- UNKNOWN → CHECKING (on app start or when needed)
- CHECKING → GRANTED (if already granted)
- CHECKING → DENIED (if denied but can request)
- CHECKING → BLOCKED (if permanently denied)
- DENIED → REQUESTING (user wants to request)
- REQUESTING → GRANTED (user granted)
- REQUESTING → DENIED (user denied)
- DENIED → BLOCKED (user selected "Don't ask again")
```

**Actions:**
- `checkPermission()`: Check current status
- `requestPermission()`: Show permission dialog
- `openSettings()`: Open app settings
- `handlePermissionResult(status)`: Handle permission result

---

### 2. Recording State Machine

```
States:
- IDLE: Not recording
- CHECKING_PERMISSION: Checking if permission is granted
- REQUESTING_PERMISSION: Requesting permission
- PERMISSION_DENIED: Permission denied, can't record
- INITIALIZING: Setting up audio mode and recording
- RECORDING: Currently recording
- PAUSED: Recording is paused
- STOPPING: Stopping recording
- SAVING: Saving recording to database
- ERROR: Error occurred

Transitions:
- IDLE → CHECKING_PERMISSION (user taps record)
- CHECKING_PERMISSION → REQUESTING_PERMISSION (if not granted)
- CHECKING_PERMISSION → INITIALIZING (if granted)
- REQUESTING_PERMISSION → INITIALIZING (if granted)
- REQUESTING_PERMISSION → PERMISSION_DENIED (if denied)
- INITIALIZING → RECORDING (recording started)
- RECORDING → PAUSED (user pauses)
- PAUSED → RECORDING (user resumes)
- RECORDING → STOPPING (user stops)
- STOPPING → SAVING (recording stopped)
- SAVING → IDLE (saved successfully)
- Any state → ERROR (error occurred)
- ERROR → IDLE (after handling)
```

**Actions:**
- `startRecording()`: Start recording flow
- `pauseRecording()`: Pause recording
- `resumeRecording()`: Resume recording
- `stopRecording()`: Stop and save recording
- `handleError(error)`: Handle errors

---

### 3. Playback State Machine

```
States:
- IDLE: No audio loaded
- LOADING: Loading audio file
- READY: Audio loaded, ready to play
- PLAYING: Audio is playing
- PAUSED: Audio is paused
- STOPPING: Stopping playback
- UNLOADING: Unloading audio
- ERROR: Error occurred

Transitions:
- IDLE → LOADING (user wants to play)
- LOADING → READY (audio loaded)
- LOADING → ERROR (failed to load)
- READY → PLAYING (user plays)
- PLAYING → PAUSED (user pauses or app backgrounds)
- PAUSED → PLAYING (user resumes)
- PLAYING → STOPPING (user stops or navigates away)
- STOPPING → UNLOADING (stopped)
- UNLOADING → IDLE (unloaded)
- Any state → ERROR (error occurred)
- ERROR → IDLE (after handling)
```

**Actions:**
- `loadAudio(uri)`: Load audio file
- `play()`: Start playback
- `pause()`: Pause playback
- `stop()`: Stop and unload
- `unload()`: Unload audio
- `handleError(error)`: Handle errors

---

### 4. Navigation State Machine

```
States:
- HOME: Home screen
- RECORDING: Recording screen
- MEETING_DETAIL: Meeting detail screen
- SETTINGS: Settings screen
- ALL_MEETINGS: All meetings screen
- PROCESSING: Processing screen
- SUMMARY: Summary screen
- PAYWALL: Paywall screen

Transitions:
- Any state → Any state (via navigation)
- Special handling:
  - MEETING_DETAIL → HOME: Must stop playback
  - RECORDING → HOME: Must stop recording and cleanup
  - Any → RECORDING: Must check permissions
```

**Actions:**
- `navigate(screen, params?)`: Navigate to screen
- `navigateBack()`: Go back
- `handleNavigation(screen)`: Handle navigation with cleanup

---

## Required Fixes

### Fix 1: Permission Handling on App Start

**Location:** `App.tsx` or `HomeScreen`

**Changes:**
1. Add permission check on app start
2. Store permission state globally or in App component
3. Show permission request dialog if not granted
4. Only redirect to settings if user explicitly wants to change settings
5. Don't auto-redirect to settings on app open

**Implementation:**
```typescript
// In App.tsx
useEffect(() => {
  checkInitialPermissions()
}, [])

const checkInitialPermissions = async () => {
  const { status } = await Audio.getPermissionsAsync()
  if (status !== 'granted') {
    // Don't request immediately - let user start recording
    // Just store the state
    setPermissionStatus(status)
  }
}

// In RecordingScreen - only request when user actually wants to record
const handleRecordButton = async () => {
  if (permissionStatus !== 'granted') {
    const granted = await requestPermissions()
    if (!granted) {
      // Show info, don't auto-redirect
      return
    }
  }
  startRecording()
}
```

---

### Fix 2: Stop Audio Playback on Navigation

**Location:** `components/meeting-detail-screen.tsx`

**Changes:**
1. Stop playback before unloading
2. Await cleanup completion
3. Add explicit stop on navigation
4. Handle cleanup in navigation handler

**Implementation:**
```typescript
// Enhanced cleanup
useEffect(() => {
  return () => {
    cleanupAudio()
  }
}, [meetingId])

const cleanupAudio = async () => {
  if (sound) {
    try {
      // Stop playback first
      const status = await sound.getStatusAsync()
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync()
      }
      // Then unload
      await sound.unloadAsync()
    } catch (error) {
      console.warn('Error cleaning up audio:', error)
    } finally {
      setSound(null)
      setIsPlaying(false)
    }
  }
}

// Also stop on back button
const handleBack = async () => {
  await cleanupAudio()
  onNavigate('home')
}
```

---

### Fix 3: Global Audio State Management

**Location:** Create `src/services/audioPlaybackService.ts`

**Purpose:**
- Centralize audio playback state
- Ensure cleanup on navigation
- Handle background playback properly

**Implementation:**
```typescript
class AudioPlaybackService {
  private sound: Audio.Sound | null = null
  private isPlaying = false
  
  async loadAndPlay(uri: string) {
    await this.stop() // Stop any existing playback
    // Load and play
  }
  
  async stop() {
    if (this.sound) {
      try {
        const status = await this.sound.getStatusAsync()
        if (status.isLoaded && status.isPlaying) {
          await this.sound.stopAsync()
        }
        await this.sound.unloadAsync()
      } catch (error) {
        console.warn('Error stopping audio:', error)
      }
      this.sound = null
      this.isPlaying = false
    }
  }
  
  async pause() {
    // Pause logic
  }
  
  async resume() {
    // Resume logic
  }
}
```

---

## Implementation Plan

### Phase 1: Permission Handling
1. ✅ Add permission state to App.tsx
2. ✅ Check permissions on app start
3. ✅ Don't auto-redirect to settings
4. ✅ Request permission only when user wants to record
5. ✅ Show helpful messages instead of auto-redirecting

### Phase 2: Audio Playback Cleanup
1. ✅ Enhance cleanup in meeting-detail-screen
2. ✅ Stop playback before unloading
3. ✅ Await cleanup completion
4. ✅ Add cleanup on back button
5. ✅ Test navigation scenarios

### Phase 3: State Machine Implementation
1. ✅ Create permission state machine
2. ✅ Create recording state machine
3. ✅ Create playback state machine
4. ✅ Integrate with existing code
5. ✅ Add state transition logging

### Phase 4: Global Audio Service
1. ✅ Create audioPlaybackService
2. ✅ Migrate playback logic
3. ✅ Ensure cleanup on navigation
4. ✅ Test all scenarios

---

## Testing Checklist

### Permission Flow
- [ ] App opens, permission not granted → No auto-redirect
- [ ] User taps record → Permission dialog shown
- [ ] User grants permission → Recording starts
- [ ] User denies permission → Info shown, can try again
- [ ] User goes to settings → Can change permission

### Audio Playback
- [ ] Play audio in meeting detail
- [ ] Navigate back to home → Audio stops
- [ ] Play audio, background app → Audio pauses
- [ ] Play audio, navigate away → Audio stops
- [ ] Play audio, close app → Audio stops

### State Transitions
- [ ] All state transitions logged
- [ ] No invalid state transitions
- [ ] Error states handled properly
- [ ] Cleanup on all exit paths

---

## Files to Modify

1. **App.tsx**
   - Add permission check on startup
   - Store permission state
   - Don't auto-redirect to settings

2. **components/recording-screen.tsx**
   - Only request permission when user wants to record
   - Don't auto-redirect to settings
   - Better permission handling

3. **components/meeting-detail-screen.tsx**
   - Enhanced cleanup with stop before unload
   - Await cleanup completion
   - Stop on back button
   - Handle navigation properly

4. **src/services/audioPlaybackService.ts** (NEW)
   - Centralized audio playback management
   - Proper cleanup
   - State management

5. **src/types/state.ts** (NEW)
   - State machine types
   - State transition types
   - Action types

---

## Next Steps

1. Review this analysis
2. Decide on implementation approach
3. Start with Phase 1 (Permission Handling)
4. Then Phase 2 (Audio Cleanup)
5. Then Phase 3 (State Machines)
6. Finally Phase 4 (Global Service)
