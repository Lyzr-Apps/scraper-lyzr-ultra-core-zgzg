'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { FiUploadCloud, FiUsers, FiTrendingUp, FiMinus, FiTrendingDown, FiX, FiChevronUp, FiChevronDown, FiExternalLink, FiMail, FiPhone, FiLinkedin, FiInfo } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface Lead {
  name: string
  position: string
  company: string
  linkedin_url: string
  email: string
  phone: string
  industry: string
  employee_count: string
  company_description: string
  tech_stack: string
  persona_match: string
  match_rationale: string
  competitors: string[]
  scoring_factors: {
    role_fit: string
    company_size_fit: string
    industry_fit: string
    tech_stack_fit: string
  }
}

export interface MatchSummary {
  high_count: number
  medium_count: number
  low_count: number
}

export interface ReportData {
  report_title: string
  total_leads: number
  leads: Lead[]
  match_summary: MatchSummary
  analysis_notes: string
  filename: string
  timestamp: string
}

interface DashboardSectionProps {
  currentReport: ReportData | null
  loading: boolean
  error: string | null
  onProcessFile: (file: File) => void
  showSample: boolean
  onToggleSample: (val: boolean) => void
}

const SAMPLE_LEADS: Lead[] = [
  { name: 'Sarah Chen', position: 'VP of Engineering', company: 'TechFlow Inc', linkedin_url: 'https://linkedin.com/in/sarahchen', email: 'sarah@techflow.io', phone: '+1-555-0101', industry: 'SaaS / AI', employee_count: '250-500', company_description: 'AI-powered workflow automation platform for enterprise teams.', tech_stack: 'Python, React, AWS, Kubernetes', persona_match: 'HIGH', match_rationale: 'Strong role fit as VP Eng at a mid-size AI SaaS company actively adopting agent frameworks.', competitors: ['LangChain', 'CrewAI'], scoring_factors: { role_fit: 'Excellent - decision maker for AI tooling', company_size_fit: 'Ideal mid-market segment', industry_fit: 'Perfect - AI/SaaS vertical', tech_stack_fit: 'Strong Python ecosystem alignment' } },
  { name: 'Marcus Rivera', position: 'CTO', company: 'DataBridge Solutions', linkedin_url: 'https://linkedin.com/in/mrivera', email: 'marcus@databridge.com', phone: '+1-555-0202', industry: 'Data Analytics', employee_count: '100-250', company_description: 'Enterprise data integration and analytics platform.', tech_stack: 'Java, Spark, Azure, PostgreSQL', persona_match: 'MEDIUM', match_rationale: 'Good company fit but tech stack is Java-heavy, may need migration support.', competitors: ['Fivetran', 'Airbyte'], scoring_factors: { role_fit: 'Good - C-level tech decision maker', company_size_fit: 'Slightly below ideal range', industry_fit: 'Good - data/analytics adjacent', tech_stack_fit: 'Moderate - primarily Java stack' } },
  { name: 'Emily Watson', position: 'Head of Product', company: 'CloudNine Systems', linkedin_url: 'https://linkedin.com/in/emilyw', email: 'emily@cloudnine.io', phone: '+1-555-0303', industry: 'Cloud Infrastructure', employee_count: '500-1000', company_description: 'Multi-cloud management and optimization platform.', tech_stack: 'Go, Terraform, AWS/GCP/Azure', persona_match: 'HIGH', match_rationale: 'Product leader at cloud infra company, strong fit for AI agent deployment use cases.', competitors: ['HashiCorp', 'Pulumi'], scoring_factors: { role_fit: 'Good - product influence on tech adoption', company_size_fit: 'Excellent - enterprise segment', industry_fit: 'Strong - cloud/DevOps vertical', tech_stack_fit: 'Good - cloud-native orientation' } },
  { name: 'David Park', position: 'Software Engineer', company: 'SmallApp Co', linkedin_url: 'https://linkedin.com/in/dpark', email: 'david@smallapp.co', phone: '+1-555-0404', industry: 'Consumer Mobile', employee_count: '10-50', company_description: 'Mobile gaming studio focused on casual games.', tech_stack: 'Swift, Unity, Firebase', persona_match: 'LOW', match_rationale: 'Junior role at a small consumer mobile company, low enterprise AI adoption likelihood.', competitors: ['Supercell', 'Zynga'], scoring_factors: { role_fit: 'Weak - IC not decision maker', company_size_fit: 'Too small for enterprise sales', industry_fit: 'Poor - consumer mobile gaming', tech_stack_fit: 'Weak - mobile-focused stack' } },
]

