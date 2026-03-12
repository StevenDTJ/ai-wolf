import { AgentConfig, STANCE_INFO } from '@/types';
import { GripVertical } from 'lucide-react';

interface AgentCardProps {
  agent: AgentConfig;
  index: number;
  variant?: 'default' | 'compact' | 'stage';
  onEdit: (agent: AgentConfig) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
}

export function AgentCard({
  agent,
  index,
  variant = 'default',
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
}: AgentCardProps) {
  const hasApiKey = agent.apiKey && agent.apiKey.trim().length > 0;
  const stanceInfo = STANCE_INFO[agent.stance];

  // Wolf-style stance badge colors
  const getStanceBadgeStyle = () => {
    switch (agent.stance) {
      case 'pro':
        return {
          bg: '#53dbc9',
          text: '#3e3d3c',
        };
      case 'con':
        return {
          bg: '#ff7169',
          text: '#3e3d3c',
        };
      case 'judge':
        return {
          bg: '#ff9538',
          text: '#3e3d3c',
        };
      default:
        return {
          bg: '#ede7e1',
          text: '#3e3d3c',
        };
    }
  };

  const stanceStyle = getStanceBadgeStyle();

  if (variant === 'compact') {
    return (
      <div
        className="wolf-debate-agent-card relative group cursor-pointer p-2.5"
        draggable={Boolean(onDragStart)}
        onDragStart={(e) => onDragStart?.(e, index)}
        onDragOver={(e) => onDragOver?.(e)}
        onDrop={(e) => onDrop?.(e, index)}
        role="button"
        tabIndex={0}
        onClick={() => onEdit(agent)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onEdit(agent);
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: '#5f5b57' }} />
              <span className="text-[0.72rem] font-medium truncate" style={{ color: '#3e3d3c' }}>
                {agent.name || '未命名辩手'}
              </span>
              <span
                className="shrink-0 font-mono text-[0.5rem] uppercase tracking-wider px-1.5 py-0.5"
                style={{ backgroundColor: stanceStyle.bg, color: stanceStyle.text, border: '1px solid rgba(69,67,65,0.82)' }}
              >
                {stanceInfo.label}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[0.52rem] font-mono" style={{ color: '#5f5b57' }}>
              <span className="truncate max-w-[120px]" title={agent.model}>
                {agent.model}
              </span>
              <span style={{ color: hasApiKey ? '#53dbc9' : '#ff9538' }}>{hasApiKey ? '已配置' : '未配置'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'stage') {
    const isCon = agent.stance === 'con';
    return (
      <button
        type="button"
        className={`debate-stage-float-card transition-transform duration-150 hover:-translate-y-0.5 ${isCon ? 'debate-stage-float-card-con' : 'debate-stage-float-card-pro'}`}
        style={{
          backgroundColor: stanceStyle.bg,
          color: stanceStyle.text,
          border: '2px solid #454341',
          borderRadius: 0,
          textAlign: isCon ? 'right' : 'left',
        }}
        onClick={() => onEdit(agent)}
      >
        <div className="debate-stage-float-card-label">{stanceInfo.label}</div>
        <div className="debate-stage-float-card-name">{agent.name || '未命名角色'}</div>
        <div className="debate-stage-float-card-meta">
          <span className="debate-stage-float-card-key">MODEL</span>
          <span className="debate-stage-float-card-value" title={agent.model}>
            {agent.model}
          </span>
        </div>
        <div className="debate-stage-float-card-meta">
          <span className="debate-stage-float-card-key">STATUS</span>
          <span className="debate-stage-float-card-value">
            {hasApiKey ? '已配置' : '未配置'}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className="wolf-debate-agent-card relative group cursor-pointer p-3"
      draggable={Boolean(onDragStart)}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => onDragOver?.(e)}
      onDrop={(e) => onDrop?.(e, index)}
      role="button"
      tabIndex={0}
      onClick={() => onEdit(agent)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onEdit(agent);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 shrink-0" style={{ color: '#5f5b57' }} />
          <span
            className="text-sm font-medium truncate"
            style={{ color: '#3e3d3c' }}
          >
            {agent.name || '未命名辩手'}
          </span>
        </div>
        <span
          className="shrink-0 font-mono text-[0.56rem] uppercase tracking-wider px-2 py-0.5"
          style={{
            backgroundColor: stanceStyle.bg,
            color: stanceStyle.text,
            border: '1px solid #454341',
          }}
        >
          {stanceInfo.label}
        </span>
      </div>

      {/* Info section - Wolf style */}
      <div
        className="p-2 space-y-1.5"
        style={{
          backgroundColor: '#ede7e1',
          border: '1px solid rgba(69,67,65,0.18)',
        }}
      >
        <div className="flex items-center justify-between text-[0.62rem]">
          <span className="font-mono uppercase tracking-wider" style={{ color: '#5f5b57' }}>模型</span>
          <span
            className="font-mono text-[0.58rem] truncate max-w-[150px]"
            style={{ color: '#3e3d3c' }}
            title={agent.model}
          >
            {agent.model}
          </span>
        </div>
        <div className="flex items-center justify-between text-[0.62rem]">
          <span className="font-mono uppercase tracking-wider" style={{ color: '#5f5b57' }}>API</span>
          <span
            className="font-mono text-[0.58rem]"
            style={{ color: hasApiKey ? '#53dbc9' : '#ff9538' }}
          >
            {hasApiKey ? '已配置' : '未配置'}
          </span>
        </div>
      </div>

    </div>
  );
}
