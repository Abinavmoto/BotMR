# Build Android Development Build for Testing

## Fix Java Version Issue First

You have Java 25 installed, but Gradle 8.14.3 requires Java 17 or 21.

### Option 1: Install Java 17 (Recommended)

```bash
# Install Java 17 using Homebrew
brew install openjdk@17

# Link it
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk
export PATH="$JAVA_HOME/bin:$PATH"

# Verify
java -version
# Should show: openjdk version "17.x.x"
```

### Option 2: Install Java 21

```bash
# Install Java 21 using Homebrew
brew install openjdk@21

# Link it
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk
export PATH="$JAVA_HOME/bin:$PATH"

# Verify
java -version
# Should show: openjdk version "21.x.x"
```

### Make Java Version Permanent

Add to your `~/.zshrc`:
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk
export PATH="$JAVA_HOME/bin:$PATH"
```

Then reload:
```bash
source ~/.zshrc
```

## Build Android Development Build

### Option 1: EAS Build (Cloud - Recommended)

```bash
# 1. Login (if not already)
npx eas-cli login

# 2. Build for Android
npx eas-cli build --profile development --platform android
```

This will:
- Build in the cloud (no Android SDK needed!)
- Generate APK or AAB file
- Provide download link when complete
- Take 10-15 minutes for first build

### Option 2: Local Build (Requires Android SDK)

If you want to build locally:

```bash
# 1. Install Android Studio
# Download from: https://developer.android.com/studio

# 2. Set up Android SDK
# Android Studio → SDK Manager → Install:
#   - Android SDK Platform 34
#   - Android SDK Build-Tools
#   - Android Emulator (optional)

# 3. Set ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Add to ~/.zshrc to make permanent

# 4. Generate native code
npx expo prebuild

# 5. Build and run
npx expo run:android
```

## Install on Android Device

### Option A: Direct Install (APK)

1. Download the APK from EAS build page
2. Transfer to your Android device
3. Enable "Install from Unknown Sources" in Settings
4. Install the APK

### Option B: ADB Install

```bash
# Connect device via USB
# Enable USB Debugging in Developer Options

# Install via ADB
adb install path/to/app-debug.apk
```

### Option C: Development Build + Dev Server

After installing the development build:

```bash
# Start dev server
npx expo start --dev-client

# On your Android device, open the development build app
# It will automatically connect to the dev server
```

## Testing Background Recording on Android

Once installed:
1. Start a recording
2. Press home button or switch apps
3. Wait 30+ seconds
4. Return to app
5. Check - recording should have continued

## Troubleshooting

### "Unsupported class file major version 69"
- You have Java 25, need Java 17 or 21
- See "Fix Java Version Issue" above

### "Failed to resolve Android SDK path"
- Install Android Studio
- Set ANDROID_HOME environment variable
- Or use EAS Build (cloud) instead

### Build fails
- Check Java version: `java -version` (should be 17 or 21)
- Check Android SDK is installed
- Try EAS Build instead (no local setup needed)

### Can't install APK
- Enable "Install from Unknown Sources"
- Settings → Security → Unknown Sources → Enable

## Quick Start (EAS Build - Easiest)

```bash
# 1. Fix Java (if building locally)
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk

# 2. Build in cloud (no Android SDK needed!)
npx eas-cli login
npx eas-cli build --profile development --platform android

# 3. Download APK and install on device
# 4. Run: npx expo start --dev-client
```

## Android Permissions

Already configured in `app.json`:
- `RECORD_AUDIO` permission
- Background audio mode (via expo-av)

Background recording should work on Android with a development build!
