"use client"

import { useState } from "react"
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, Loader2, CloudUpload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AllMeetingsScreenProps {
  onNavigate: (
    screen: "home" | "recording" | "processing" | "summary" | "paywall" | "settings" | "all-meetings",
  ) => void
}

export function AllMeetingsScreen({ onNavigate }: AllMeetingsScreenProps) {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">All Meetings</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs">
              Ready
            </TabsTrigger>
            <TabsTrigger value="processing" className="text-xs">
              Processing
            </TabsTrigger>
            <TabsTrigger value="queued" className="text-xs">
              Queued
            </TabsTrigger>
            <TabsTrigger value="failed" className="text-xs">
              Failed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            <MeetingCard
              title="Q4 Planning Session"
              duration="45 min"
              actionItems={3}
              status="ready"
              timestamp="2h ago"
              onClick={() => onNavigate("summary")}
            />
            <MeetingCard title="Design Review" duration="28 min" status="processing" />
            <MeetingCard title="Team Standup" duration="15 min" actionItems={5} status="uploading" />
            <MeetingCard title="Client Review" duration="30 min" status="failed" />
            <MeetingCard title="Morning Sync" duration="12 min" status="queued" />
          </TabsContent>

          <TabsContent value="ready" className="mt-4 space-y-3">
            <MeetingCard
              title="Q4 Planning Session"
              duration="45 min"
              actionItems={3}
              status="ready"
              timestamp="2h ago"
              onClick={() => onNavigate("summary")}
            />
            <MeetingCard
              title="Sprint Planning"
              duration="60 min"
              actionItems={8}
              status="ready"
              timestamp="1d ago"
              onClick={() => onNavigate("summary")}
            />
          </TabsContent>

          <TabsContent value="processing" className="mt-4 space-y-3">
            <MeetingCard title="Design Review" duration="28 min" status="processing" />
          </TabsContent>

          <TabsContent value="queued" className="mt-4 space-y-3">
            <MeetingCard title="Team Standup" duration="15 min" status="uploading" />
            <MeetingCard title="Morning Sync" duration="12 min" status="queued" />
          </TabsContent>

          <TabsContent value="failed" className="mt-4 space-y-3">
            <MeetingCard title="Client Review" duration="30 min" status="failed" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Spacing */}
      <div className="h-8" />
    </div>
  )
}

interface MeetingCardProps {
  title: string
  duration: string
  actionItems?: number
  status: "ready" | "processing" | "uploading" | "queued" | "failed"
  timestamp?: string
  onClick?: () => void
}

function MeetingCard({ title, duration, actionItems, status, timestamp, onClick }: MeetingCardProps) {
  const statusConfig = {
    ready: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-accent" />,
      text: "Ready",
      color: "text-accent",
      bgColor: "border-accent/30 bg-accent/5",
    },
    processing: {
      icon: <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />,
      text: "Processing",
      color: "text-accent",
      bgColor: "border-accent/30 bg-accent/5",
    },
    uploading: {
      icon: <CloudUpload className="h-3.5 w-3.5 text-orange-500" />,
      text: "Uploading",
      color: "text-orange-500",
      bgColor: "border-orange-500/30 bg-orange-500/5",
    },
    queued: {
      icon: <Loader2 className="h-3.5 w-3.5 text-muted-foreground" />,
      text: "Queued",
      color: "text-muted-foreground",
      bgColor: "border-border",
    },
    failed: {
      icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
      text: "Failed",
      color: "text-red-500",
      bgColor: "border-red-500/30 bg-red-500/5",
    },
  }

  const config = statusConfig[status]

  return (
    <Card
      className={`p-4 ${config.bgColor} ${onClick ? "cursor-pointer transition-colors hover:bg-secondary" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="mb-1 font-medium truncate">{title}</h4>
          <p className="text-sm text-muted-foreground">
            {duration}
            {actionItems && ` • ${actionItems} action items`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className={`flex items-center gap-1.5 text-xs ${config.color}`}>
            {config.icon}
            <span className="whitespace-nowrap">{config.text}</span>
          </div>
          {status === "failed" && (
            <Button size="sm" variant="outline" className="h-7 bg-transparent text-xs">
              Retry
            </Button>
          )}
          {timestamp && status === "ready" && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">{timestamp}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
