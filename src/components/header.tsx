import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm classic-shadow">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">AI辩论场</h1>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            v1.0
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSettingsClick} className="text-foreground">
            <Settings className="w-4 h-4 mr-2" />
            设置
          </Button>
        </div>
      </div>
    </header>
  );
}
