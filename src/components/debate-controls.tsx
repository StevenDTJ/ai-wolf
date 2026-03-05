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

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      {is8PersonMode && currentStage ? (
        /* 8-Person Mode Status */
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Flag className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">阶段:</span>
            <span className="text-foreground font-medium">{currentStage.id}/15</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">环节:</span>
            <span className="text-foreground font-medium">{currentStage.phaseLabel}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              currentStage.speakerTeam === 'pro'
                ? 'bg-blue-100 text-blue-700'
                : currentStage.speakerTeam === 'con'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {currentStage.speakerTeam === 'pro' ? '正方' : currentStage.speakerTeam === 'con' ? '反方' : '裁判'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">当前:</span>
            <span className="text-foreground font-medium">{currentStage.speechTypeLabel}</span>
          </div>
        </div>
      ) : (
        /* 2-Person Mode Status */
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">回合:</span>
            <span className="text-foreground font-medium">{session.currentTurn}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">发言:</span>
            <span className="text-foreground font-medium">
              {currentAgent?.name || '匿名辩手'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              currentAgent?.stance === 'pro'
                ? 'bg-blue-100 text-blue-700'
                : currentAgent?.stance === 'con'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {currentAgent?.stance === 'pro' ? '正方' : currentAgent?.stance === 'con' ? '反方' : '裁判'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">消息:</span>
            <span className="text-foreground font-medium">{session.messages.length}</span>
          </div>
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming && currentAgent && (
        <div className={`text-xs animate-pulse flex items-center gap-2 px-3 py-1.5 rounded-full ${
          is8PersonMode && currentStage
            ? currentStage.speakerTeam === 'pro'
              ? 'bg-blue-100 text-blue-700'
              : currentStage.speakerTeam === 'con'
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
            : currentAgent.stance === 'pro'
            ? 'bg-blue-100 text-blue-700'
            : currentAgent.stance === 'con'
            ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${
            is8PersonMode && currentStage
              ? currentStage.speakerTeam === 'pro'
                ? 'bg-blue-600'
                : currentStage.speakerTeam === 'con'
                ? 'bg-red-600'
                : 'bg-amber-600'
              : currentAgent.stance === 'pro'
              ? 'bg-blue-600'
              : currentAgent.stance === 'con'
              ? 'bg-red-600'
              : 'bg-amber-600'
          }`} />
          {is8PersonMode && currentStage ? currentStage.speechTypeLabel : `${currentAgent.name} 正在陈述观点...`}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {session.isRunning ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              disabled={isLoading || isStreaming}
            >
              <Pause className="w-4 h-4 mr-1" />
              暂停
            </Button>
            <Button
              size="sm"
              onClick={is8PersonMode && onNextStage ? onNextStage : onSkip}
              disabled={isLoading || isStreaming}
            >
              {isLoading || isStreaming ? (
                <>
                  <Square className="w-4 h-4 mr-1 animate-pulse" />
                  生成中...
                </>
              ) : (
                <>
                  <SkipForward className="w-4 h-4 mr-1" />
                  {is8PersonMode ? '下一阶段' : '下一轮'}
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              disabled={!isLoading && !isStreaming}
            >
              <StopCircle className="w-4 h-4 mr-1" />
              停止
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={onResume}
              disabled={isLoading || isStreaming}
            >
              <Play className="w-4 h-4 mr-1" />
              继续
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={is8PersonMode && onNextStage ? onNextStage : onSkip}
              disabled={isLoading || isStreaming}
            >
              <SkipForward className="w-4 h-4 mr-1" />
              {is8PersonMode ? '下一阶段' : '跳过'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              disabled={!isLoading && !isStreaming}
            >
              <StopCircle className="w-4 h-4 mr-1" />
              停止
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          重置
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {session.agents.map((agent, index) => {
          const isActive = index === session.currentAgentIndex;
          const hasSpoken = session.messages.filter((m) => m.agentId === agent.id).length > 0;

          return (
            <div
              key={agent.id}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                isActive
                  ? 'bg-primary scale-125'
                  : hasSpoken
                  ? 'bg-accent'
                  : 'bg-muted'
              }`}
              title={agent.name}
            />
          );
        })}
      </div>
    </div>
  );
}
