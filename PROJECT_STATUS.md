# BotMR Mobile App - Project Status & Context

## 📋 Project Overview

**BotMR** is a React Native mobile application built with Expo SDK 54 for recording, managing, and processing meeting audio. The app was converted from a Next.js web application and focuses on offline-first functionality with robust background recording capabilities.

### Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Audio**: expo-av (with migration path to expo-audio)
- **Notifications**: @notifee/react-native (Android), expo-notifications (iOS)
- **File System**: expo-file-system
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Navigation**: Custom state-based navigation (can be upgraded to React Navigation)

---

## ✅ COMPLETED FEATURES

### 1. Core Recording Functionality ✅

#### Audio Recording
- ✅ **High-quality audio recording** using expo-av
- ✅ **Live timer display** (HH:MM:SS format)
- ✅ **Pause/Resume functionality** during recording
- ✅ **Stop and save** recording to permanent storage
- ✅ **Auto-start recording** when screen loads (after permissions granted)
- ✅ **Retry logic** for recording creation (up to 3 attempts)
- ✅ **Audio mode configuration** for background recording

#### Permissions
- ✅ **Microphone permission handling** (iOS & Android)
- ✅ **Android granular permissions** ("Allow all the time" for background)
- ✅ **Permission denial handling** with user-friendly messages
- ✅ **Settings deep linking** to guide users to enable permissions

#### File Management
- ✅ **Local file storage** in `FileSystem.documentDirectory + "recordings/"`
- ✅ **Automatic directory creation**
- ✅ **Permanent file paths** using meeting UUIDs
- ✅ **File cleanup** on meeting deletion

### 2. Background Recording ✅

#### Android Background Recording
- ✅ **Foreground service** using @notifee/react-native
- ✅ **Persistent notification** with duration updates
- ✅ **Foreground service handler** registered in index.js (app entry point)
- ✅ **Notification channel** with HIGH importance
- ✅ **Permission requests** (notification permissions for Android 13+)
- ✅ **Auto-fallback logic** when foreground service fails
- ✅ **Lock screen recording** support
- ✅ **App backgrounding** support (home button, app switching)

#### iOS Background Recording
- ✅ **UIBackgroundModes: ["audio"]** configured
- ✅ **Audio session configuration** for background
- ✅ **Background recording** when screen locked
- ✅ **App switching** support

#### Background Recording Features
- ✅ **AppState tracking** for background/foreground detection
- ✅ **Duration polling** from recording status (accurate in background)
- ✅ **Visual indicators** when recording in background
- ✅ **Interruption detection** and recovery
- ✅ **Partial recording save** on interruption
- ✅ **Recovery banner** for recent partial recordings (within 5 minutes)

### 3. Database & Data Persistence ✅

#### SQLite Database
- ✅ **Database initialization** on app start
- ✅ **Meetings table** with full schema:
  - `id` (UUID), `title`, `created_at`, `updated_at`
  - `duration_sec`, `status`, `local_audio_uri`, `error_message`
- ✅ **Database migrations** (error_message column)
- ✅ **Index on created_at** for efficient sorting
- ✅ **Type-safe repository** (MeetingRepository)
- ✅ **CRUD operations** (create, read, update, delete)

#### Meeting Status Management
- ✅ **Status types**: `recorded`, `recorded_partial`, `processing`, `completed`, `failed`
- ✅ **Error message tracking** for partial/failed recordings
- ✅ **Status updates** throughout meeting lifecycle

### 4. User Interface ✅

#### Screens Implemented
- ✅ **Home Screen** (`home-screen.tsx`)
  - Meeting list with real-time updates (2-second refresh)
  - Meeting cards with duration, date, status
  - Recovery banner for partial recordings
  - Navigation to recording and meeting detail screens
  - Empty state handling

- ✅ **Recording Screen** (`recording-screen.tsx`)
  - Live timer display
  - Pause/Resume/Stop controls
  - Background recording indicator
  - Permission handling UI
  - Interruption messages

- ✅ **Meeting Detail Screen** (`meeting-detail-screen.tsx`)
  - Meeting metadata display
  - Audio playback with play/pause
  - Progress bar with time display
  - Debug info (ID, audio URI)
  - Background playback handling

