import React, { useState, useEffect } from 'react'
import { StyleSheet, StatusBar, Platform } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { HomeScreen } from './components/home-screen'
import { RecordingScreen } from './components/recording-screen'
import { ProcessingScreen } from './components/processing-screen'
import { SummaryScreen } from './components/summary-screen'
import { PaywallScreen } from './components/paywall-screen'
import { SettingsScreen } from './components/settings-screen'
import { AllMeetingsScreen } from './components/all-meetings-screen'
import { MeetingDetailScreen } from './components/meeting-detail-screen'
import { Colors } from './constants/Colors'
import { openDatabase } from './src/db/database'
import { Screen } from './src/types/navigation'
// Note: Foreground service handler is registered in index.js (app entry point)

interface NavigationState {
  screen: Screen
  meetingId?: string
}

// Permission state type
type PermissionStatus = 'granted' | 'denied' | 'undetermined' | null

export default function App() {
  const [navigationState, setNavigationState] = useState<NavigationState>({ screen: 'home' })
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(null)

  useEffect(() => {
    // Initialize database on app start
    openDatabase().catch((error) => {
      console.error('Failed to initialize database:', error)
    })

    // Check permissions on startup (don't request yet)
    checkInitialPermissions()

    // Note: Foreground service handler is registered in index.js (app entry point)
    // No need to register here - it's already registered globally before App component loads
  }, [])

  const checkInitialPermissions = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync()
      setPermissionStatus(status === 'granted' ? 'granted' : 'undetermined')
    } catch (error) {
      console.error('Error checking permissions on startup:', error)
      setPermissionStatus('undetermined')
    }
  }

  const handleNavigate = (screen: Screen, meetingId?: string) => {
    setNavigationState({ screen, meetingId })
  }

  const renderScreen = () => {
    switch (navigationState.screen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />
      case 'recording':
        return <RecordingScreen onNavigate={handleNavigate} permissionStatus={permissionStatus} onPermissionStatusChange={setPermissionStatus} />
      case 'processing':
        return <ProcessingScreen onNavigate={handleNavigate} />
      case 'summary':
        return <SummaryScreen onNavigate={handleNavigate} />
      case 'paywall':
        return <PaywallScreen onNavigate={handleNavigate} />
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />
      case 'all-meetings':
        return <AllMeetingsScreen onNavigate={handleNavigate} />
      case 'meeting-detail':
        return (
          <MeetingDetailScreen
            meetingId={navigationState.meetingId || ''}
            onNavigate={handleNavigate}
          />
        )
      default:
        return <HomeScreen onNavigate={handleNavigate} />
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        {renderScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})
