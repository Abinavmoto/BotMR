/**
 * Foreground Service for Android Background Recording
 * Uses @notifee/react-native to properly register a foreground service
 * This is the "missing piece" for reliable background recording on Android
 */

import notifee, { AndroidImportance, AndroidCategory, AuthorizationStatus } from '@notifee/react-native'
import { Platform, Linking, Alert } from 'react-native'

const FOREGROUND_SERVICE_CHANNEL_ID = 'recording-foreground-service'
const NOTIFICATION_ID = 'recording-status'

// Track if foreground service is registered
let isServiceRegistered = false

/**
 * Register the foreground service handler
 * This MUST be called before using asForegroundService: true
 * Call this once when the app starts (e.g., in App.tsx or recording screen mount)
 */
/**
 * Register the foreground service handler
 * CRITICAL: This MUST be called in the app entry file (index.js) BEFORE App component loads,
 * NOT in a component or App.tsx. Notifee requires this to be registered before any notification
 * with asForegroundService: true is displayed.
 * 
 * According to Notifee docs: "This registration should occur early in your application's 
 * lifecycle, ideally outside of any React components, such as in your index.js file."
 */
export function registerForegroundServiceHandler(): void {
  if (Platform.OS !== 'android') {
    return
  }

  if (isServiceRegistered) {
    console.log('ℹ️ [ForegroundService] Handler already registered, skipping')
    return
  }

  try {
    console.log('🚀 [ForegroundService] Registering foreground service handler in index.js...')
    
    // Register the foreground service handler
    // The promise should not resolve until the service is done
    notifee.registerForegroundService((notification) => {
      console.log('✅ [ForegroundService] Handler callback invoked - service is running')
      console.log('   Notification ID:', notification.id)
      return new Promise(() => {
        // This promise never resolves, keeping the service alive
        // The service will be stopped when stopForegroundService() is called
        console.log('🔄 [ForegroundService] Service promise active - keeping service alive')
      })
    })
    
    isServiceRegistered = true
    console.log('✅ [ForegroundService] Handler registered successfully in index.js entry point')
    console.log('✅ [ForegroundService] Ready to display foreground service notifications')
  } catch (error) {
    console.error('❌ [ForegroundService] Error registering handler:', error)
    throw error // Re-throw so caller knows registration failed
  }
}

/**
 * Request notification permissions using Notifee
 * CRITICAL: Must be called before displaying any notifications
 */
export async function requestNotifeePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true // iOS permissions handled separately
  }

  try {
    console.log('📱 [ForegroundService] Checking notification permissions...')
    
    // Check current permission status
    const settings = await notifee.getNotificationSettings()
    console.log('📱 [ForegroundService] Current permission status:', settings.authorizationStatus)
    
    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('✅ [ForegroundService] Notification permissions already granted')
      return true
    }
    
    // Request permissions
    console.log('📱 [ForegroundService] Requesting notification permissions...')
    const requestSettings = await notifee.requestPermission()
    console.log('📱 [ForegroundService] Permission request result:', requestSettings.authorizationStatus)
    
    if (requestSettings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('✅ [ForegroundService] Notification permissions granted')
      return true
    } else {
      console.warn('⚠️ [ForegroundService] Notification permissions denied:', requestSettings.authorizationStatus)
      return false
    }
  } catch (error) {
    console.error('❌ [ForegroundService] Error requesting notification permissions:', error)
    return false
  }
}

/**
 * Create notification channel for foreground service
 * Must be called before starting the foreground service
 */
export async function createForegroundServiceChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    console.log('📱 [ForegroundService] Creating notification channel...')
    await notifee.createChannel({
      id: FOREGROUND_SERVICE_CHANNEL_ID,
      name: 'Recording Status',
      importance: AndroidImportance.HIGH, // Required for foreground service
      sound: undefined, // No sound during recording
      vibration: false,
      lights: false,
    })
    console.log('✅ [ForegroundService] Notification channel created/verified')
  } catch (error) {
    console.error('❌ [ForegroundService] Error creating channel:', error)
    throw error
  }
}

/**
 * Start foreground service with notification
 * This is REQUIRED for background recording on Android
 * 
 * @param durationSeconds Current recording duration in seconds
 * @returns true if service started successfully, false otherwise
 */
/**
 * Start foreground service with notification
 * CRITICAL: This must be called BEFORE Audio.Recording.createAsync()
 * to ensure the notification is visible when recording starts.
 * 
 * @param durationSeconds Current recording duration in seconds
 * @returns true if service started successfully, false otherwise
 */
