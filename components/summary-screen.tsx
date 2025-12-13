"use client"

import { ArrowLeft, Share2, Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface SummaryScreenProps {
  onNavigate: (screen: "home" | "recording" | "processing" | "summary" | "paywall") => void
}

export function SummaryScreen({ onNavigate }: SummaryScreenProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 py-6">
        {/* Meeting Title */}
        <div>
          <h1 className="mb-2 text-3xl font-medium">Q4 Planning Session</h1>
          <p className="text-sm text-muted-foreground">45 minutes • Today at 2:30 PM</p>
        </div>

        {/* Summary Section */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full bg-accent/10 p-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-medium uppercase tracking-wide text-muted-foreground text-xs">Summary</h2>
          </div>
          <p className="leading-relaxed text-foreground">
            Discussed Q4 objectives focusing on product launches and market expansion. Team agreed on three priority
            initiatives: mobile app redesign, customer retention program, and partnership development in APAC region.
          </p>
        </Card>

        {/* Decisions Section */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-full bg-accent/10 p-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-medium uppercase tracking-wide text-muted-foreground text-xs">Key Decisions</h2>
          </div>
          <ul className="space-y-3">
            <DecisionItem text="Allocate $200K budget for mobile redesign" />
            <DecisionItem text="Launch retention program by end of October" />
            <DecisionItem text="Prioritize APAC expansion over European markets" />
          </ul>
        </Card>

        {/* Action Items Section */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-full bg-accent/10 p-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-medium uppercase tracking-wide text-muted-foreground text-xs">Action Items</h2>
          </div>
          <div className="space-y-4">
            <ActionItem label="Schedule design review with product team" assignee="Sarah" dueDate="Oct 15" />
            <ActionItem label="Draft retention program proposal" assignee="Mike" dueDate="Oct 18" />
            <ActionItem label="Research APAC partnership opportunities" assignee="Jessica" dueDate="Oct 20" />
            <ActionItem label="Prepare budget allocation document" assignee="Tom" dueDate="Oct 22" />
          </div>
        </Card>

        {/* Bottom Spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}

function DecisionItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="flex-1 leading-relaxed">{text}</span>
    </li>
  )
}

function ActionItem({ label, assignee, dueDate }: { label: string; assignee: string; dueDate: string }) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox className="mt-0.5" />
      <div className="flex-1">
        <p className="leading-relaxed">{label}</p>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          <span>{assignee}</span>
          <span>•</span>
          <span>Due {dueDate}</span>
        </div>
      </div>
    </div>
  )
}
