# Build Debug/Development Build for iOS Testing

## Quick Steps

### 1. Login to Expo (if not already)
```bash
npx eas-cli login
```

### 2. Build Development Client
```bash
npx eas-cli build --profile development --platform ios
```

This will:
- Build your app in the cloud (no Mac needed!)
- Generate certificates automatically
- Take 10-15 minutes for first build
- Provide a download link when complete

### 3. Install on Your iPhone

**Option A: Direct Install (Easiest)**
1. Download the `.ipa` file from the EAS build page
2. Open the link on your iPhone
3. Install the app
4. Trust the developer: Settings → General → VPN & Device Management → Trust

**Option B: TestFlight (Recommended for testing)**
1. Upload the build to App Store Connect
2. Add testers in TestFlight
3. Install via TestFlight app

### 4. Run Development Server

After installing the development build on your device:

```bash
npx expo start --dev-client
```

Then:
- Scan the QR code with your iPhone's camera
- The app will load in your development build (not Expo Go)

## What's Different from Expo Go?

✅ **Background recording works properly**
✅ **No limitations on native APIs**
✅ **Better performance**
✅ **Can test all features including background audio**

## Troubleshooting

### Build fails with certificate error
- EAS will automatically generate certificates
- Make sure you're logged in: `npx eas-cli login`
- Check your Apple Developer account is set up

### Can't install on device
- Make sure you trust the developer certificate
- Settings → General → VPN & Device Management → Trust "Expo" or your developer account

### App doesn't load after scanning QR
- Make sure your iPhone and computer are on the same WiFi network
- Or use tunnel mode: `npx expo start --dev-client --tunnel`

## Testing Background Recording

Once installed:
1. Start a recording
2. Lock your iPhone screen
3. Wait 30 seconds
4. Unlock and check:
   - Recording should have continued
   - Duration should match actual audio file
   - Console logs will show recording status

## Next Builds

After the first build, subsequent builds are faster (5-10 minutes) because:
- Certificates are cached
- Dependencies are cached
- Only your code changes are rebuilt

## Build Profiles

The `development` profile creates a debug build that:
- Includes development tools
- Allows hot reloading
- Connects to Expo dev server
- Perfect for testing

For production builds later, use:
```bash
npx eas-cli build --profile production --platform ios
```