- ✅ **All Meetings Screen** (`all-meetings-screen.tsx`)
  - Tab-based filtering (all, ready, processing, queued, failed)
  - Meeting list with status badges
  - Navigation to meeting details

- ✅ **Processing Screen** (`processing-screen.tsx`)
  - UI implemented (mock data)
  - Progress animation
  - Step indicators
  - Title editing

- ✅ **Summary Screen** (`summary-screen.tsx`)
  - UI implemented (mock data)
  - Summary text display/editing
  - Regenerate options UI
  - Download options UI

- ✅ **Settings Screen** (`settings-screen.tsx`)
  - UI implemented
  - Settings options

- ✅ **Paywall Screen** (`paywall-screen.tsx`)
  - UI implemented

#### UI Components
- ✅ **Custom UI components** in `components/ui/`:
  - Button, Card, Checkbox, Input, Progress, Switch, Tabs, Textarea
- ✅ **Consistent styling** using StyleSheet
- ✅ **Theme colors** in `constants/Colors.ts`
- ✅ **Icons** using @expo/vector-icons (Ionicons)

### 5. Error Handling & Edge Cases ✅

#### Audio Playback Edge Cases
- ✅ **Background app detection** before playback
- ✅ **App state checking** (active/inactive/background)
- ✅ **Error suppression** for expected errors (AudioFocusNotAcquiredException)
- ✅ **Retry logic** for inactive state transitions
- ✅ **Auto-pause** when app backgrounds during playback

#### Recording Edge Cases
- ✅ **Interruption handling** (calls, system events)
- ✅ **Partial recording save** on interruption
- ✅ **Foreground service failure** handling
- ✅ **Permission denial** graceful handling
- ✅ **Database error** handling with parameter safety

#### Cleanup & Resource Management
- ✅ **Complete cleanup** after meeting save
- ✅ **State clearing** before navigation
- ✅ **Interval cleanup** (status polling, interruption checks)
- ✅ **Audio mode reset** after recording
- ✅ **Foreground service stop** on recording end

### 6. Notifications ✅

#### Android Notifications
- ✅ **Foreground service notification** (persistent, non-dismissible)
- ✅ **Notification channel** with HIGH importance
- ✅ **Duration updates** every 5 seconds
- ✅ **Notification permissions** handling (Android 13+)
- ✅ **Completion notification** when recording stops

#### iOS Notifications
- ✅ **Notification permissions** handling
- ✅ **Background notification** support
- ✅ **Completion notification** when recording stops

### 7. Build & Configuration ✅

#### Expo Configuration
- ✅ **app.json** fully configured
- ✅ **iOS permissions** (microphone, notifications, background modes)
- ✅ **Android permissions** (RECORD_AUDIO, FOREGROUND_SERVICE, etc.)
- ✅ **Custom config plugin** for Android foreground service
- ✅ **EAS Build configuration** (eas.json)

#### Development Setup
- ✅ **expo-dev-client** for development builds
- ✅ **Local prebuild** support
- ✅ **Build documentation** (Android & iOS)
- ✅ **Troubleshooting guides**

---

## 🚧 PENDING / TODO FEATURES

### 1. Backend Integration ❌

#### API Integration
- ❌ **Cloud sync** - Upload recordings to backend
- ❌ **Transcription API** - Send audio for processing
- ❌ **Summary generation** - Fetch AI-generated summaries
- ❌ **User authentication** - Login/signup
- ❌ **Meeting metadata sync** - Sync with backend database

#### Processing Pipeline
- ❌ **Real processing screen** - Connect to actual transcription API
- ❌ **Status updates** - Poll backend for processing status
- ❌ **Queue management** - Handle offline queue when online
- ❌ **Error handling** - Network errors, API failures

### 2. Meeting Management ❌

#### CRUD Operations
- ❌ **Edit meeting title** - Currently only displays
- ❌ **Delete meeting** - Repository method exists but UI not connected
- ❌ **Bulk operations** - Delete multiple meetings
- ❌ **Meeting search** - Search by title, date, etc.
- ❌ **Meeting filters** - Advanced filtering options

