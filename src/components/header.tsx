'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const pathname = usePathname();
  const isWolfPage = pathname?.startsWith('/wolf');

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: '#ffde00',
        borderTop: '2px solid #454341',
        borderBottom: '2px solid #454341',
      }}
    >
      <div className="mx-auto w-full max-w-[1600px] overflow-visible px-4">
        <div className="flex min-h-[46px] items-center justify-between gap-3 overflow-visible px-0 py-1 sm:px-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="inline-flex min-w-0 items-center rounded-full px-3 py-1 text-[0.98rem] font-extrabold leading-none text-white"
              style={{ backgroundColor: '#231f1d' }}
            >
              AI竞技场
            </div>
            <Badge
              variant="outline"
              className="h-[1.55rem] rounded-full border-[2px] border-[#454341] bg-[#fbf7f2] px-2 text-[0.62rem] text-[#3e3d3c]"
            >
              {isWolfPage ? '狼人杀模式' : 'AI 辩论'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 overflow-visible">
            {isWolfPage ? (
              <Button
                variant="outline"
                size="sm"
                className="wolf-header-action wolf-hard-shadow-button h-8 rounded-none border-[2px] border-[#454341] bg-[#fbf7f2] px-3 text-[0.72rem] font-mono uppercase tracking-[0.08em] text-[#3e3d3c]"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回 AI 辩论
                </Link>
              </Button>
            ) : onSettingsClick ? (
              <Button variant="ghost" size="sm" onClick={onSettingsClick} className="utility-link gap-2 px-0 text-[hsl(40_25%_12%)] hover:bg-transparent">
                <Settings className="h-4 w-4" />
                设置
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}



