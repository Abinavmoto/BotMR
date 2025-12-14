# Quick Android Build Guide

## EASIEST: Use EAS Build (No Java Setup Needed!)

**Recommended approach** - builds in the cloud, no local setup:

```bash
# 1. Login to Expo
npx eas-cli login

# 2. Build Android development build
npx eas-cli build --profile development --platform android
```

That's it! Download the APK and install on your device.

---

## Alternative: Fix Java for Local Build

If you want to build locally, you need Java 17.

### Step 1: Link Java 17 (Required for macOS)

```bash
# Link Java 17 to system location
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### Step 2: Add to ~/.zshrc

```bash
# Add these lines to ~/.zshrc
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk
export PATH="$JAVA_HOME/bin:$PATH"
```

### Step 3: Reload Shell

```bash
source ~/.zshrc
```

### Step 4: Verify

```bash
java -version
# Should show: openjdk version "17.x.x"
```

### Step 5: Build

```bash
npx expo run:android
```

---

## Quick Setup Script

I've created `setup-java.sh` - run it:

```bash
chmod +x setup-java.sh
./setup-java.sh
```

This will:
- Link Java 17 to system location
- Set up JAVA_HOME
- Show you what to add to ~/.zshrc

---

## Why EAS Build is Better

✅ No Java setup needed
✅ No Android SDK needed
✅ Builds in the cloud
✅ Works on any machine
✅ Faster setup

Just run:
```bash
npx eas-cli build --profile development --platform android
```
