# Quick Start: Development Build for Background Recording

Since you've installed `expo-dev-client`, here's how to build and test background recording properly.

## Step 1: Install EAS CLI

You can use EAS CLI in two ways:

### Option A: Install globally (recommended)
```bash
npm install -g eas-cli
```

If npm is not in your PATH, you may need to:
- Use `npx eas-cli` instead (see Option B)
- Or add npm to your PATH

### Option B: Use npx (no installation needed)
Just use `npx eas-cli` instead of `eas` for all commands below.

## Step 2: Login to Expo

```bash
npx eas-cli login
```

Or if you installed globally:
```bash
eas login
```

## Step 3: Configure EAS Build

```bash
npx eas-cli build:configure
```

This creates an `eas.json` file with build profiles.

## Step 4: Build Development Client for iOS

```bash
npx eas-cli build --profile development --platform ios
```

This will:
- Build your app in the cloud
- Generate certificates automatically
- Provide a download link when done

**Note**: First build may take 10-15 minutes. Subsequent builds are faster.

## Step 5: Install on Your Device

1. Download the `.ipa` file from the EAS build page
2. Install via:
   - **TestFlight** (recommended): Upload to App Store Connect
   - **Direct install**: Use Apple Configurator 2 or Xcode

## Step 6: Run Development Server

After installing the development build:

```bash
npx expo start --dev-client
```

Then scan the QR code with your device's camera (not Expo Go).

## Alternative: Local Build (if you have a Mac)

If you have a Mac and Xcode installed:

```bash
# Generate native code
npx expo prebuild

# Open in Xcode
cd ios
open BotMR.xcworkspace
```

Then build and run from Xcode.

## Why Development Build?

- ✅ **Background recording works properly**
- ✅ **No Expo Go limitations**
- ✅ **Full access to native APIs**
- ✅ **Better performance**
- ✅ **Can test on real devices**

## Troubleshooting

### "command not found: eas"
Use `npx eas-cli` instead of `eas`

### "command not found: npm"
- Check if Node.js is installed: `node --version`
- Install Node.js from nodejs.org if needed
- Or use `npx` which comes with Node.js

### Build fails
- Check your Apple Developer account is set up
- Ensure you're logged in: `npx eas-cli login`
- Check `eas.json` configuration

## Next Steps

Once you have the development build installed:
1. Test background recording by locking the screen
2. Verify recording continues
3. Check console logs for recording status

The background recording should work much better with a development build!

