'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { WolfGame } from '@/components/wolf-game';
import { useWolfGame } from '@/hooks/useWolfGame';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export default function WolfPage() {
  const wolf = useWolfGame();
  const currentStatus = wolf.session?.status;
  const isNightPhase = currentStatus?.startsWith('night') || currentStatus === 'werewolf_chat';

  return (
    <div className="wolf-theme min-h-screen flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div
          className={`wolf-ambient-orb absolute -top-28 -left-20 h-72 w-72 rounded-full blur-3xl ${
            isNightPhase
              ? 'bg-blue-500/25 shadow-[0_0_80px_rgba(59,130,246,0.35)]'
              : 'bg-cyan-400/20 shadow-[0_0_80px_rgba(34,211,238,0.3)]'
          }`}
        />
        <div
          className={`wolf-ambient-orb absolute top-1/3 -right-20 h-80 w-80 rounded-full blur-3xl ${
            isNightPhase
              ? 'bg-indigo-500/20 shadow-[0_0_80px_rgba(99,102,241,0.28)]'
              : 'bg-amber-400/25 shadow-[0_0_80px_rgba(251,191,36,0.35)]'
          }`}
        />
      </div>

      <Header />

      <div className="wolf-theme-topbar py-3 px-4 relative z-10">
        <div className="container flex items-center justify-center gap-4">
          <span className="text-slate-100/80 text-sm tracking-wide">选择游戏模式：</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-white border-white/40 hover:bg-white/15 bg-transparent" asChild>
              <Link href="/">
                <MessageSquare className="w-4 h-4 mr-2" />
                AI辩论
              </Link>
            </Button>
            <Button variant="default" size="sm" className="bg-amber-200 text-slate-900 hover:bg-amber-100 shadow-sm">
              狼人杀
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 container py-6 px-4 relative z-10">
        <div className="h-[calc(100vh-12rem)] rounded-2xl border border-slate-200/30 bg-white/10 p-4 backdrop-blur-[1px]">
          <WolfGame wolf={wolf} />
        </div>
      </main>
    </div>
  );
}
