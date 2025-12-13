"use client"

import { useState, useEffect } from "react"
import { Square, Pause, Play, WifiOff, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface RecordingScreenProps {
  onNavigate: (
    screen: "home" | "recording" | "processing" | "summary" | "paywall" | "settings" | "all-meetings",
  ) => void
}

export function RecordingScreen({ onNavigate }: RecordingScreenProps) {
  const [seconds, setSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showBackgroundNotice, setShowBackgroundNotice] = useState(true)
  const isOffline = false

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused])

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600)
    const minutes = Math.floor((secs % 3600) / 60)
    const seconds = secs % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-medium tracking-tight">BotMR</h1>
      </div>

      {showBackgroundNotice && (
        <Card className="mb-6 border-accent/30 bg-accent/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Minimize2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium">Recording continues in background</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can minimize the app. Recording will continue until you stop it.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowBackgroundNotice(false)}
            >
              Got it
            </Button>
          </div>
        </Card>
      )}

      {/* Recording Indicator */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="relative">
          {/* Pulsing rings */}
          <div className="absolute inset-0 animate-ping rounded-full bg-accent opacity-20" />
          <div className="absolute inset-4 animate-pulse rounded-full bg-accent opacity-30" />

          {/* Record indicator */}
          <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-accent/20">
            <div className="h-32 w-32 rounded-full bg-accent" />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="mb-2 font-mono text-6xl font-medium tabular-nums tracking-tight">{formatTime(seconds)}</div>
          {isOffline ? (
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-orange-500">Recording offline – will sync later</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <p className="text-sm text-muted-foreground">Recording in progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 pb-8">
        <Button variant="ghost" size="lg" className="h-16 w-16 rounded-full" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
        </Button>

        <Button
          size="lg"
          variant="destructive"
          className="h-20 w-20 rounded-full"
          onClick={() => onNavigate("processing")}
        >
          <Square className="h-8 w-8 fill-current" />
        </Button>
      </div>
    </div>
  )
}
