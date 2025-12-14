# Android Background Recording - Complete Implementation

## ✅ All Requirements Implemented

### 1. Permissions (app.json) ✅
- `RECORD_AUDIO` - Microphone access
- `FOREGROUND_SERVICE` - Required for background services
- `FOREGROUND_SERVICE_MICROPHONE` - Required for background audio recording (Android 14+)
- `WAKE_LOCK` - Keeps device awake during recording

### 2. Audio Mode Configuration ✅
Before recording starts, `Audio.setAudioModeAsync` is called with:
- `allowsRecordingIOS: true`
- `staysActiveInBackground: true` ✅
- `playsInSilentModeIOS: true`
- `shouldDuckAndroid: false` ✅
- `interruptionModeAndroid: DoNotMix` ✅ (using numeric value 1 as fallback)

**Location**: `src/services/audioService.ts` lines 48-71

### 3. Foreground Service Aware Recording ✅

**When recording starts:**
- Foreground service notification is created immediately
- Android shows persistent system notification: "🎙️ BotMR is recording audio — Tap to return"
- If notification fails, recording is stopped immediately (no silent failures)
- Notification ID is tracked in `foregroundServiceNotificationIdRef`

**Validation:**
- Before allowing background recording, checks if notification is active
- If notification missing when going to background, stops recording and saves partial audio

**Location**: 
- `components/recording-screen.tsx` lines 702-720 (notification check on start)
- `components/recording-screen.tsx` lines 196-246 (validation before backgrounding)
- `src/services/notificationService.ts` lines 46-72 (notification creation)

### 4. App State & Interruption Handling ✅

**WHEN APP GOES TO BACKGROUND:**
- Checks if foreground service is active
- If active: Sets `isBackgroundRecording = true`, shows banner
- If NOT active: Stops recording, saves partial audio, sets status `recorded_partial`
- Shows pre-background warning banner: "Recording will continue in background. A system notification is active."

**WHEN APP RETURNS TO FOREGROUND:**
- Refreshes recording status using `recording.getStatusAsync()`
- Recalculates duration from `durationMillis` (actual recording duration)
- Never relies on timers frozen during background
- Cancels background notification

**Location**: `components/recording-screen.tsx` lines 185-366

### 5. Auto-Fallback Logic ✅

**A) Foreground Service Denied/Missing:**
- ✅ Stops recording immediately
- ✅ Saves partial audio with status `recorded_partial`
- ✅ Message: "Android requires a visible notification to record in background."

**B) OS Interruption (call, system event):**
- ✅ Stops recording gracefully via `handleInterruption()`
- ✅ Saves partial file
- ✅ Status: `recorded_partial`
- ✅ Message: "Recording stopped. Partial audio saved."

**C) App Killed:**
- ✅ On next launch, `HomeScreen` detects recent partial recordings (within 5 minutes)
- ✅ Shows recovery banner: "Previous recording was interrupted. Partial audio is available."
- ✅ User can tap to view and play partial recording

**Location**:
- Fallback A: `components/recording-screen.tsx` lines 196-246
- Fallback B: `components/recording-screen.tsx` lines 368-463
- Fallback C: `components/home-screen.tsx` lines 20-37, 165-183

### 6. User Trust UX Copy ✅

**Before recording:**
- ✅ "Recording will continue even if the screen is locked. A system notification will be shown."

**While recording (in-app banner):**
- ✅ "🎙️ Recording in progress. You can lock the screen safely."

**Android system notification:**
- ✅ "🎙️ BotMR is recording audio — Tap to return"

**On forced stop:**
- ✅ "Recording stopped by Android to protect your privacy. Your audio has been saved."

**Tone**: Calm, explanatory, privacy-forward (Google Recorder style)

**Location**:
- Notice card: `components/recording-screen.tsx` lines 981-998
- Background banner: `components/recording-screen.tsx` lines 971-979
- Notification: `src/services/notificationService.ts` lines 57-61
- Alerts: `components/recording-screen.tsx` lines 223-227, 368-463

### 7. Data Model Update ✅