#### Meeting Details
- ❌ **Transcript display** - Show transcription text
- ❌ **Summary display** - Show AI-generated summary
- ❌ **Action items extraction** - Display extracted action items
- ❌ **Participants list** - If available from transcription
- ❌ **Tags/Categories** - Organize meetings

### 3. Audio Features ❌

#### Playback Enhancements
- ❌ **Seek functionality** - Jump to specific time
- ❌ **Playback speed** - 0.5x, 1x, 1.5x, 2x
- ❌ **Waveform visualization** - Visual audio representation
- ❌ **Bookmarks** - Mark important moments
- ❌ **Playback history** - Resume from last position

#### Audio Processing
- ❌ **Noise reduction** - Audio enhancement
- ❌ **Volume normalization** - Consistent audio levels
- ❌ **Audio format options** - Choose quality/format

### 4. Processing & AI Features ❌

#### Transcription
- ❌ **Real-time transcription** - Live transcription during recording
- ❌ **Transcription accuracy** - Confidence scores
- ❌ **Speaker diarization** - Identify different speakers
- ❌ **Language detection** - Auto-detect language

#### Summary & Analysis
- ❌ **AI summary generation** - Generate meeting summaries
- ❌ **Action items extraction** - Extract tasks and action items
- ❌ **Key points extraction** - Identify important points
- ❌ **Sentiment analysis** - Analyze meeting tone
- ❌ **Topic extraction** - Identify main topics

### 5. UI/UX Enhancements ❌

#### Navigation
- ❌ **React Navigation** - Replace custom navigation
- ❌ **Deep linking** - Handle app links
- ❌ **Navigation history** - Back button support
- ❌ **Tab navigation** - Bottom tab bar

#### User Experience
- ❌ **Pull to refresh** - Refresh meeting list
- ❌ **Infinite scroll** - Load more meetings
- ❌ **Skeleton loaders** - Better loading states
- ❌ **Error boundaries** - Catch and display errors gracefully
- ❌ **Offline indicator** - Show connection status

#### Accessibility
- ❌ **Screen reader support** - VoiceOver/TalkBack
- ❌ **Accessibility labels** - Proper labels for UI elements
- ❌ **Keyboard navigation** - Support for external keyboards
- ❌ **High contrast mode** - Support for accessibility settings

### 6. Settings & Preferences ❌

#### App Settings
- ❌ **Audio quality settings** - Choose recording quality
- ❌ **Storage management** - View/clear storage usage
- ❌ **Auto-delete old recordings** - Configure retention policy
- ❌ **Theme selection** - Light/dark mode toggle
- ❌ **Language selection** - Multi-language support

#### Notification Settings
- ❌ **Notification preferences** - Customize notification behavior
- ❌ **Quiet hours** - Disable notifications during specific times

### 7. Sharing & Export ❌

#### Export Features
- ❌ **Export audio** - Share audio files
- ❌ **Export transcript** - Share text transcript
- ❌ **Export summary** - Share meeting summary
- ❌ **PDF export** - Generate PDF reports
- ❌ **Multiple format support** - Various export formats

#### Sharing
- ❌ **Share meeting** - Share meeting link/summary
- ❌ **Social sharing** - Share to social media
- ❌ **Email integration** - Email meeting summaries

### 8. Analytics & Monitoring ❌

#### Analytics
- ❌ **Usage analytics** - Track app usage
- ❌ **Error tracking** - Monitor errors (Sentry, etc.)
- ❌ **Performance monitoring** - Track app performance
- ❌ **User feedback** - In-app feedback mechanism

### 9. Testing ❌

#### Test Coverage
- ❌ **Unit tests** - Test utilities and services
- ❌ **Integration tests** - Test database operations
- ❌ **E2E tests** - Test complete user flows
- ❌ **Audio recording tests** - Test recording functionality
- ❌ **Background recording tests** - Automated background tests

### 10. Documentation ❌

#### Code Documentation
- ❌ **JSDoc comments** - Document all functions
- ❌ **Component documentation** - Document UI components
- ❌ **API documentation** - Document service APIs
- ❌ **Architecture diagrams** - Visual architecture docs

