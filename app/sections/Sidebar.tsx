'use client'

import { FiTarget, FiLayout, FiFileText } from 'react-icons/fi'
import { cn } from '@/lib/utils'

interface SidebarProps {
  activeView: 'dashboard' | 'reports'
  onNavigate: (view: 'dashboard' | 'reports') => void
  agentActive: boolean
}

const NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: FiLayout },
  { id: 'reports' as const, label: 'Reports', icon: FiFileText },
]

export default function Sidebar({ activeView, onNavigate, agentActive }: SidebarProps) {
  return (
    <aside className="w-[220px] min-h-screen border-r border-border bg-card flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <FiTarget className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm text-foreground">Lead Intelligence</span>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <div className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Agents</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('w-1.5 h-1.5 rounded-full', agentActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40')} />
            <span className="truncate">Lead Intelligence Manager</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span className="truncate">PDF Extractor</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span className="truncate">Company Research</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            <span className="truncate">Persona Scoring</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
