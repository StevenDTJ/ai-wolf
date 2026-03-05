'use client';

import { WolfMessage } from '@/types';

interface WolfMessageBubbleProps {
  message: WolfMessage;
  isCurrent?: boolean;
}

export function WolfMessageBubble({ message, isCurrent }: WolfMessageBubbleProps) {
  const getTypeLabel = () => {
    if (message.type === 'wolf_chat') return '狼人密聊';
    if (message.type === 'inner_thought') return '内心戏';
    return '发言';
  };

  const getTypeColor = () => {
    if (message.type === 'wolf_chat') return 'bg-red-50 border-red-200 text-red-900';
    if (message.type === 'inner_thought') return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    return 'bg-white border-gray-200';
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 ${getTypeColor()} ${
        isCurrent ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm">{message.playerName}</span>
        <span className="text-xs text-muted-foreground">{getTypeLabel()}</span>
      </div>
      <p className="text-sm">{message.content}</p>
    </div>
  );
}
