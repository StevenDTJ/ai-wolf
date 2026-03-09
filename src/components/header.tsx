'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
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
              className="inline-flex min-w-0 items-center rounded-none px-3 py-1 text-[0.98rem] font-extrabold leading-none text-white"
              style={{ backgroundColor: '#231f1d' }}
            >
              AI竞技场
            </div>
            <Badge
              variant="outline"
              className="h-[1.55rem] rounded-none border-[2px] border-[#454341] bg-[#fbf7f2] px-2 text-[0.62rem] text-[#3e3d3c]"
            >
              {isWolfPage ? '狼人杀模式' : 'AI 辩论'}
            </Badge>
          </div>

          {/* Right side navigation - Wolf mode link */}
          <div className="flex items-center gap-2 overflow-visible">
            {isWolfPage ? (
              // On wolf page: show return to debate link with settings button
              <>
                <Link
                  href="/"
                  className="utility-link text-[0.72rem] font-mono uppercase tracking-wide inline-flex items-center"
                  style={{ color: '#3e3d3c', lineHeight: '1.2' }}
                >
                  ←进入AI辩论
                </Link>
                {onSettingsClick && (
                  <>
                    <div className="w-[1px] h-4" style={{ backgroundColor: '#454341', opacity: 0.3 }} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSettingsClick}
                      className="utility-link text-[0.72rem] font-mono uppercase tracking-wide px-0 h-auto inline-flex items-center"
                      style={{ color: '#3e3d3c', lineHeight: '1.2' }}
                    >
                      设置
                    </Button>
                  </>
                )}
              </>
            ) : (
              // On debate page: show go to wolf mode link
              <Link
                href="/wolf"
                className="utility-link text-[0.72rem] font-mono uppercase tracking-wide inline-flex items-center"
                style={{ color: '#3e3d3c', lineHeight: '1.2' }}
              >
                进入狼人杀 →
              </Link>
            )}
            {!isWolfPage && onSettingsClick && (
              <>
                <div className="w-[1px] h-4" style={{ backgroundColor: '#454341', opacity: 0.3 }} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSettingsClick}
                  className="utility-link text-[0.72rem] font-mono uppercase tracking-wide px-0 h-auto inline-flex items-center"
                  style={{ color: '#3e3d3c', lineHeight: '1.2' }}
                >
                  设置
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}