const SAMPLE_REPORT: ReportData = {
  report_title: 'Q1 2025 Lead Intelligence Report',
  total_leads: 4,
  leads: SAMPLE_LEADS,
  match_summary: { high_count: 2, medium_count: 1, low_count: 1 },
  analysis_notes: 'Analysis identified 4 leads from the uploaded PDF. Two leads show high persona match with strong AI/SaaS alignment. One medium match may convert with targeted outreach. One low-priority lead in consumer mobile.',
  filename: 'sample_leads.pdf',
  timestamp: '2025-03-01T10:30:00Z',
}

type SortKey = 'name' | 'company' | 'industry' | 'employee_count' | 'persona_match'
type SortDir = 'asc' | 'desc'

function matchBadge(match: string) {
  const level = (match ?? '').toUpperCase()
  if (level === 'HIGH') return <Badge className="bg-[hsl(160,65%,40%)] text-white border-0 text-[11px] px-1.5 py-0">HIGH</Badge>
  if (level === 'MEDIUM') return <Badge className="bg-[hsl(35,80%,50%)] text-white border-0 text-[11px] px-1.5 py-0">MEDIUM</Badge>
  return <Badge className="bg-destructive text-destructive-foreground border-0 text-[11px] px-1.5 py-0">LOW</Badge>
}

