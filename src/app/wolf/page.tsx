'use client';

import { Header } from '@/components/header';
import { WolfGame } from '@/components/wolf-game';
import { useWolfGame } from '@/hooks/useWolfGame';

export default function WolfPage() {
  const wolf = useWolfGame();

  return (
    <>
      <style jsx global>{`
        .wolf-square-theme,
        .wolf-square-theme *,
        .wolf-square-theme *::before,
        .wolf-square-theme *::after,
        .wolf-dialog-square,
        .wolf-dialog-square *,
        .wolf-dialog-square *::before,
        .wolf-dialog-square *::after {
          border-radius: 0 !important;
        }
      `}</style>
      <div className="wolf-square-theme wolf-theme wolf-theme-day wolf-app-shell relative overflow-hidden">
        <Header />
        <main className="wolf-page-main relative z-10 overflow-hidden px-3 pb-3 pt-3 sm:px-4 lg:px-5">
          <div className="container flex h-full min-h-0 flex-col overflow-hidden">
            <WolfGame wolf={wolf} />
          </div>
        </main>
      </div>
    </>
  );
}
