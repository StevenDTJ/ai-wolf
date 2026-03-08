import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipForward, Square, StopCircle, Flag } from 'lucide-react';
import { DebateSession, DebateStage, DEBATE_FLOW } from '@/types';

interface DebateControlsProps {
  session: DebateSession;
  isLoading: boolean;
  currentStreamingContent: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStop: () => void;
  onSkip: () => void;
  // 8-Person mode props
  currentStageId?: number;
  onNextStage?: () => void;
}

export function DebateControls({
  session,
  isLoading,
  currentStreamingContent,
  onStart,
  onPause,
  onResume,
  onReset,
  onStop,
  onSkip,
  currentStageId,
  onNextStage,
}: DebateControlsProps) {
  const currentAgent = session.agents[session.currentAgentIndex];
  const isStreaming = currentStreamingContent.length > 0;
  const is8PersonMode = currentStageId !== undefined;

  // Get current stage info
  const currentStage: DebateStage | undefined = is8PersonMode
    ? DEBATE_FLOW.find(s => s.id === currentStageId)
    : undefined;

  // Get team color for Wolf style
  const getTeamColor = (team?: 'pro' | 'con' | 'judge') => {
    switch (team) {
      case 'pro': return { bg: '#6fc2ff', text: '#3e3d3c' };
      case 'con': return { bg: '#ff7169', text: '#3e3d3c' };
      case 'judge': return { bg: '#ffde00', text: '#3e3d3c' };
      default: return { bg: '#ede7e1', text: '#3e3d3c' };
    }
  };

  const speakerTeam = currentStage?.speakerTeam || currentAgent?.stance || 'pro';
  const speakerColor = getTeamColor(speakerTeam);

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar - Wolf Style */}
      {is8PersonMode && currentStage ? (
        /* 8-Person Mode Status */
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Flag className="w-3 h-3" style={{ color: '#5f5b57' }} />
            <span style={{ color: '#5f5b57' }}>阶段:</span>
            <span style={{ color: '#3e3d3c', fontWeight: 600 }}>{currentStage.id}/15</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#5f5b57' }}>环节:</span>
            <span style={{ color: '#3e3d3c', fontWeight: 600 }}>{currentStage.phaseLabel}</span>
            <span
              className="px-1.5 py-0.5 text-[0.5rem] font-mono uppercase"
              style={{
                backgroundColor: speakerColor.bg,
                color: speakerColor.text,
                border: '1px solid #454341',
              }}
            >
              {currentStage.speakerTeam === 'pro' ? '正方' : currentStage.speakerTeam === 'con' ? '反方' : '裁判'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#5f5b57' }}>当前:</span>
            <span style={{ color: '#3e3d3c', fontWeight: 600 }}>{currentStage.speechTypeLabel}</span>
          </div>
        </div>
      ) : (
        /* 2-Person Mode Status */
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span style={{ color: '#5f5b57' }}>回合:</span>
            <span style={{ color: '#3e3d3c', fontWeight: 600 }}>{session.currentTurn}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#5f5b57' }}>发言:</span>
            <span style={{ color: '#3e3d3c', fontWeight: 600 }}>
              {currentAgent?.name || '匿名辩手'}
            </span>
            <span
              className="px-1.5 py-0.5 text-[0.5rem] font-mono uppercase"
              style={{
                backgroundColor: speakerColor.bg,
                color: speakerColor.text,
                border: '1px solid #454341',
              }}
            >
              {currentAgent?.stance === 'pro' ? '正方' : currentAgent?.stance === 'con' ? '反方' : '裁判'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: '#5f5b57' }}>消息:</span>
            <span style={{ color: '#3e3d3c', fontWeight: 600 }}>{session.messages.length}</span>
          </div>
        </div>
      )}

      {/* Streaming indicator - Wolf Style */}
      {isStreaming && currentAgent && (
        <div
          className="wolf-debate-streaming inline-flex items-center gap-2 px-3 py-1.5"
          style={{ width: 'auto' }}
        >
          <span
            className="w-2 h-2"
            style={{ backgroundColor: speakerColor.bg }}
          />
          <span
            className="w-2 h-2"
            style={{ backgroundColor: speakerColor.bg }}
          />
          <span
            className="w-2 h-2"
            style={{ backgroundColor: speakerColor.bg }}
          />
          <span style={{ color: '#3e3d3c' }}>
            {is8PersonMode && currentStage ? currentStage.speechTypeLabel : `${currentAgent.name} 正在陈述观点...`}
          </span>
        </div>
      )}

      {/* Control buttons - Wolf Style */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {session.isRunning ? (
          <>
            <Button
              size="sm"
              onClick={onPause}
              disabled={isLoading || isStreaming}
              className="wolf-hard-shadow-button wolf-debate-control-secondary h-8 text-[0.58rem]"
            >
              <Pause className="w-3 h-3 mr-1" />
              暂停
            </Button>
            <Button
              size="sm"
              onClick={is8PersonMode && onNextStage ? onNextStage : onSkip}
              disabled={isLoading || isStreaming}
              className="wolf-hard-shadow-button wolf-debate-control-primary h-8 text-[0.58rem]"
            >
              {isLoading || isStreaming ? (
                <>
                  <Square className="w-3 h-3 mr-1 animate-pulse" />
                  生成中...
                </>
              ) : (
                <>
                  <SkipForward className="w-3 h-3 mr-1" />
                  {is8PersonMode ? '下一阶段' : '下一轮'}
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={onStop}
              disabled={!isLoading && !isStreaming}
              className="wolf-hard-shadow-button wolf-debate-control-danger h-8 text-[0.58rem]"
            >
              <StopCircle className="w-3 h-3 mr-1" />
              停止
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={onResume}
              disabled={isLoading || isStreaming}
              className="wolf-hard-shadow-button wolf-debate-control-primary h-8 text-[0.58rem]"
            >
              <Play className="w-3 h-3 mr-1" />
              继续
            </Button>
            <Button
              size="sm"
              onClick={is8PersonMode && onNextStage ? onNextStage : onSkip}
              disabled={isLoading || isStreaming}
              className="wolf-hard-shadow-button wolf-debate-control-secondary h-8 text-[0.58rem]"
              style={{ backgroundColor: '#fbf7f2' }}
            >
              <SkipForward className="w-3 h-3 mr-1" />
              {is8PersonMode ? '下一阶段' : '跳过'}
            </Button>
            <Button
              size="sm"
              onClick={onStop}
              disabled={!isLoading && !isStreaming}
              className="wolf-hard-shadow-button wolf-debate-control-danger h-8 text-[0.58rem]"
            >
              <StopCircle className="w-3 h-3 mr-1" />
              停止
            </Button>
          </>
        )}

        <Button
          size="sm"
          onClick={onReset}
          className="wolf-hard-shadow-button h-8 text-[0.58rem]"
          style={{
            backgroundColor: '#ede7e1',
            color: '#3e3d3c',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          重置
        </Button>
      </div>

      {/* Progress indicator - Wolf Style */}
      <div className="flex items-center justify-center gap-1.5">
        {session.agents.map((agent, index) => {
          const isActive = index === session.currentAgentIndex;
          const hasSpoken = session.messages.filter((m) => m.agentId === agent.id).length > 0;
          const agentTeamColor = getTeamColor(agent.stance as 'pro' | 'con' | 'judge');

          return (
            <div
              key={agent.id}
              className="transition-all"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: isActive ? agentTeamColor.bg : hasSpoken ? '#53dbc9' : '#ede7e1',
                border: '1px solid #454341',
                transform: isActive ? 'scale(1.3)' : 'scale(1)',
              }}
              title={agent.name}
            />
          );
        })}
      </div>
    </div>
  );
}
