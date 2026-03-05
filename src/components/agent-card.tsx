import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentConfig, STANCE_INFO } from '@/types';
import { Edit, Trash2, GripVertical } from 'lucide-react';

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

  // 立场徽章样式 - 蓝色(正方)、红色(反方)、金色(裁判)
  const getStanceBadgeStyle = () => {
    switch (agent.stance) {
      case 'pro':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'con':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'judge':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card
      className="relative group cursor-move border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all classic-shadow"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            <CardTitle className="text-sm font-medium truncate text-foreground">
              {agent.name || '未命名辩手'}
            </CardTitle>
          </div>
          <Badge className={`shrink-0 ${getStanceBadgeStyle()}`}>
            {stanceInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Info section */}
        <div className="bg-muted/50 rounded-md p-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">模型</span>
            <span className="text-foreground font-mono text-xs truncate max-w-[150px]" title={agent.model}>
              {agent.model}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">API</span>
            <span className={hasApiKey ? 'text-green-600' : 'text-yellow-600'}>
              {hasApiKey ? '已配置' : '未配置'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(agent)}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(agent.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
