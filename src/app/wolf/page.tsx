'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { WolfGame } from '@/components/wolf-game';
import { useWolfGame } from '@/hooks/useWolfGame';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Settings2 } from 'lucide-react';

export default function WolfPage() {
  const wolf = useWolfGame();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        <main className="wolf-page-main relative z-10 overflow-hidden px-3 pb-3 pt-3 sm:px-4 lg:px-5">
          <div className="container flex h-full min-h-0 flex-col overflow-hidden">
            <WolfGame wolf={wolf} />
          </div>
        </main>

        {/* Settings Dialog - Wolf Style */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent
            className="max-w-md"
            style={{
              backgroundColor: '#fbf7f2',
              border: '2px solid #454341',
              borderRadius: 0,
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Enhanced Dialog Header - Console Style */}
            <div
              style={{
                borderBottom: '2px solid #454341',
                padding: '1rem',
                backgroundColor: '#3e3d3c',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#ffde00', border: '2px solid #454341' }}>
                  <Settings2 className="w-4 h-4" style={{ color: '#3e3d3c' }} />
                </div>
                <div>
                  <h2
                    className="font-mono uppercase text-sm tracking-wider"
                    style={{ color: '#f4efea', fontWeight: 600 }}
                  >
                    默认 API 设置
                  </h2>
                  <p className="text-[0.65rem] font-mono" style={{ color: '#ede7e1' }}>
                    为新玩家设置默认配置
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Field Group 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid #454341' }}>
                  <span className="text-[0.65rem] font-mono uppercase tracking-wider" style={{ color: '#5f5b57' }}>
                    连接配置
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>Base URL</label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    className="w-full h-10 px-3 text-sm"
                    style={{
                      backgroundColor: '#fbf7f2',
                      border: '2px solid #454341',
                      borderRadius: 0,
                      color: '#3e3d3c',
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>API Key</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full h-10 px-3 text-sm"
                    style={{
                      backgroundColor: '#fbf7f2',
                      border: '2px solid #454341',
                      borderRadius: 0,
                      color: '#3e3d3c',
                    }}
                  />
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3" style={{ backgroundColor: '#ede7e1', border: '1px solid #454341' }}>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#53dbc9', border: '1px solid #454341' }}>
                    <span style={{ color: '#3e3d3c', fontSize: '0.6rem' }}>i</span>
                  </div>
                  <p className="text-[0.65rem]" style={{ color: '#5f5b57' }}>
                    API Key 仅存储在浏览器本地，不会上传至任何服务器。
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
