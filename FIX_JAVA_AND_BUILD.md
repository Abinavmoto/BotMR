# Fix Java and Build Android

## Step 1: Install Java 17

```bash
# Install Java 17
brew install openjdk@17

# Verify installation
ls /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk
```

## Step 2: Set Up Java 17

Add this to your `~/.zshrc` file:

```bash
# Java 17 for Android builds
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk
export PATH="$JAVA_HOME/bin:$PATH"
```

Then reload:
```bash
source ~/.zshrc
```

## Step 3: Verify Java Version

```bash
java -version
```

Should show: `openjdk version "17.x.x"`

## Step 4: Build Android (EAS Build - Recommended)

**EASIEST WAY** - No Java/Android SDK needed:

```bash
# Login to Expo
npx eas-cli login

# Build Android development build
npx eas-cli build --profile development --platform android
```

This builds in the cloud and gives you an APK to download!

## Alternative: Local Build (After Java is Fixed)

If you want to build locally after fixing Java:

```bash
# Make sure Java 17 is active
java -version  # Should show 17.x.x

# Build locally
npx expo run:android
```

## Troubleshooting

### "Unable to locate a Java Runtime"
- Java 17 not installed: Run `brew install openjdk@17`
- Path incorrect: Check `ls /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk`
- Not in PATH: Make sure `~/.zshrc` has the export statements

### Check if Java 17 is installed
```bash
brew list | grep openjdk
```

### Find Java installation
```bash
/usr/libexec/java_home -V
```

This shows all installed Java versions.

## Recommended: Use EAS Build

Instead of fixing Java locally, just use EAS Build:
- No Java setup needed
- No Android SDK needed  
- Builds in the cloud
- Works immediately

```bash
npx eas-cli build --profile development --platform android
```