export async function startForegroundService(durationSeconds: number): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true // iOS doesn't need foreground service
  }

  try {
    // CRITICAL: Request notification permissions FIRST (Android 13+)
    console.log('📱 [ForegroundService] Requesting notification permissions...')
    const hasPermission = await requestNotifeePermissions()
    if (!hasPermission) {
      console.error('❌ [ForegroundService] Notification permissions denied - cannot show foreground service')
      Alert.alert(
        'Notification Permission Required',
        'BotMR needs notification permission to show a persistent notification while recording. Please enable notifications in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      )
      return false
    }
    console.log('✅ [ForegroundService] Notification permissions granted')

    // CRITICAL: Verify handler is registered (should be done in index.js)
    if (!isServiceRegistered) {
      console.warn('⚠️ [ForegroundService] Handler not registered! Registering now (should be in index.js)...')
      registerForegroundServiceHandler()
      // Longer delay to ensure Notifee has fully registered the handler
      await new Promise(resolve => setTimeout(resolve, 500))
    } else {
      console.log('✅ [ForegroundService] Handler already registered')
      // Small delay to ensure Notifee has processed the registration
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Ensure channel exists
    console.log('📱 [ForegroundService] Creating/verifying notification channel...')
    await createForegroundServiceChannel()

    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    console.log('📱 [ForegroundService] Displaying foreground service notification...')
    console.log(`   - Title: 🎙️ BotMR is recording audio`)
    console.log(`   - Body: Tap to return — ${timeString}`)
    console.log(`   - asForegroundService: true`)
    console.log(`   - foregroundServiceType: microphone`)
    console.log(`   - Handler registered: ${isServiceRegistered}`)

    // CRITICAL: Add delay to ensure Notifee has fully processed the handler registration
    // This is important because Notifee needs time to register the handler internally
    if (isServiceRegistered) {
      console.log('⏳ [ForegroundService] Waiting 300ms to ensure Notifee handler is fully registered...')
      await new Promise(resolve => setTimeout(resolve, 300))
      console.log('✅ [ForegroundService] Delay complete, handler should be ready')
    }

    // Start foreground service with notification
    console.log('📤 [ForegroundService] Calling notifee.displayNotification() with asForegroundService: true...')
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: '🎙️ BotMR is recording audio',
      body: `Tap to return — ${timeString}`,
      android: {
        channelId: FOREGROUND_SERVICE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.SERVICE,
        // CRITICAL: This makes it a foreground service
        asForegroundService: true,
        ongoing: true, // Makes notification non-dismissible
        autoCancel: false,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        // Foreground service type for microphone
        foregroundServiceType: 'microphone',
      },
    })

    // CRITICAL: Verify notification was actually displayed
    // Wait a moment for the notification to appear
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const displayedNotifications = await notifee.getDisplayedNotifications()
    const notificationExists = displayedNotifications.some((n: { id: string }) => n.id === NOTIFICATION_ID)
    
    if (notificationExists) {
      console.log('✅ [ForegroundService] Notification confirmed visible in system')
      console.log(`✅ [ForegroundService] Notification ID: ${NOTIFICATION_ID}`)
      console.log(`✅ [ForegroundService] Total displayed notifications: ${displayedNotifications.length}`)
    } else {
      console.error('❌ [ForegroundService] Notification NOT visible in system!')
      console.error('❌ [ForegroundService] This means the foreground service may not be active')
      console.error('❌ [ForegroundService] Check:')
      console.error('   1. Notification permissions are granted')
      console.error('   2. Notification channel is not blocked')
      console.error('   3. App is not in battery optimization mode')
      console.error('   4. Handler was registered in index.js')
      
      // Try to get more info about why it failed
      try {
        const settings = await notifee.getNotificationSettings()
        console.error('📱 [ForegroundService] Current notification settings:', JSON.stringify(settings, null, 2))
      } catch (settingsError) {
        console.error('❌ [ForegroundService] Could not get notification settings:', settingsError)
      }
      
      // Return false so caller knows the service didn't start properly
      return false
    }

    console.log('✅ [ForegroundService] Foreground service started successfully')
    return true
  } catch (error) {
    console.error('❌ [ForegroundService] Error starting foreground service:', error)
    return false
  }
}

/**
 * Update foreground service notification with new duration
 * 
 * @param durationSeconds Current recording duration in seconds
 */
export async function updateForegroundService(durationSeconds: number): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: '🎙️ BotMR is recording audio',
      body: `Tap to return — ${timeString}`,
      android: {
        channelId: FOREGROUND_SERVICE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.SERVICE,
        asForegroundService: true,
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        foregroundServiceType: 'microphone',
      },
    })
  } catch (error) {
    console.error('❌ Error updating foreground service:', error)
  }
}

/**
 * Stop foreground service and cancel notification
 */
export async function stopForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    console.log('🛑 [ForegroundService] Stopping foreground service...')
    
    // Stop foreground service
    await notifee.stopForegroundService()
    console.log('✅ [ForegroundService] stopForegroundService() called')
    
    // Cancel notification
    await notifee.cancelNotification(NOTIFICATION_ID)
    console.log('✅ [ForegroundService] Notification canceled')
    
    console.log('✅ [ForegroundService] Foreground service stopped successfully')
  } catch (error) {
    console.error('❌ [ForegroundService] Error stopping service:', error)
    // Try to cancel notification even if stopForegroundService fails
    try {
      await notifee.cancelNotification(NOTIFICATION_ID)
      console.log('✅ [ForegroundService] Notification canceled as fallback')
    } catch (cancelError) {
      console.error('❌ [ForegroundService] Error canceling notification:', cancelError)
    }
  }
}

/**
 * Check if foreground service is currently active
 */
export async function isForegroundServiceActive(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false
  }

  try {
    const notifications = await notifee.getDisplayedNotifications()
    return notifications.some((n: { id: string }) => n.id === NOTIFICATION_ID)
  } catch (error) {
    console.error('❌ Error checking foreground service status:', error)
    return false
  }
}
