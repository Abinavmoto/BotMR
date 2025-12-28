# TODO List - Actionable Items

## 🔴 High Priority

### Backend Integration
- [ ] Create API client service (`src/services/apiClient.ts`)
- [ ] Implement authentication (login/signup)
- [ ] Add upload recording endpoint integration
- [ ] Connect transcription API
- [ ] Implement status polling for processing
- [ ] Add offline queue for failed uploads
- [ ] Handle network errors gracefully

### Core Features
- [ ] **Edit Meeting Title** - Add edit button in meeting detail screen
- [ ] **Delete Meeting** - Connect `MeetingRepository.deleteMeeting()` to UI
- [ ] **Search Meetings** - Add search bar in home screen
- [ ] **Filter by Date** - Add date range filter

## 🟡 Medium Priority

### Audio Enhancements
- [ ] **Seek Functionality** - Add seek bar to audio player
- [ ] **Playback Speed** - Add 0.5x, 1x, 1.5x, 2x controls
- [ ] **Waveform Visualization** - Add audio waveform display
- [ ] **Migrate to expo-audio** - Replace expo-av (audioServiceV2.ts exists)

### UI/UX Improvements
- [ ] **React Navigation** - Replace custom navigation
- [ ] **Pull to Refresh** - Add refresh gesture to meeting list
- [ ] **Skeleton Loaders** - Better loading states
- [ ] **Error Boundaries** - Catch and display errors gracefully
- [ ] **Empty States** - Better empty state designs

### Processing Screen
- [ ] Connect to real transcription API
- [ ] Implement status polling
- [ ] Show real progress updates
- [ ] Handle processing errors

### Summary Screen
- [ ] Connect to real summary API
- [ ] Display actual summary data
- [ ] Implement regenerate functionality
- [ ] Implement download functionality

## 🟢 Low Priority

### Settings
- [ ] Audio quality settings
- [ ] Storage management view
- [ ] Auto-delete old recordings
- [ ] Theme selection (light/dark)
- [ ] Notification preferences

### Sharing & Export
- [ ] Export audio file
- [ ] Export transcript
- [ ] Export summary
- [ ] PDF report generation
- [ ] Share meeting link

### Analytics
- [ ] Add error tracking (Sentry)
- [ ] Add usage analytics
- [ ] Performance monitoring

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for database
- [ ] E2E tests for recording flow
- [ ] Automated background recording tests

## 🔧 Technical Debt

### Code Quality
- [ ] Remove debug info from meeting detail screen
- [ ] Add JSDoc comments to all functions
- [ ] Extract magic numbers to constants
- [ ] Refactor large components (recording-screen.tsx is 1200+ lines)

### Architecture
- [ ] Migrate to expo-audio (remove expo-av dependency)
- [ ] Add state management (Zustand/Redux)
- [ ] Implement proper error boundaries
- [ ] Add logging service

### Performance
- [ ] Optimize meeting list rendering (virtualization)
- [ ] Lazy load audio files
- [ ] Cache meeting metadata
- [ ] Optimize database queries

## 📝 Documentation

- [ ] API documentation
- [ ] Component documentation
- [ ] Architecture diagrams
- [ ] User guide

## 🐛 Known Bugs to Fix

- [ ] None currently known (all major issues fixed)

---

## Quick Wins (Start Here)

These are easy tasks that provide immediate value:

1. **Edit Meeting Title** (30 min)
   - Add edit button in meeting detail screen
   - Use Input component for editing
   - Call `MeetingRepository.updateMeeting()`

2. **Delete Meeting** (20 min)
   - Add delete button in meeting detail screen
   - Call `MeetingRepository.deleteMeeting()`
   - Delete audio file
   - Navigate back to home

3. **Search Meetings** (1 hour)
   - Add search input in home screen
   - Filter meetings by title
   - Update `MeetingRepository.listMeetings()` to accept search query

4. **Remove Debug Info** (10 min)
   - Remove debug card from meeting detail screen
   - Clean up console.logs (keep important ones)

---

**Note**: Check `PROJECT_STATUS.md` for detailed context on each feature.

