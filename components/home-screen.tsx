"use client"

import { Mic, Clock, Settings, WifiOff, CloudUpload, AlertCircle, CheckCircle2, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface HomeScreenProps {
  onNavigate: (
    screen: "home" | "recording" | "processing" | "summary" | "paywall" | "settings" | "all-meetings",
  ) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const isOffline = false
  const hasSyncSuccess = true

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-medium tracking-tight">BotMR</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("all-meetings")}>
            <FolderOpen className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onNavigate("settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isOffline && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm">
          <WifiOff className="h-4 w-4 text-orange-500" />
          <span className="text-orange-500">Offline mode • Recordings will sync later</span>
        </div>
      )}

      {hasSyncSuccess && !isOffline && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <span className="text-accent">2 meetings synced successfully</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        {/* Large Record Button */}
        <button
          onClick={() => onNavigate("recording")}
          className="group relative flex h-56 w-56 items-center justify-center rounded-full bg-accent transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-4 rounded-full bg-background/10" />
          <Mic className="h-24 w-24 text-accent-foreground" />
        </button>

        <div className="text-center">
          <h2 className="mb-2 text-3xl font-medium">Ready to Record</h2>
          <p className="text-muted-foreground">Tap to start your meeting</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent Meetings</h3>

        {/* Uploading State */}
        <Card className="border-orange-500/30 bg-orange-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="mb-1 font-medium truncate">Team Standup</h4>
              <p className="text-sm text-muted-foreground">15 min • 5 action items</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-orange-500">
              <CloudUpload className="h-3.5 w-3.5" />
              <span className="whitespace-nowrap">Uploading</span>
            </div>
          </div>
        </Card>

        {/* Processing State */}
        <Card className="border-accent/30 bg-accent/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="mb-1 font-medium truncate">Design Review</h4>
              <p className="text-sm text-muted-foreground">28 min • Processing...</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-accent">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <span className="whitespace-nowrap">Processing</span>
            </div>
          </div>
        </Card>

        {/* Ready State */}
        <Card className="cursor-pointer p-4 transition-colors hover:bg-secondary" onClick={() => onNavigate("summary")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="mb-1 font-medium truncate">Q4 Planning Session</h4>
              <p className="text-sm text-muted-foreground">45 min • 3 action items</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">2h ago</span>
            </div>
          </div>
        </Card>

        {/* Error State - Single action: Retry */}
        <Card className="border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="mb-1 font-medium truncate">Client Review</h4>
              <p className="text-sm text-muted-foreground">30 min • Upload failed</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Error</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 bg-transparent text-xs">
                Retry
              </Button>
            </div>
          </div>
        </Card>

        {/* Recorded (Local) State */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="mb-1 font-medium truncate">Morning Sync</h4>
              <p className="text-sm text-muted-foreground">12 min • Saved locally</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="whitespace-nowrap">Recorded</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
