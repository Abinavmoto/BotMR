# iOS Build and Deployment Guide

This guide explains how to build and deploy your BotMR app to iOS devices for testing, replacing Expo Go with a development build.

## Prerequisites

1. **Apple Developer Account** (Free or Paid)
   - Free account: Limited to 7-day certificates, 3 apps max
   - Paid account ($99/year): Full access, 1-year certificates, unlimited apps

2. **macOS** (required for iOS builds)
   - Xcode installed from Mac App Store
   - Command Line Tools: `xcode-select --install`

3. **EAS CLI** (Expo Application Services)
   ```bash
   npm install -g eas-cli
   eas login
   ```

## Option 1: EAS Build (Recommended - Cloud Build)

EAS Build runs builds in the cloud, so you don't need a Mac.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure EAS
```bash
eas build:configure
```
This creates an `eas.json` file in your project.

### Step 3: Build for iOS Development
```bash
eas build --platform ios --profile development
```

This will:
- Prompt you to create an Apple Developer account if needed
- Generate certificates and provisioning profiles automatically
- Build your app in the cloud
- Provide a download link when complete

### Step 4: Install on Device
1. Download the `.ipa` file from the EAS build page
2. Install via:
   - **TestFlight** (recommended): Upload to App Store Connect, then install via TestFlight app
   - **Direct install**: Use Apple Configurator 2 or Xcode

### Step 5: Run Development Build
After installing, you can run:
```bash
npx expo start --dev-client
```
Then scan the QR code with your camera (not Expo Go) to load the app.

## Option 2: Local Build with Xcode

If you have a Mac and want to build locally:

### Step 1: Generate Native Code
```bash
npx expo prebuild
```

### Step 2: Open in Xcode
```bash
cd ios
open BotMR.xcworkspace
```

### Step 3: Configure Signing
1. Select your project in Xcode
2. Go to "Signing & Capabilities"
3. Select your Team (Apple Developer account)
4. Xcode will automatically manage certificates

### Step 4: Build and Run
1. Connect your iOS device via USB
2. Select your device in Xcode's device selector
3. Click "Run" (▶️) or press `Cmd+R`
4. Trust the developer certificate on your device: Settings → General → VPN & Device Management

## Option 3: Development Build with Expo Dev Client

### Step 1: Install Expo Dev Client
```bash
npx expo install expo-dev-client
```

### Step 2: Build Development Client
```bash
eas build --platform ios --profile development
```

### Step 3: Install and Use
- Install the development build on your device
- Run `npx expo start --dev-client`
- Scan QR code with your device's camera (not Expo Go)

## Build Profiles

Create different build profiles in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false
      }
    }
  }
}
```

## Testing on Simulator

For iOS Simulator (no Apple Developer account needed):

```bash
eas build --platform ios --profile development --local
```

Or use Expo Go for quick testing (but with limitations):
```bash
npx expo start
```

## Troubleshooting

### "No devices found"
- Ensure device is connected via USB
- Trust the computer on your device
- Check Xcode → Window → Devices and Simulators

### "Signing certificate not found"
- Ensure you're logged into your Apple Developer account in Xcode
- Go to Xcode → Preferences → Accounts → Add Apple ID

### "Provisioning profile expired"
- EAS Build handles this automatically
- For local builds: Xcode → Preferences → Accounts → Download Manual Profiles

### Background Recording Not Working
- Ensure `UIBackgroundModes: ["audio"]` is in `app.json`
- Development builds have better background support than Expo Go
- Test on a real device, not simulator

## Next Steps

1. **TestFlight Distribution**: Upload to App Store Connect for beta testing
2. **App Store Submission**: Use `eas build --platform ios --profile production` then submit via App Store Connect
3. **Continuous Integration**: Set up EAS Build with GitHub Actions for automated builds

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Development Guide](https://docs.expo.dev/development/build/)
- [Apple Developer Portal](https://developer.apple.com/)
