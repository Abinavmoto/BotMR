"use client"

import { Mic, Clock, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface HomeScreenProps {
  onNavigate: (screen: "home" | "recording" | "processing" | "summary" | "paywall") => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-medium tracking-tight">BotMR</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

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

      {/* Recent Meetings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent Meetings</h3>

        <Card className="cursor-pointer p-4 transition-colors hover:bg-secondary" onClick={() => onNavigate("summary")}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="mb-1 font-medium">Q4 Planning Session</h4>
              <p className="text-sm text-muted-foreground">45 min • 3 action items</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>2h ago</span>
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer p-4 transition-colors hover:bg-secondary">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="mb-1 font-medium">Team Standup</h4>
              <p className="text-sm text-muted-foreground">15 min • 5 action items</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>1d ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
