'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import Sidebar from './sections/Sidebar'
import DashboardSection from './sections/DashboardSection'
import ReportsSection from './sections/ReportsSection'
import type { ReportData } from './sections/DashboardSection'

const MANAGER_AGENT_ID = '69a4d6669df18c326fa9b61c'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [activeView, setActiveView] = useState<'dashboard' | 'reports'>('dashboard')
  const [reports, setReports] = useState<ReportData[]>([])
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentActive, setAgentActive] = useState(false)
  const [showSample, setShowSample] = useState(false)

  const handleProcessFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setAgentActive(true)

    try {
      // Step 1: Upload the PDF
      const uploadResult = await uploadFiles(file)
      if (!uploadResult.success || !Array.isArray(uploadResult.asset_ids) || uploadResult.asset_ids.length === 0) {
        setError(uploadResult?.error ?? 'Failed to upload file. Please try again.')
        setLoading(false)
        setAgentActive(false)
        return
      }

      // Step 2: Call the manager agent with asset IDs
      const result = await callAIAgent(
        'Extract all leads from this PDF, research the companies, and score each lead for Lyzr fit. Return the complete lead intelligence report.',
        MANAGER_AGENT_ID,
        { assets: uploadResult.asset_ids }
      )

      if (result.success) {
        // Parse the response using parseLLMJson
        const parsed = parseLLMJson(result.response)
        const data = parsed?.result || parsed

        const reportData: ReportData = {
          report_title: data?.report_title ?? 'Lead Intelligence Report',
          total_leads: typeof data?.total_leads === 'number' ? data.total_leads : (Array.isArray(data?.leads) ? data.leads.length : 0),
          leads: Array.isArray(data?.leads) ? data.leads : [],
          match_summary: {
            high_count: typeof data?.match_summary?.high_count === 'number' ? data.match_summary.high_count : 0,
            medium_count: typeof data?.match_summary?.medium_count === 'number' ? data.match_summary.medium_count : 0,
            low_count: typeof data?.match_summary?.low_count === 'number' ? data.match_summary.low_count : 0,
          },
          analysis_notes: data?.analysis_notes ?? '',
          filename: file.name,
          timestamp: new Date().toISOString(),
        }

        setCurrentReport(reportData)
        setReports(prev => [reportData, ...prev])
        setShowSample(false)
      } else {
        setError(result?.error ?? 'Agent processing failed. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setAgentActive(false)
    }
  }, [])

  const handleToggleSample = useCallback((val: boolean) => {
    setShowSample(val)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex font-sans">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          agentActive={agentActive}
        />
        {activeView === 'dashboard' ? (
          <DashboardSection
            currentReport={currentReport}
            loading={loading}
            error={error}
            onProcessFile={handleProcessFile}
            showSample={showSample}
            onToggleSample={handleToggleSample}
          />
        ) : (
          <ReportsSection
            reports={reports}
            showSample={showSample}
            onToggleSample={handleToggleSample}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
