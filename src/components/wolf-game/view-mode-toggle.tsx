// View Mode Toggle - Switch between player and director view
'use client';

import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'player' | 'director';
  onChange: (mode: 'player' | 'director') => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-slate-300 bg-white/70 p-1 shadow-sm">
      <Button
        variant={viewMode === 'player' ? 'default' : 'ghost'}
        size="sm"
        className={viewMode === 'player' ? 'bg-slate-900 text-amber-100 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}
        onClick={() => onChange('player')}
      >
        <Eye className="w-3 h-3 mr-1" />
        玩家视角
      </Button>
      <Button
        variant={viewMode === 'director' ? 'default' : 'ghost'}
        size="sm"
        className={viewMode === 'director' ? 'bg-slate-900 text-amber-100 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}
        onClick={() => onChange('director')}
      >
        <EyeOff className="w-3 h-3 mr-1" />
        导演视角
      </Button>
    </div>
  );
}
