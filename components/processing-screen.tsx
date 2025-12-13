"use client"

import { useEffect, useState } from "react"
import { FileText, Sparkles, WifiOff, Loader2, CheckCircle2, Edit2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface ProcessingScreenProps {
  onNavigate: (screen: "home" | "recording" | "processing" | "summary" | "paywall" | "settings") => void
}

export function ProcessingScreen({ onNavigate }: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState("Transcribing audio")
  const [showSuccess, setShowSuccess] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState("Q4 Planning Session")
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const isOffline = false
  const isPartialProcessing = false

  useEffect(() => {
    if (isOffline) {
      setStep("Queued for processing")
      return
    }

    if (isPartialProcessing) {
      setProgress(65)
      setStep("Transcription complete – waiting to generate summary")
      return
    }

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer)
          setShowSuccess(true)
          return 100
        }
        const newProgress = oldProgress + 2

        if (newProgress > 30 && newProgress < 35) {
          setStep("Analyzing content")
        } else if (newProgress > 60 && newProgress < 65) {
          setStep("Generating summary")
        } else if (newProgress > 90) {
          setStep("Finalizing")
        }

        return newProgress
      })
    }, 100)

    return () => clearInterval(timer)
  }, [isOffline, isPartialProcessing])

  if (showSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-accent/20 blur-xl" />
              <div className="relative rounded-full bg-accent/10 p-8">
                <CheckCircle2 className="h-16 w-16 text-accent" />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-medium">Meeting Processed</h2>
            <p className="text-muted-foreground">Your summary is ready</p>
          </div>

          <Card className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Meeting Name</p>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <Button size="sm" onClick={() => setIsEditingTitle(false)}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="font-medium">{meetingTitle}</p>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          <Button className="w-full" size="lg" onClick={() => onNavigate("summary")}>
            View Summary
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full ${isOffline ? "bg-orange-500/20" : "bg-accent/20 animate-pulse"} blur-xl`}
            />
            <div className={`relative rounded-full ${isOffline ? "bg-orange-500/10" : "bg-accent/10"} p-8`}>
              {isOffline ? (
                <WifiOff className="h-16 w-16 text-orange-500" />
              ) : (
                <Sparkles className="h-16 w-16 animate-pulse text-accent" />
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4 text-center">
          {isOffline ? (
            <>
              <h2 className="text-2xl font-medium">Queued for Processing</h2>
              <p className="text-muted-foreground">Recording saved locally. Will process when online.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-medium">Processing Meeting</h2>
              <p className="text-muted-foreground">{step}</p>
            </>
          )}
        </div>

        {!isOffline && (
          <>
            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{step}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Processing Steps */}
            <div className="space-y-3 pt-4">
              <ProcessingStep completed={progress > 30} active={progress <= 30} label="Transcribing audio" />
              <ProcessingStep
                completed={progress > 60}
                active={progress > 30 && progress <= 60}
                label="Analyzing content"
              />
              <ProcessingStep
                completed={progress > 90}
                active={progress > 60 && progress <= 90}
                label="Generating summary"
              />
            </div>
          </>
        )}

        {isOffline && (
          <div className="flex items-center justify-center gap-2 text-sm text-orange-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for connection</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ProcessingStep({ completed, active, label }: { completed: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          completed ? "border-accent bg-accent" : active ? "border-accent" : "border-muted"
        }`}
      >
        {completed && <FileText className="h-3 w-3 text-accent-foreground" />}
      </div>
      <span className={`text-sm ${completed || active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  )
}
