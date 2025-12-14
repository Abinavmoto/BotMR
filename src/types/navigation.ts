export type Screen =
  | 'home'
  | 'recording'
  | 'processing'
  | 'summary'
  | 'paywall'
  | 'settings'
  | 'all-meetings'
  | 'meeting-detail'

export type NavigationHandler = (screen: Screen, meetingId?: string) => void
