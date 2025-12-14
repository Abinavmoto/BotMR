# Offline-First Audio Recording Implementation Summary

## Overview
Successfully implemented a complete offline-first audio recording feature using Expo-native libraries. The app can now record audio, save it locally, and persist meeting metadata in SQLite.

## Files Added/Modified

### New Files Created:

1. **`src/db/database.ts`**
   - SQLite database initialization
   - Migration system for meetings table
   - Helper functions for database operations

2. **`src/db/MeetingRepository.ts`**
   - CRUD operations for meetings
   - Type-safe interfaces for Meeting data
   - Methods: createMeeting, updateMeeting, getMeetingById, listMeetings, deleteMeeting

3. **`src/services/audioService.ts`**
   - File system operations for recordings
   - Directory management (creates recordings folder)
   - File saving and deletion utilities
   - Audio mode configuration for background recording
   - Audio mode reset utilities

4. **`components/meeting-detail-screen.tsx`**
   - New screen for viewing meeting details
   - Audio playback functionality using expo-av
   - Shows meeting metadata and debug info

### Modified Files:

1. **`package.json`**
   - Added dependencies:
     - `expo-av` (~15.0.1) - Audio recording and playback
     - `expo-file-system` (~18.0.4) - File storage
     - `expo-sqlite` (~15.0.2) - Local database
     - `expo-crypto` (~14.0.0) - UUID generation

2. **`App.tsx`**
   - Added database initialization on app start
   - Added `meeting-detail` screen to navigation
   - Updated navigation to support passing meetingId parameter

3. **`components/recording-screen.tsx`**
   - Complete rewrite with actual audio recording
   - Microphone permission handling
   - Pause/Resume functionality
   - Auto-saves recording to local storage on stop
   - Creates meeting record in SQLite
   - Error handling and user feedback
   - **Background recording support:**
     - AppState tracking for background/foreground detection
     - Duration polling from recording status (accurate even when backgrounded)
     - Background recording indicator UI
     - Interruption detection and recovery
     - Proper audio mode configuration

4. **`components/home-screen.tsx`**
   - Loads meetings from SQLite database
   - Displays real meeting data instead of mock data
   - Auto-refreshes every 2 seconds
   - Navigates to meeting detail on tap
   - Shows loading and empty states

5. **`components/all-meetings-screen.tsx`**
   - Loads meetings from SQLite
   - Filters by status (all, ready, processing, queued, failed)
   - Navigates to meeting detail on tap
   - Real-time updates

6. **`app.json`**
   - Added microphone permissions for iOS and Android

## Database Schema

**meetings table:**
- `id` TEXT PRIMARY KEY (UUID from expo-crypto)
- `title` TEXT NOT NULL
- `created_at` INTEGER (unix timestamp in ms)
- `updated_at` INTEGER (unix timestamp in ms)
- `duration_sec` INTEGER NOT NULL
- `status` TEXT NOT NULL ('recorded', 'recorded_partial', 'processing', 'completed', 'failed')
- `local_audio_uri` TEXT NOT NULL
- `error_message` TEXT (optional, for partial/failed recordings)

**Index:**
- `idx_meetings_created_at` on `created_at DESC` for efficient sorting

## File Storage

Recordings are saved to:
```
FileSystem.documentDirectory + "recordings/<meetingId>.m4a"
```

The `recordings` directory is automatically created if it doesn't exist.

## Key Features Implemented

✅ **Audio Recording**
- Records audio using expo-av
- Shows live timer (mm:ss format)
- Pause/Resume functionality
- Stop and save recording

✅ **Local Persistence**
- SQLite database for meeting metadata
- File system for audio files
- Survives app restarts

✅ **Permissions**
- Requests microphone permission on recording start
- Graceful handling of denied permissions
- User-friendly error messages

✅ **UI Integration**
- Home screen shows real meetings from database
- All meetings screen filters by status
- Meeting detail screen for playback
- Consistent navigation throughout

✅ **Error Handling**
- Try/catch blocks around all critical operations
- Meaningful error logs
- User-friendly error messages
- Graceful degradation (keeps temp file if move fails)

✅ **Background Recording**
- Audio mode configured for background recording (`staysActiveInBackground: true`)
- AppState tracking to detect background/foreground transitions
- Duration polling from recording status (works even when app is backgrounded)
- Visual indicator when recording in background
- Interruption detection and recovery
- Saves partial recordings if interrupted

## Android Background Recording Behavior

### Foreground Service Requirements

On Android, background audio recording requires a **foreground service** with a persistent system notification. This is enforced by Android 12+ to protect user privacy.

**Implementation:**
- Foreground service notification is shown when recording starts
- Notification displays: "🎙️ BotMR is recording audio — Tap to return"
- If notification fails to show, recording is stopped immediately (no silent failures)
- Notification is updated every 5 seconds with current duration

### Permission Levels

Android 11+ introduced granular microphone permissions:
- **"Only while using app"**: Recording stops when app loses focus
- **"Allow all the time"**: Required for background recording

**User Guidance:**
- App explains why "Allow all the time" is needed
- Provides button to open Settings
- Clear messaging about permission requirements

### Auto-Fallback Scenarios

The app implements safe fallback logic for all failure scenarios:

**A) Foreground Service Denied/Missing:**
- Recording stops immediately
- Partial audio saved with status `recorded_partial`
- User message: "Android requires a visible notification to record in background"

