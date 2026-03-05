'use client';

import { WolfPlayer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Pencil } from 'lucide-react';

interface WolfPlayerCardProps {
  player: WolfPlayer;
  index: number;
  isCurrentSpeaker?: boolean;
  showIdentity?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}

export function WolfPlayerCard({
  player,
  index,
  isCurrentSpeaker = false,
  showIdentity = false,
  onRemove,
  onEdit,
}: WolfPlayerCardProps) {
  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'villager': '村民',
      'werewolf': '狼人',
      'seer': '预言家',
      'witch': '女巫',
      'hunter': '猎人',
    };
    return roleMap[role] || role;
  };

  const getBackgroundColor = () => {
    if (!showIdentity) return 'bg-gray-50 border-gray-200';
    if (player.role === 'werewolf') return 'bg-red-50 border-red-200';
    if (['seer','witch','hunter'].includes(player.role)) return 'bg-purple-50 border-purple-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getRoleBadge = () => {
    if (!showIdentity) return null;
    if (player.role === 'werewolf') {
      return (
        <Badge variant="destructive" className="text-xs">
          狼人
        </Badge>
      );
    }
    if (player.role === 'seer') {
      return (
        <Badge variant="default" className="bg-purple-500 text-xs">
          预言家
        </Badge>
      );
    }
        if (player.role === 'witch') {
      return (
        <Badge variant="default" className="bg-pink-500 text-xs">
          女巫
        </Badge>
      );
    }
    if (player.role === 'hunter') {
      return (
        <Badge variant="default" className="bg-amber-500 text-xs">
          猎人
        </Badge>
      );
    }    return (
      <Badge variant="default" className="bg-blue-500 text-xs">
        村民
      </Badge>
    );
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${
        isCurrentSpeaker ? 'ring-2 ring-green-500 ring-offset-2' : ''
      } ${getBackgroundColor()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {player.playerNumber}号 {player.name}
            </span>
            {getRoleBadge()}
          </div>

          {showIdentity ? (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                模型: {player.model}
              </p>
              {player.apiKey ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  API已配置
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                  缺少API Key
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                模型: {player.model}
              </p>
              {player.apiKey ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  API已配置
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                  缺少API Key
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onEdit}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {isCurrentSpeaker && (
        <div className="mt-2 pt-2 border-t border-green-200">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            正在发言
          </span>
        </div>
      )}
    </div>
  );
}




