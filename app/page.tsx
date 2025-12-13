"use client"

import { useState } from "react"
import { HomeScreen } from "@/components/home-screen"
import { RecordingScreen } from "@/components/recording-screen"
import { ProcessingScreen } from "@/components/processing-screen"
import { SummaryScreen } from "@/components/summary-screen"
import { PaywallScreen } from "@/components/paywall-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { AllMeetingsScreen } from "@/components/all-meetings-screen"

export default function BotMRApp() {
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "recording" | "processing" | "summary" | "paywall" | "settings" | "all-meetings"
  >("home")

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        {currentScreen === "home" && <HomeScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "recording" && <RecordingScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "processing" && <ProcessingScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "summary" && <SummaryScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "paywall" && <PaywallScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "settings" && <SettingsScreen onNavigate={setCurrentScreen} />}
        {currentScreen === "all-meetings" && <AllMeetingsScreen onNavigate={setCurrentScreen} />}
      </div>
    </div>
  )
}
