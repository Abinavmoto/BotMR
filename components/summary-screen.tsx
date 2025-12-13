"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Share2,
  Download,
  CheckCircle2,
  Calendar,
  Save,
  X,
  Edit3,
  RefreshCw,
  FileText,
  File,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface SummaryScreenProps {
  onNavigate: (
    screen: "home" | "recording" | "processing" | "summary" | "paywall" | "settings" | "all-meetings",
  ) => void
}

export function SummaryScreen({ onNavigate }: SummaryScreenProps) {
  const [meetingTitle, setMeetingTitle] = useState("Q4 Planning Session")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [summaryText, setSummaryText] = useState(
    "Discussed Q4 objectives focusing on product launches and market expansion. Team agreed on three priority initiatives: mobile app redesign, customer retention program, and partnership development in APAC region.",
  )
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [editedSummaryText, setEditedSummaryText] = useState(summaryText)
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "txt" | "markdown">("pdf")
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    decisions: true,
    actionItems: true,
    transcript: false,
  })

  const handleSaveSummary = () => {
    setSummaryText(editedSummaryText)
    setIsEditingSummary(false)
  }

  const handleCancelSummary = () => {
    setEditedSummaryText(summaryText)
    setIsEditingSummary(false)
  }

  const handleRegenerateSummary = (style: string) => {
    console.log("[v0] Regenerating summary with style:", style)
    setShowRegenerateOptions(false)
    // In production, this would trigger AI regeneration
  }

  const handleDownload = () => {
    console.log("[v0] Downloading as:", downloadFormat, "with sections:", includeSections)
    setShowDownloadOptions(false)
    // In production, this would trigger the actual download
  }

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
            <Button variant="ghost" size="icon" onClick={() => setShowDownloadOptions(true)}>
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 py-6">
        {/* Meeting Title */}
        <div>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="text-3xl font-medium"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="mb-2 cursor-pointer text-3xl font-medium hover:text-muted-foreground"
              onClick={() => setIsEditingTitle(true)}
            >
              {meetingTitle}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">45 minutes • Today at 2:30 PM</p>
        </div>

        {/* Summary Section */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-accent/10 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              <h2 className="font-medium uppercase tracking-wide text-muted-foreground text-xs">Summary</h2>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => {
                  setEditedSummaryText(summaryText)
                  setIsEditingSummary(true)
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowRegenerateOptions(true)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {isEditingSummary ? (
            <div className="space-y-3">
              <Textarea
                value={editedSummaryText}
                onChange={(e) => setEditedSummaryText(e.target.value)}
                className="min-h-[100px] leading-relaxed"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={handleCancelSummary}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveSummary}>
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="leading-relaxed text-foreground">{summaryText}</p>
          )}
        </Card>

        {/* Summary Section */}

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

      {showRegenerateOptions && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowRegenerateOptions(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl border-t border-l border-r border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Regenerate Summary</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowRegenerateOptions(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Choose a style to regenerate the AI summary. Your manual edits will be preserved.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleRegenerateSummary("action-focused")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Action-focused
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleRegenerateSummary("detailed")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Detailed
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleRegenerateSummary("brief")}
              >
                <File className="mr-2 h-4 w-4" />
                Brief
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDownloadOptions && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowDownloadOptions(false)}
        >
          <div
            className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl border-t border-l border-r border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Download Meeting</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowDownloadOptions(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4 space-y-3">
              <p className="text-sm font-medium">Format</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={downloadFormat === "pdf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDownloadFormat("pdf")}
                >
                  PDF
                </Button>
                <Button
                  variant={downloadFormat === "txt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDownloadFormat("txt")}
                >
                  TXT
                </Button>
                <Button
                  variant={downloadFormat === "markdown" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDownloadFormat("markdown")}
                >
                  Markdown
                </Button>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium">Include Sections</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={includeSections.summary}
                    onCheckedChange={(checked) =>
                      setIncludeSections((prev) => ({ ...prev, summary: checked as boolean }))
                    }
                  />
                  <span className="text-sm">Summary</span>
                </label>
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={includeSections.decisions}
                    onCheckedChange={(checked) =>
                      setIncludeSections((prev) => ({ ...prev, decisions: checked as boolean }))
                    }
                  />
                  <span className="text-sm">Key Decisions</span>
                </label>
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={includeSections.actionItems}
                    onCheckedChange={(checked) =>
                      setIncludeSections((prev) => ({ ...prev, actionItems: checked as boolean }))
                    }
                  />
                  <span className="text-sm">Action Items</span>
                </label>
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={includeSections.transcript}
                    onCheckedChange={(checked) =>
                      setIncludeSections((prev) => ({ ...prev, transcript: checked as boolean }))
                    }
                  />
                  <span className="text-sm">Full Transcript</span>
                </label>
              </div>
            </div>

            <Button className="w-full" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download {downloadFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      )}
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

function ActionItem({ label, assignee, dueDate }: { label: string; assignee: string; dueDate?: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [text, setText] = useState(label)
  const [editedText, setEditedText] = useState(label)
  const [editedDueDate, setEditedDueDate] = useState(dueDate || "")

  const handleSave = () => {
    setText(editedText)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedText(text)
    setEditedDueDate(dueDate || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
        <Input
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="text-sm"
          placeholder="Action item..."
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            value={editedDueDate}
            onChange={(e) => setEditedDueDate(e.target.value)}
            className="h-8 text-xs"
            placeholder="Due date (optional)"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7 text-xs">
            <Save className="mr-1 h-3 w-3" />
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        className="mt-0.5 shrink-0"
        checked={isChecked}
        onCheckedChange={(checked) => setIsChecked(checked === true)}
      />
      <div className="flex-1 cursor-pointer" onClick={() => setIsEditing(true)}>
        <p className={`leading-relaxed ${isChecked ? "text-muted-foreground line-through" : ""}`}>{text}</p>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          <span>{assignee}</span>
          {dueDate && (
            <>
              <span>•</span>
              <span>Due {dueDate}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