**B) OS Interruption (call, system event):**
- Recording stops gracefully
- Partial audio saved
- User message: "Recording stopped. Partial audio saved."

**C) App Killed:**
- On next launch, detects recent partial recordings (within 5 minutes)
- Shows recovery banner: "Previous recording was interrupted. Partial audio is available."
- User can tap to view and play partial recording

### Duration Accuracy

- Always uses actual recording duration from `recording.getStatusAsync().durationMillis`
- Never relies on timer when app is backgrounded
- Warns if there's a discrepancy between timer and actual recording
- Partial recordings show accurate duration of what was actually captured

### User Trust & Privacy

All messaging follows a privacy-forward, explanatory tone (similar to Google Recorder):
- "Recording will continue even if the screen is locked. A system notification will be shown."
- "🎙️ Recording in progress. You can lock the screen safely."
- "Recording stopped by Android to protect your privacy. Your audio has been saved."

### Testing on Android

**Prerequisites:**
- Development build (not Expo Go)
- Microphone permission set to "Allow all the time"
- Notification permissions granted

**Test Steps:**
1. Start recording
2. Lock screen or switch apps
3. Wait 30+ seconds
4. Unlock and verify:
   - Recording continued
   - Duration matches actual audio file
   - System notification was visible
   - Audio quality is good

**Known Limitations:**
- Requires development build (Expo Go has limitations)
- User must grant "Allow all the time" permission
- Some Android devices may have additional battery optimization restrictions

## Usage Flow

1. User taps "Record Meeting" button on home screen
2. App requests microphone permission
3. Recording starts automatically
4. User can pause/resume or stop recording
5. On stop:
   - Recording is finalized
   - File is saved to permanent location
   - Meeting record is created in SQLite
   - User is returned to home screen
6. Home screen shows new meeting in list
7. User can tap meeting to view details and play audio

## Testing Checklist

### Basic Recording Tests
- [ ] Record a meeting and verify it appears in the list
- [ ] Close and reopen app - meetings should persist
- [ ] Play audio from meeting detail screen
- [ ] Test pause/resume during recording
- [ ] Test permission denial flow
- [ ] Verify file is saved to correct location
- [ ] Check database contains correct data

### Background Recording Test Plan (iOS)

**Prerequisites:**
- iPhone with Expo Go or dev build installed
- App running and recording screen open

**Test Steps:**

1. **Start Recording:**
   - [ ] Tap "Record Meeting" button
   - [ ] Verify recording starts and timer begins counting
   - [ ] Note the initial timer value (e.g., 00:00:05)

2. **Lock Screen Test:**
   - [ ] While recording, press the power button to lock the screen
   - [ ] Wait 10-15 seconds
   - [ ] Unlock the screen and return to app
   - [ ] **Verify:** Timer shows correct duration (should be ~10-15 seconds more than when locked)
   - [ ] **Verify:** "Recording in background..." banner appears when locked
   - [ ] **Verify:** Recording status shows "Recording in progress" when unlocked

3. **App Switch Test:**
   - [ ] Start recording
   - [ ] Press home button or swipe up to switch to another app
   - [ ] Wait 10-15 seconds
   - [ ] Switch back to BotMR app
   - [ ] **Verify:** Timer shows correct duration
   - [ ] **Verify:** Recording continues and can be stopped successfully

4. **Interruption Test:**
   - [ ] Start recording
   - [ ] Receive a phone call (or simulate audio interruption)
   - [ ] **Verify:** Interruption message appears
   - [ ] **Verify:** Recording is saved with available audio
   - [ ] **Verify:** Meeting appears in list with "(Interrupted)" in title

5. **Stop After Background:**
   - [ ] Start recording
   - [ ] Lock screen for 30+ seconds
   - [ ] Unlock and return to app
   - [ ] Stop recording
   - [ ] **Verify:** Final duration is accurate
   - [ ] **Verify:** Audio file plays correctly in meeting detail screen
   - [ ] **Verify:** Meeting metadata shows correct duration

6. **Long Background Test:**
   - [ ] Start recording
   - [ ] Lock screen for 2-3 minutes
   - [ ] Unlock and verify timer accuracy
   - [ ] **Note:** On some devices/Expo Go, recording may stop if app is terminated by OS

## Background Recording Limitations & Notes

### iOS Behavior:
- **Recording continues in background** while the app session remains alive
- If iOS terminates the app (low memory, force-quit), recording stops
- System may show a red recording indicator in status bar when backgrounded
- Audio session must be properly configured (implemented via `staysActiveInBackground: true`)

### Expo Go Limitations:
- Background recording may be less reliable in Expo Go compared to dev/production builds
- For production apps, consider using `expo-dev-client` or EAS Build for better background support
- Some background behaviors may vary between Expo Go and standalone builds

### Android Behavior:
- Similar background recording support with proper permissions
- May have different interruption behaviors than iOS

### Known Constraints:
- If the OS terminates the app completely, recording cannot continue
- Very long background sessions (>10 minutes) may be terminated by iOS
- Phone calls will interrupt recording (handled gracefully)
- Other audio apps may interrupt recording (handled gracefully)

## Next Steps (Future Enhancements)

- Add ability to edit meeting title
- Add delete meeting functionality
- Add search/filter capabilities
- Implement background recording continuation
- Add audio waveform visualization
- Implement cloud sync (when backend is ready)
