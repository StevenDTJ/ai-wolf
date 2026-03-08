import { AgentConfig, STANCE_INFO } from '@/types';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from './ui/button';

interface AgentCardProps {
  agent: AgentConfig;
  index: number;
  onEdit: (agent: AgentConfig) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function AgentCard({
  agent,
  index,
  onEdit,
  onDelete,
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
          bg: '#6fc2ff',
          text: '#3e3d3c',
        };
      case 'con':
        return {
          bg: '#ff7169',
          text: '#3e3d3c',
        };
      case 'judge':
        return {
          bg: '#ffde00',
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

  return (
    <div
      className="wolf-debate-agent-card relative group cursor-move p-3"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
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

      {/* Action buttons - Wolf style */}
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          onClick={() => onEdit(agent)}
          className="flex-1 wolf-hard-shadow-button h-7 text-[0.54rem] font-mono uppercase"
          style={{
            backgroundColor: '#fbf7f2',
            color: '#3e3d3c',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          <Edit className="w-3 h-3 mr-1" />
          编辑
        </Button>
        <Button
          size="sm"
          onClick={() => onDelete(agent.id)}
          className="wolf-hard-shadow-button h-7 px-2"
          style={{
            backgroundColor: '#fbf7f2',
            color: '#ff7169',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
