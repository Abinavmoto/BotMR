import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';
import { registerForegroundServiceHandler, createForegroundServiceChannel } from './src/services/foregroundService';

// CRITICAL: Register foreground service handler in entry file (index.js)
// This MUST be done before App component loads, as Notifee requires it
// to be registered before any notification with asForegroundService: true
if (Platform.OS === 'android') {
  console.log('🚀 [index.js] Registering foreground service handler in app entry point...')
  try {
    registerForegroundServiceHandler()
    // Create channel asynchronously (don't block app startup)
    createForegroundServiceChannel().catch((error) => {
      console.error('❌ [index.js] Failed to create foreground service channel:', error)
    })
    console.log('✅ [index.js] Foreground service handler registered successfully')
  } catch (error) {
    console.error('❌ [index.js] Failed to register foreground service handler:', error)
  }
}

registerRootComponent(App);