**Database Schema:**
- ✅ Added `error_message` column (TEXT, optional)
- ✅ Updated `status` to include `recorded_partial`
- ✅ Migration handles existing databases

**Meeting Interface:**
- ✅ `status: 'recorded' | 'recorded_partial' | 'processing' | 'completed' | 'failed'`
- ✅ `error_message?: string`

**Repository:**
- ✅ `createMeeting()` accepts `error_message`
- ✅ `updateMeeting()` accepts `error_message`
- ✅ Partial recordings are saved with `recorded_partial` status

**Location**:
- Database: `src/db/database.ts` lines 20-37
- Repository: `src/db/MeetingRepository.ts` lines 4-111

### 8. Documentation Update ✅

**IMPLEMENTATION_SUMMARY.md:**
- ✅ Added "Android Background Recording Behavior" section
- ✅ Documents foreground service requirements
- ✅ Explains permission levels
- ✅ Lists all auto-fallback scenarios
- ✅ Includes testing instructions

**Location**: `IMPLEMENTATION_SUMMARY.md` lines 130-244

## Key Implementation Details

### Foreground Service Notification
- **Channel**: "recording" with HIGH importance
- **Content**: "🎙️ BotMR is recording audio — Tap to return — [duration]"
- **Updates**: Every 5 seconds when backgrounded
- **Validation**: Checked before allowing background recording

### Duration Accuracy
- Always uses `recording.getStatusAsync().durationMillis` (actual recording duration)
- Never relies on timer when backgrounded
- Warns if discrepancy > 2 seconds
- Partial recordings show accurate duration of what was captured

### No Silent Failures
- If notification fails → recording stops immediately
- If foreground service missing → recording stops and saves partial
- All failures show user-friendly messages
- All partial recordings are playable and visible

### Recovery System
- Detects partial recordings within 5 minutes of app launch
- Shows recovery banner on home screen
- User can tap to view and play partial audio
- Clear messaging about what happened

## Testing Checklist

### Android Background Recording
- [ ] Start recording
- [ ] Verify foreground service notification appears
- [ ] Lock screen
- [ ] Wait 30+ seconds
- [ ] Unlock and verify:
  - [ ] Recording continued
  - [ ] Duration matches actual audio file
  - [ ] Audio quality is good
  - [ ] Notification was visible

### Foreground Service Validation
- [ ] Deny notification permission
- [ ] Try to start recording
- [ ] Verify recording stops with clear message

### Partial Recording Recovery
- [ ] Start recording
- [ ] Force stop app (swipe away)
- [ ] Relaunch app
- [ ] Verify recovery banner appears
- [ ] Tap banner and verify partial audio plays

### Permission Levels
- [ ] Set permission to "Only while using app"
- [ ] Start recording and lock screen
- [ ] Verify recording stops (expected behavior)
- [ ] Change to "Allow all the time"
- [ ] Verify background recording works

## Files Modified

1. **app.json**: Added Android permissions
2. **src/db/database.ts**: Added `error_message` column
3. **src/db/MeetingRepository.ts**: Added `recorded_partial` status and `error_message` field
4. **src/services/audioService.ts**: Added Android-specific audio mode settings
5. **src/services/notificationService.ts**: Enhanced for foreground service (HIGH importance, proper content)
6. **components/recording-screen.tsx**: 
   - Foreground service validation
   - Auto-fallback logic
   - UX copy throughout
   - Pre-background warning
7. **components/home-screen.tsx**: Recovery banner for partial recordings
8. **IMPLEMENTATION_SUMMARY.md**: Android background recording documentation

## Status: ✅ COMPLETE

All 8 tasks have been implemented:
- ✅ Permissions configured
- ✅ Audio mode with Android settings
- ✅ Foreground service validation
- ✅ App state handling with service awareness
- ✅ Auto-fallback for all scenarios
- ✅ User-friendly UX copy
- ✅ Data model supports partial recordings
- ✅ Documentation updated

The implementation follows Android 12+ foreground service rules and ensures no silent failures.