---

## 🏗️ Technical Architecture

### Project Structure
```
v0-bot-mr-mobile-app/
├── App.tsx                 # Main app entry with navigation
├── index.js                # App entry point (foreground service registration)
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── components/             # Screen components
│   ├── home-screen.tsx
│   ├── recording-screen.tsx
│   ├── meeting-detail-screen.tsx
│   ├── all-meetings-screen.tsx
│   ├── processing-screen.tsx
│   ├── summary-screen.tsx
│   ├── settings-screen.tsx
│   ├── paywall-screen.tsx
│   └── ui/                 # Reusable UI components
├── src/
│   ├── db/                 # Database layer
│   │   ├── database.ts     # SQLite initialization
│   │   └── MeetingRepository.ts  # CRUD operations
│   ├── services/           # Business logic services
│   │   ├── audioService.ts      # Audio recording/playback
│   │   ├── foregroundService.ts # Android foreground service
│   │   └── notificationService.ts # Notifications
│   └── types/              # TypeScript types
│       └── navigation.ts
├── constants/
│   └── Colors.ts           # Theme colors
└── android-manifest.plugin.js  # Custom Expo config plugin
```

### Key Services

#### `audioService.ts`
- Audio mode configuration
- File system operations
- Recording file management

#### `foregroundService.ts`
- Android foreground service management
- Notification display/updates
- Service lifecycle management

#### `notificationService.ts`
- Notification permissions
- Notification display
- Channel management

#### `MeetingRepository.ts`
- Database CRUD operations
- Type-safe meeting management
- Query helpers

### Data Flow

1. **Recording Flow**:
   ```
   User taps Record → Request Permissions → Start Foreground Service → 
   Configure Audio Mode → Create Recording → Start Recording → 
   Poll Status → Stop Recording → Save File → Create DB Record → Navigate Home
   ```

2. **Playback Flow**:
   ```
   User taps Meeting → Load Meeting → Load Audio → Check App State → 
   Play Audio → Update Progress → Handle Background → Stop Playback
   ```

3. **Background Recording Flow**:
   ```
   Recording Active → App Backgrounds → Check Foreground Service → 
   Update Notification → Continue Recording → App Foregrounds → 
   Sync Duration → Continue/Stop
   ```

---

## 🐛 Known Issues & Limitations

### Current Issues
1. **Processing Screen**: UI exists but not connected to backend
2. **Summary Screen**: UI exists but shows mock data
3. **Delete Meeting**: Repository method exists but UI not connected
4. **Edit Meeting Title**: Not implemented
5. **Navigation**: Custom implementation, could be upgraded to React Navigation

### Platform Limitations
1. **Expo Go**: Some background features limited in Expo Go
2. **Android Permissions**: Requires "Allow all the time" for background recording
3. **Battery Optimization**: Some devices may restrict background recording
4. **iOS Background**: May terminate app if low memory

### Technical Debt
1. **expo-av Deprecation**: Should migrate to expo-audio (audioServiceV2.ts exists but not used)
2. **Navigation**: Should migrate to React Navigation for better UX
3. **State Management**: Could benefit from Zustand/Redux for complex state
4. **Error Handling**: Could use error boundaries for better error UX

---

## 📚 Documentation Files

### Implementation Docs
- `IMPLEMENTATION_SUMMARY.md` - Core implementation details
- `ANDROID_BACKGROUND_RECORDING.md` - Android-specific background recording
- `ANDROID_IMPLEMENTATION_COMPLETE.md` - Complete Android implementation
- `FOREGROUND_SERVICE_IMPLEMENTATION.md` - Foreground service details

### Fix Documentation
- `AUDIO_PLAYBACK_EDGE_CASES.md` - Audio playback fixes
- `AUDIO_PLAYBACK_FALSE_POSITIVE_FIX.md` - False positive error fix
- `AUDIO_ERROR_SUPPRESSION.md` - Error suppression implementation
- `MEETING_SAVE_CLEANUP.md` - Cleanup after meeting save
- `SQLITE_ERROR_FIX.md` - Database error fixes
- `NOTIFICATION_VISIBILITY_FIX.md` - Notification visibility fixes

