'use client';

import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  viewMode: 'player' | 'director';
  onChange: (mode: 'player' | 'director') => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex w-full rounded-full border-2 border-[var(--wolf-border)] bg-[rgba(255,255,255,0.7)] p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex-1 rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--wolf-ink-soft)] hover:bg-[rgba(237,231,225,0.9)] hover:text-[var(--wolf-ink)]',
          viewMode === 'player' && 'bg-[var(--wolf-blue)] text-[var(--wolf-ink)] hover:bg-[var(--wolf-blue)]'
        )}
        onClick={() => onChange('player')}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        玩家视角
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex-1 rounded-full px-3.5 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--wolf-ink-soft)] hover:bg-[rgba(237,231,225,0.9)] hover:text-[var(--wolf-ink)]',
          viewMode === 'director' && 'bg-[var(--wolf-yellow)] text-[var(--wolf-ink)] hover:bg-[var(--wolf-yellow)]'
        )}
        onClick={() => onChange('director')}
      >
        <EyeOff className="mr-1.5 h-3.5 w-3.5" />
        导演视角
      </Button>
    </div>
  );
}
