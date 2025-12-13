"use client"

import { useEffect, useState } from "react"
import { FileText, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ProcessingScreenProps {
  onNavigate: (screen: "home" | "recording" | "processing" | "summary" | "paywall") => void
}

export function ProcessingScreen({ onNavigate }: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState("Transcribing audio")

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer)
          setTimeout(() => onNavigate("summary"), 500)
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
  }, [onNavigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-accent/20 blur-xl" />
            <div className="relative rounded-full bg-accent/10 p-8">
              <Sparkles className="h-16 w-16 animate-pulse text-accent" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-medium">Processing Meeting</h2>
          <p className="text-muted-foreground">{step}</p>
        </div>

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
      </div>
    </div>
  )
}

function ProcessingStep({ completed, active, label }: { completed: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
          completed ? "border-accent bg-accent" : active ? "border-accent" : "border-muted"
        }`}
      >
        {completed && <FileText className="h-3 w-3 text-accent-foreground" />}
      </div>
      <span className={`text-sm ${completed || active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  )
}
