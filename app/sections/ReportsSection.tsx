'use client'

import React, { useState, useMemo } from 'react'
import { FiSearch, FiCalendar, FiFilter, FiFileText, FiUsers, FiLinkedin, FiChevronUp, FiChevronDown } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ReportData, Lead, MatchSummary } from './DashboardSection'

interface ReportsSectionProps {
  reports: ReportData[]
  showSample: boolean
  onToggleSample: (val: boolean) => void
}

function matchBadge(match: string) {
  const level = (match ?? '').toUpperCase()
  if (level === 'HIGH') return <Badge className="bg-[hsl(160,65%,40%)] text-white border-0 text-[11px] px-1.5 py-0">HIGH</Badge>
  if (level === 'MEDIUM') return <Badge className="bg-[hsl(35,80%,50%)] text-white border-0 text-[11px] px-1.5 py-0">MEDIUM</Badge>
  return <Badge className="bg-destructive text-destructive-foreground border-0 text-[11px] px-1.5 py-0">LOW</Badge>
}

const SAMPLE_REPORTS: ReportData[] = [
  {
    report_title: 'Q1 2025 Lead Intelligence Report',
    total_leads: 4,
    leads: [
      { name: 'Sarah Chen', position: 'VP of Engineering', company: 'TechFlow Inc', linkedin_url: 'https://linkedin.com/in/sarahchen', email: 'sarah@techflow.io', phone: '+1-555-0101', industry: 'SaaS / AI', employee_count: '250-500', company_description: 'AI-powered workflow automation.', tech_stack: 'Python, React, AWS', persona_match: 'HIGH', match_rationale: 'Strong AI/SaaS alignment.', competitors: ['LangChain', 'CrewAI'], scoring_factors: { role_fit: 'Excellent', company_size_fit: 'Ideal', industry_fit: 'Perfect', tech_stack_fit: 'Strong' } },
      { name: 'Marcus Rivera', position: 'CTO', company: 'DataBridge', linkedin_url: '', email: 'marcus@databridge.com', phone: '', industry: 'Data Analytics', employee_count: '100-250', company_description: 'Enterprise data integration.', tech_stack: 'Java, Spark', persona_match: 'MEDIUM', match_rationale: 'Good company fit.', competitors: ['Fivetran'], scoring_factors: { role_fit: 'Good', company_size_fit: 'Slightly below', industry_fit: 'Good', tech_stack_fit: 'Moderate' } },
      { name: 'Emily Watson', position: 'Head of Product', company: 'CloudNine', linkedin_url: '', email: 'emily@cloudnine.io', phone: '', industry: 'Cloud Infra', employee_count: '500-1000', company_description: 'Multi-cloud management.', tech_stack: 'Go, Terraform', persona_match: 'HIGH', match_rationale: 'Cloud-native product leader.', competitors: ['HashiCorp'], scoring_factors: { role_fit: 'Good', company_size_fit: 'Excellent', industry_fit: 'Strong', tech_stack_fit: 'Good' } },
      { name: 'David Park', position: 'Software Engineer', company: 'SmallApp Co', linkedin_url: '', email: 'david@smallapp.co', phone: '', industry: 'Consumer Mobile', employee_count: '10-50', company_description: 'Mobile gaming studio.', tech_stack: 'Swift, Unity', persona_match: 'LOW', match_rationale: 'Junior role at small company.', competitors: ['Supercell'], scoring_factors: { role_fit: 'Weak', company_size_fit: 'Too small', industry_fit: 'Poor', tech_stack_fit: 'Weak' } },
    ],
    match_summary: { high_count: 2, medium_count: 1, low_count: 1 },
    analysis_notes: 'Sample analysis report with 4 leads identified.',
    filename: 'sample_leads_q1.pdf',
    timestamp: '2025-03-01T10:30:00Z',
  },
  {
    report_title: 'Partner Outreach Leads Feb 2025',
    total_leads: 2,
    leads: [
      { name: 'Anna Li', position: 'Director of AI', company: 'NextGen Labs', linkedin_url: '', email: 'anna@nextgen.ai', phone: '', industry: 'AI Research', employee_count: '50-100', company_description: 'Applied AI research lab.', tech_stack: 'Python, PyTorch', persona_match: 'HIGH', match_rationale: 'Direct AI focus.', competitors: ['OpenAI'], scoring_factors: { role_fit: 'Excellent', company_size_fit: 'Good', industry_fit: 'Perfect', tech_stack_fit: 'Excellent' } },
      { name: 'Brian Scott', position: 'Sales Manager', company: 'TradeFlow', linkedin_url: '', email: 'brian@tradeflow.io', phone: '', industry: 'FinTech', employee_count: '200-500', company_description: 'Trading platform for institutions.', tech_stack: 'C++, React', persona_match: 'LOW', match_rationale: 'Sales role, not tech decision maker.', competitors: ['Bloomberg'], scoring_factors: { role_fit: 'Weak', company_size_fit: 'Good', industry_fit: 'Moderate', tech_stack_fit: 'Weak' } },
    ],
    match_summary: { high_count: 1, medium_count: 0, low_count: 1 },
    analysis_notes: 'Partner outreach batch - 2 leads processed.',
    filename: 'partner_outreach_feb.pdf',
    timestamp: '2025-02-15T14:00:00Z',
  },
]