export default function DashboardSection({ currentReport, loading, error, onProcessFile, showSample, onToggleSample }: DashboardSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reportData = showSample ? SAMPLE_REPORT : currentReport

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') setSelectedFile(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const leads = useMemo(() => {
    const list = Array.isArray(reportData?.leads) ? [...reportData.leads] : []
    list.sort((a, b) => {
      const aVal = (a?.[sortKey] ?? '') as string
      const bVal = (b?.[sortKey] ?? '') as string
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [reportData, sortKey, sortDir])

  const summary = reportData?.match_summary ?? { high_count: 0, medium_count: 0, low_count: 0 }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <FiChevronDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
          <Switch id="sample-toggle" checked={showSample} onCheckedChange={onToggleSample} />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Upload Area */}
          <div className="flex gap-3 items-start">
            <Card className="flex-1 shadow-none">
              <CardContent className="p-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                  <FiUploadCloud className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Drop PDF here or click to upload</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">.pdf files only</p>
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between mt-2 px-2 py-1 bg-secondary rounded-sm">
                    <span className="text-xs text-foreground truncate max-w-[200px]">{selectedFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }} className="text-muted-foreground hover:text-foreground">
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Button
              onClick={() => { if (selectedFile) onProcessFile(selectedFile) }}
              disabled={!selectedFile || loading}
              className="h-auto py-3 px-4 text-xs"
            >
              {loading ? <><Spinner className="mr-1.5 w-3 h-3" /> Processing...</> : 'Extract & Analyze'}
            </Button>
          </div>

          {error && (
            <Card className="shadow-none border-destructive">
              <CardContent className="p-3 text-xs text-destructive">{error}</CardContent>
            </Card>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="shadow-none">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center"><FiUsers className="w-3.5 h-3.5 text-primary" /></div>
                <div><div className="text-[10px] text-muted-foreground">Total Leads</div><div className="text-lg font-semibold leading-tight">{reportData?.total_leads ?? 0}</div></div>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-[hsl(160,65%,40%)]/10 flex items-center justify-center"><FiTrendingUp className="w-3.5 h-3.5 text-[hsl(160,65%,40%)]" /></div>
                <div><div className="text-[10px] text-muted-foreground">High Match</div><div className="text-lg font-semibold leading-tight text-[hsl(160,65%,40%)]">{summary.high_count ?? 0}</div></div>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-[hsl(35,80%,50%)]/10 flex items-center justify-center"><FiMinus className="w-3.5 h-3.5 text-[hsl(35,80%,50%)]" /></div>
                <div><div className="text-[10px] text-muted-foreground">Medium Match</div><div className="text-lg font-semibold leading-tight text-[hsl(35,80%,50%)]">{summary.medium_count ?? 0}</div></div>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-destructive/10 flex items-center justify-center"><FiTrendingDown className="w-3.5 h-3.5 text-destructive" /></div>
                <div><div className="text-[10px] text-muted-foreground">Low Match</div><div className="text-lg font-semibold leading-tight text-destructive">{summary.low_count ?? 0}</div></div>
              </CardContent>
            </Card>
          </div>

          {/* Report Title & Notes */}
          {reportData?.report_title && (
            <Card className="shadow-none">
              <CardContent className="p-3">
                <div className="text-sm font-semibold text-foreground">{reportData.report_title}</div>
                {reportData.analysis_notes && <p className="text-xs text-muted-foreground mt-1">{reportData.analysis_notes}</p>}
              </CardContent>
            </Card>
          )}

          {/* Lead Table */}
          <Card className="shadow-none">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-sm" />)}
                </div>
              ) : leads.length === 0 ? (
                <div className="py-12 text-center">
                  <FiUsers className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Upload a PDF to extract and analyze leads</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] h-8 cursor-pointer select-none" onClick={() => handleSort('name')}>
                        <span className="flex items-center gap-1">Name <SortIcon col="name" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] h-8">Position</TableHead>
                      <TableHead className="text-[11px] h-8 cursor-pointer select-none" onClick={() => handleSort('company')}>
                        <span className="flex items-center gap-1">Company <SortIcon col="company" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] h-8 cursor-pointer select-none" onClick={() => handleSort('industry')}>
                        <span className="flex items-center gap-1">Industry <SortIcon col="industry" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] h-8 cursor-pointer select-none" onClick={() => handleSort('employee_count')}>
                        <span className="flex items-center gap-1">Employees <SortIcon col="employee_count" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] h-8 cursor-pointer select-none" onClick={() => handleSort('persona_match')}>
                        <span className="flex items-center gap-1">Match <SortIcon col="persona_match" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] h-8">Competitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, idx) => (
                      <TableRow key={idx} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedLead(lead)}>
                        <TableCell className="py-2 text-xs font-medium">
                          <div className="flex items-center gap-1.5">
                            {lead?.name ?? ''}
                            {lead?.linkedin_url && (
                              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:text-primary/80">
                                <FiLinkedin className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">{lead?.position ?? ''}</TableCell>
                        <TableCell className="py-2 text-xs">{lead?.company ?? ''}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">{lead?.industry ?? ''}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">{lead?.employee_count ?? ''}</TableCell>
                        <TableCell className="py-2">{matchBadge(lead?.persona_match ?? 'LOW')}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(lead?.competitors) && lead.competitors.map((c, ci) => (
                              <span key={ci} className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground rounded-sm">{c}</span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null) }}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-sm">{selectedLead?.name ?? 'Lead Details'}</SheetTitle>
            <SheetDescription className="text-xs">{selectedLead?.position ?? ''} at {selectedLead?.company ?? ''}</SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <div className="px-4 pb-4 space-y-4">
              <Separator />
              {/* Contact Info */}
              <div>
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Contact</h4>
                <div className="space-y-1.5">
                  {selectedLead.linkedin_url && (
                    <a href={selectedLead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                      <FiLinkedin className="w-3 h-3" /> {selectedLead.linkedin_url}
                    </a>
                  )}
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-xs text-foreground"><FiMail className="w-3 h-3 text-muted-foreground" /> {selectedLead.email}</div>
                  )}
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-xs text-foreground"><FiPhone className="w-3 h-3 text-muted-foreground" /> {selectedLead.phone}</div>
                  )}
                </div>
              </div>
              <Separator />
              {/* Company Details */}
              <div>
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Company Details</h4>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-muted-foreground">Industry:</span> <span className="text-foreground">{selectedLead.industry}</span></div>
                  <div><span className="text-muted-foreground">Employees:</span> <span className="text-foreground">{selectedLead.employee_count}</span></div>
                  <div><span className="text-muted-foreground">Tech Stack:</span> <span className="text-foreground">{selectedLead.tech_stack}</span></div>
                  {selectedLead.company_description && (
                    <div className="mt-1"><span className="text-muted-foreground">Description:</span> <span className="text-foreground">{selectedLead.company_description}</span></div>
                  )}
                </div>
              </div>
              <Separator />
              {/* Persona Scoring */}
              <div>
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Persona Scoring</h4>
                <div className="flex items-center gap-2 mb-2">
                  {matchBadge(selectedLead.persona_match)}
                </div>
                {selectedLead.match_rationale && (
                  <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-sm">{selectedLead.match_rationale}</p>
                )}
              </div>
              {/* Scoring Factors */}
              {selectedLead.scoring_factors && (
                <div>
                  <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Scoring Factors</h4>
                  <div className="space-y-1.5">
                    {Object.entries(selectedLead.scoring_factors).map(([key, val]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="text-muted-foreground capitalize min-w-[100px]">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-foreground">{val ?? ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              {/* Competitors */}
              {Array.isArray(selectedLead.competitors) && selectedLead.competitors.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Competitors</h4>
                  <div className="flex flex-wrap gap-1">
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
