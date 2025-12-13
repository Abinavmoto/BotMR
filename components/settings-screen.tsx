"use client"

import { useState } from "react"
import { ArrowLeft, Trash2, AlertTriangle, CalendarDays, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"

interface SettingsScreenProps {
  onNavigate: (
    screen: "home" | "recording" | "processing" | "summary" | "paywall" | "settings" | "all-meetings",
  ) => void
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [showDeleteLocalConfirm, setShowDeleteLocalConfirm] = useState(false)
  const [showDeleteCloudConfirm, setShowDeleteCloudConfirm] = useState(false)
  const [showAudioQualitySheet, setShowAudioQualitySheet] = useState(false)
  const [showProcessingModeSheet, setShowProcessingModeSheet] = useState(false)
  const [showSummaryStyleSheet, setShowSummaryStyleSheet] = useState(false)
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)

  const [audioQuality, setAudioQuality] = useState<"high" | "medium" | "low">("high")
  const [processingMode, setProcessingMode] = useState<"cloud" | "hybrid">("cloud")
  const [summaryStyle, setSummaryStyle] = useState<"action-focused" | "detailed" | "brief">("action-focused")
  const [calendarSync, setCalendarSync] = useState(false)

  const isOnline = true
  const currentPlan = "Free"
  const meetingsUsed = 8
  const meetingsLimit = 10
  const storageUsed = 65

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium">Settings</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 py-6">
        {/* Recording Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recording</h2>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Audio Quality</p>
                <p className="text-sm text-muted-foreground capitalize">{audioQuality}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAudioQualitySheet(true)}>
                Change
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Local Storage</p>
                <p className="text-sm text-muted-foreground">{storageUsed}% used</p>
              </div>
              <Progress value={storageUsed} className="h-2" />
              <p className="text-xs text-muted-foreground">2.1 GB of 3.2 GB</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Auto-upload when online</p>
                <p className="text-sm text-muted-foreground">Recordings sync automatically to cloud</p>
              </div>
              <Switch defaultChecked className="shrink-0" />
            </div>
          </Card>
        </div>

        {/* AI & Processing Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">AI & Processing</h2>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Processing Mode</p>
                <p className="text-sm text-muted-foreground capitalize">{processingMode}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setShowProcessingModeSheet(true)}>
                Change
              </Button>
            </div>
          </Card>

          <Card className="border-accent/30 bg-accent/5 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Cloud mode:</span> Fast, accurate AI processing on our
              servers. <span className="font-medium text-foreground">Hybrid mode:</span> Basic transcription locally,
              summary in cloud.
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Summary Style</p>
                <p className="text-sm text-muted-foreground capitalize">{summaryStyle.replace("-", " ")}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setShowSummaryStyleSheet(true)}>
                Change
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Calendar Integration</p>
                <p className="text-sm text-muted-foreground">
                  {calendarSync ? "Synced with Google Calendar" : "Not connected"}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setShowCalendarSheet(true)}>
                {calendarSync ? "Settings" : "Connect"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Account & Billing Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Account & Billing</h2>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-muted-foreground">{currentPlan}</p>
              </div>
              {currentPlan === "Free" && (
                <Button size="sm" onClick={() => onNavigate("paywall")}>
                  Upgrade
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Usage This Month</p>
                <p className="text-sm text-muted-foreground">
                  {meetingsUsed} of {meetingsLimit}
                </p>
              </div>
              <Progress value={(meetingsUsed / meetingsLimit) * 100} className="h-2" />
              {meetingsUsed >= meetingsLimit * 0.8 && (
                <p className="text-xs text-orange-500">Running low on meetings. Upgrade for unlimited.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Data & Privacy Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Data & Privacy</h2>

          {showDeleteLocalConfirm ? (
            <Card className="border-red-500/30 bg-red-500/5 p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium text-red-500">Delete local recordings?</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      This will permanently delete 5 recordings stored on this device. Cloud data will not be affected.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteLocalConfirm(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive">
                    Delete Local
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setShowDeleteLocalConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete local recordings
              </Button>
            </Card>
          )}

          {showDeleteCloudConfirm ? (
            <Card className="border-red-500/30 bg-red-500/5 p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-medium text-red-500">Delete all cloud data?</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      This will permanently delete 12 meetings, transcripts, and summaries from the cloud. This action
                      cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteCloudConfirm(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive">
                    Delete All
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600"
                onClick={() => setShowDeleteCloudConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete all cloud data
              </Button>
            </Card>
          )}

          <Card className="p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your recordings are encrypted and stored securely. We process audio using AI to generate transcripts and
              summaries. Data is retained for 90 days unless deleted manually.
            </p>
          </Card>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8" />
      </div>

      {showAudioQualitySheet && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowAudioQualitySheet(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl border-t border-l border-r border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Audio Quality</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAudioQualitySheet(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                variant={audioQuality === "high" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setAudioQuality("high")
                  setShowAudioQualitySheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                High (best quality, larger files)
              </Button>
              <Button
                variant={audioQuality === "medium" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setAudioQuality("medium")
                  setShowAudioQualitySheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Medium (balanced)
              </Button>
              <Button
                variant={audioQuality === "low" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setAudioQuality("low")
                  setShowAudioQualitySheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Low (smallest files)
              </Button>
            </div>
          </div>
        </div>
      )}

      {showProcessingModeSheet && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowProcessingModeSheet(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl border-t border-l border-r border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Processing Mode</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowProcessingModeSheet(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                variant={processingMode === "cloud" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setProcessingMode("cloud")
                  setShowProcessingModeSheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Cloud (fast, requires internet)
              </Button>
              <Button
                variant={processingMode === "hybrid" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setProcessingMode("hybrid")
                  setShowProcessingModeSheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Hybrid (works offline)
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSummaryStyleSheet && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowSummaryStyleSheet(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl border-t border-l border-r border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Summary Style</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSummaryStyleSheet(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                variant={summaryStyle === "action-focused" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setSummaryStyle("action-focused")
                  setShowSummaryStyleSheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Action-focused (decisions & tasks)
              </Button>
              <Button
                variant={summaryStyle === "detailed" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setSummaryStyle("detailed")
                  setShowSummaryStyleSheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Detailed (comprehensive)
              </Button>
              <Button
                variant={summaryStyle === "brief" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setSummaryStyle("brief")
                  setShowSummaryStyleSheet(false)
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Brief (key points only)
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCalendarSheet && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowCalendarSheet(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl border-t border-l border-r border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Calendar Integration</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCalendarSheet(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {calendarSync ? (
              <div className="space-y-4">
                <Card className="border-accent/30 bg-accent/5 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Connected to Google Calendar</p>
                      <p className="text-xs text-muted-foreground">user@example.com</p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Auto-create calendar events</span>
                    <Switch defaultChecked />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Export action items as tasks</span>
                    <Switch />
                  </label>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-600 bg-transparent"
                  onClick={() => {
                    setCalendarSync(false)
                    setShowCalendarSheet(false)
                  }}
                >
                  Disconnect Calendar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your calendar to automatically create events from meetings and export action items as tasks.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    setCalendarSync(true)
                    setShowCalendarSheet(false)
                  }}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
