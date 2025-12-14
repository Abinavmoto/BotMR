# BotMR Mobile App - Expo

This is a React Native mobile app built with Expo, converted from a Next.js web application.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI: `npm install -g expo-cli` (optional, can use npx)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
# or
npx expo start
```

3. Run on your preferred platform:
- Press `i` for iOS simulator (requires Xcode on Mac)
- Press `a` for Android emulator (requires Android Studio)
- Scan QR code with Expo Go app on your physical device (iOS/Android)

## Project Structure

- `App.tsx` - Main app entry point with navigation
- `components/` - Screen components and UI components
- `constants/Colors.ts` - Theme colors
- `lib/utils.ts` - Utility functions

## Key Changes from Next.js

1. **Components**: Converted from HTML/div to React Native View/Text
2. **Styling**: Replaced Tailwind CSS with StyleSheet
3. **Icons**: Replaced lucide-react with @expo/vector-icons (Ionicons)
4. **Navigation**: Simple state-based navigation (can be upgraded to React Navigation)
5. **UI Components**: Custom React Native implementations replacing Radix UI

## Next Steps

- Install React Navigation for proper navigation stack
- Add native features (audio recording, file system access)
- Implement proper state management (Redux, Zustand, etc.)
- Add native modules for meeting recording functionality