export default function ReportsSection({ reports, showSample, onToggleSample }: ReportsSectionProps) {
  const [search, setSearch] = useState('')
  const [matchFilter, setMatchFilter] = useState<string>('all')
  const [expandedReport, setExpandedReport] = useState<number | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const displayReports = showSample ? SAMPLE_REPORTS : reports

  const filteredReports = useMemo(() => {
    return displayReports.filter(r => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        (r?.report_title ?? '').toLowerCase().includes(q) ||
        (r?.filename ?? '').toLowerCase().includes(q) ||
        (Array.isArray(r?.leads) && r.leads.some(l =>
          (l?.name ?? '').toLowerCase().includes(q) ||
          (l?.company ?? '').toLowerCase().includes(q) ||
          (l?.industry ?? '').toLowerCase().includes(q)
        ))
      if (!matchesSearch) return false
      if (matchFilter === 'all') return true
      if (!Array.isArray(r?.leads)) return false
      return r.leads.some(l => (l?.persona_match ?? '').toUpperCase() === matchFilter.toUpperCase())
    })
  }, [displayReports, search, matchFilter])

  function formatDate(ts: string) {
    if (!ts) return ''
    try { return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return ts }
  }

  function matchBar(summary: MatchSummary) {
    const total = (summary?.high_count ?? 0) + (summary?.medium_count ?? 0) + (summary?.low_count ?? 0)
    if (total === 0) return null
    const highPct = ((summary?.high_count ?? 0) / total) * 100
    const medPct = ((summary?.medium_count ?? 0) / total) * 100
    const lowPct = ((summary?.low_count ?? 0) / total) * 100
    return (
      <div className="flex h-1.5 rounded-full overflow-hidden w-full max-w-[120px]">
        {highPct > 0 && <div className="bg-[hsl(160,65%,40%)]" style={{ width: `${highPct}%` }} />}
        {medPct > 0 && <div className="bg-[hsl(35,80%,50%)]" style={{ width: `${medPct}%` }} />}
        {lowPct > 0 && <div className="bg-destructive" style={{ width: `${lowPct}%` }} />}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <h1 className="text-sm font-semibold text-foreground">Reports</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle-reports" className="text-xs text-muted-foreground">Sample Data</Label>
          <Switch id="sample-toggle-reports" checked={showSample} onCheckedChange={onToggleSample} />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search reports, leads, companies..."
            className="pl-7 h-7 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={matchFilter} onValueChange={setMatchFilter}>
          <SelectTrigger className="w-[130px] h-7 text-xs">
            <FiFilter className="w-3 h-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="All Matches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center">
              <FiFileText className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">{reports.length === 0 && !showSample ? 'No reports yet. Process a PDF from the Dashboard to create one.' : 'No reports match your filters.'}</p>
            </div>
          ) : (
            filteredReports.map((report, idx) => (
              <Card key={idx} className="shadow-none cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setExpandedReport(expandedReport === idx ? null : idx)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FiFileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">{report?.filename ?? 'Unknown file'}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(report?.timestamp ?? '')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><FiUsers className="w-3 h-3" />{report?.total_leads ?? 0} leads</span>
                        <span className="text-[hsl(160,65%,40%)]">{report?.match_summary?.high_count ?? 0}H</span>
                        <span className="text-[hsl(35,80%,50%)]">{report?.match_summary?.medium_count ?? 0}M</span>
                        <span className="text-destructive">{report?.match_summary?.low_count ?? 0}L</span>
                        {matchBar(report?.match_summary ?? { high_count: 0, medium_count: 0, low_count: 0 })}
                      </div>
                    </div>
                    {expandedReport === idx ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {expandedReport === idx && (
                    <div className="mt-3 border-t border-border pt-3">
                      {report?.report_title && <div className="text-xs font-medium mb-1">{report.report_title}</div>}
                      {report?.analysis_notes && <p className="text-[11px] text-muted-foreground mb-2">{report.analysis_notes}</p>}
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[11px] h-7">Name</TableHead>
                            <TableHead className="text-[11px] h-7">Position</TableHead>
                            <TableHead className="text-[11px] h-7">Company</TableHead>
                            <TableHead className="text-[11px] h-7">Industry</TableHead>
                            <TableHead className="text-[11px] h-7">Match</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(report?.leads) && report.leads
                            .filter(l => matchFilter === 'all' || (l?.persona_match ?? '').toUpperCase() === matchFilter.toUpperCase())
                            .map((lead, li) => (
                            <TableRow key={li} className="cursor-pointer hover:bg-secondary/50" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead) }}>
                              <TableCell className="py-1.5 text-xs font-medium">
                                <div className="flex items-center gap-1">
                                  {lead?.name ?? ''}
                                  {lead?.linkedin_url && (
                                    <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary">
                                      <FiLinkedin className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-1.5 text-xs text-muted-foreground">{lead?.position ?? ''}</TableCell>
                              <TableCell className="py-1.5 text-xs">{lead?.company ?? ''}</TableCell>
                              <TableCell className="py-1.5 text-xs text-muted-foreground">{lead?.industry ?? ''}</TableCell>
                              <TableCell className="py-1.5">{matchBadge(lead?.persona_match ?? 'LOW')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null) }}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-sm">{selectedLead?.name ?? 'Lead Details'}</SheetTitle>
            <SheetDescription className="text-xs">{selectedLead?.position ?? ''} at {selectedLead?.company ?? ''}</SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <div className="px-4 pb-4 space-y-3">
              <Separator />
              <div className="space-y-1.5 text-xs">
                <div><span className="text-muted-foreground">Email:</span> {selectedLead.email || 'N/A'}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedLead.phone || 'N/A'}</div>
                <div><span className="text-muted-foreground">Industry:</span> {selectedLead.industry || 'N/A'}</div>
                <div><span className="text-muted-foreground">Employees:</span> {selectedLead.employee_count || 'N/A'}</div>
                <div><span className="text-muted-foreground">Tech Stack:</span> {selectedLead.tech_stack || 'N/A'}</div>
                <div><span className="text-muted-foreground">Description:</span> {selectedLead.company_description || 'N/A'}</div>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Persona Match</span>
                  {matchBadge(selectedLead.persona_match)}
                </div>
                {selectedLead.match_rationale && <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-sm">{selectedLead.match_rationale}</p>}
              </div>
              {selectedLead.scoring_factors && (
                <div className="space-y-1">
                  {Object.entries(selectedLead.scoring_factors).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="text-muted-foreground capitalize min-w-[100px]">{k.replace(/_/g, ' ')}:</span>
                      <span className="text-foreground">{v ?? ''}</span>
                    </div>
                  ))}
                </div>
              )}
              {Array.isArray(selectedLead.competitors) && selectedLead.competitors.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Competitors</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedLead.competitors.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