### Build Documentation
- `BUILD_INSTRUCTIONS.md` - General build instructions
- `BUILD_ANDROID.md` - Android-specific build
- `BUILD_DEBUG_IOS.md` - iOS debug build
- `ANDROID_LOCK_SCREEN_TEST.md` - Testing guide

---

## 🎯 Next Steps for Future Development

### Priority 1: Backend Integration
1. **Set up API client** - Create service for API calls
2. **Authentication** - Implement login/signup
3. **Upload recordings** - Sync recordings to backend
4. **Transcription API** - Connect to transcription service
5. **Status polling** - Update processing status

### Priority 2: Core Features
1. **Edit meeting title** - Allow users to rename meetings
2. **Delete meeting** - Connect delete functionality to UI
3. **Search meetings** - Add search functionality
4. **React Navigation** - Upgrade navigation system

### Priority 3: Audio Enhancements
1. **Seek functionality** - Add playback seeking
2. **Playback speed** - Add speed controls
3. **Waveform visualization** - Visual audio representation
4. **Migrate to expo-audio** - Replace deprecated expo-av

### Priority 4: UI/UX Improvements
1. **Pull to refresh** - Add refresh gesture
2. **Skeleton loaders** - Better loading states
3. **Error boundaries** - Better error handling
4. **Accessibility** - Screen reader support

### Priority 5: Testing & Quality
1. **Unit tests** - Test services and utilities
2. **Integration tests** - Test database operations
3. **E2E tests** - Test complete flows
4. **Error tracking** - Add Sentry or similar

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (or use npx)
- iOS Simulator (Mac) or Android Emulator
- EAS CLI (for builds): `npm install -g eas-cli`

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building
```bash
# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

### Testing Background Recording
1. Create development build (not Expo Go)
2. Grant microphone permission "Allow all the time"
3. Grant notification permissions
4. Start recording
5. Lock screen or switch apps
6. Verify recording continues

---

## 📝 Notes for Next Agent

### Critical Files to Understand
1. **`index.js`** - Foreground service registration (MUST be in entry point)
2. **`src/services/foregroundService.ts`** - Android foreground service logic
3. **`components/recording-screen.tsx`** - Main recording logic
4. **`src/db/MeetingRepository.ts`** - Database operations

### Important Patterns
1. **App State Checking**: Always check `AppState.currentState` (not cached refs)
2. **Foreground Service**: Must be started BEFORE `Audio.Recording.createAsync()`
3. **Cleanup**: Always clear state, refs, and intervals before navigation
4. **Error Handling**: Suppress expected errors (background audio focus)

### Common Pitfalls
1. **Don't register foreground service in components** - Must be in index.js
2. **Don't check cached app state** - Always use `AppState.currentState`
3. **Don't forget cleanup** - Clear intervals and refs on unmount
4. **Don't block on 'inactive' state** - Only block on 'background'

### Testing Checklist
- [ ] Recording works in foreground
- [ ] Recording continues when screen locked
- [ ] Recording continues when app backgrounded
- [ ] Foreground service notification appears
- [ ] Audio playback works
- [ ] Playback blocks when app backgrounded
- [ ] Meetings persist after app restart
- [ ] Partial recordings are detected and recoverable

---

## 📊 Project Health

### Code Quality: ⭐⭐⭐⭐ (4/5)
- Well-structured components
- Type-safe with TypeScript
- Good error handling
- Some technical debt (expo-av deprecation)

### Feature Completeness: ⭐⭐⭐ (3/5)
- Core recording: 100% complete
- Background recording: 100% complete
- UI screens: 80% complete (some mock data)
- Backend integration: 0% complete
- Advanced features: 0% complete

### Documentation: ⭐⭐⭐⭐⭐ (5/5)
- Comprehensive implementation docs
- Detailed fix documentation
- Build instructions
- Testing guides

### Testing: ⭐⭐ (2/5)
- Manual testing documented
- No automated tests
- No unit tests
- No E2E tests

---

**Last Updated**: December 2024
**Expo SDK**: 54.0.0
**React Native**: 0.81.5
**Status**: Core features complete, backend integration pending
