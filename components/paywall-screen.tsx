"use client"

import { X, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PaywallScreenProps {
  onNavigate: (screen: "home" | "recording" | "processing" | "summary" | "paywall") => void
}

export function PaywallScreen({ onNavigate }: PaywallScreenProps) {
  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-end">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-accent/10 p-6">
              <Zap className="h-12 w-12 text-accent" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-medium text-balance">Unlock Unlimited Meetings</h1>
            <p className="text-muted-foreground text-balance">Record as many meetings as you need with BotMR Pro</p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Feature text="Unlimited meeting recordings" />
            <Feature text="Advanced AI summaries" />
            <Feature text="Priority processing" />
            <Feature text="Export to all formats" />
            <Feature text="Team collaboration" />
          </div>
        </div>

        {/* Pricing Card */}
        <div className="space-y-4">
          <Card className="border-accent/20 bg-card p-6">
            <div className="mb-4 text-center">
              <div className="mb-1 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-medium">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">Cancel anytime</p>
            </div>

            <Button
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => onNavigate("home")}
            >
              Start Free Trial
            </Button>
          </Card>

          <p className="text-center text-xs text-muted-foreground">7-day free trial, then $9.99/month</p>
        </div>
      </div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10">
        <Check className="h-4 w-4 text-accent" />
      </div>
      <span>{text}</span>
    </div>
  )
}
