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
    <div className="flex gap-1">
      <Button
        variant={viewMode === 'player' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('player')}
      >
        <Eye className="w-3 h-3 mr-1" />
        玩家视角
      </Button>
      <Button
        variant={viewMode === 'director' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('director')}
      >
        <EyeOff className="w-3 h-3 mr-1" />
        导演视角
      </Button>
    </div>
  );
}
