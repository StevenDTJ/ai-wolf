'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPlayerStateMeta } from '@/lib/wolf-game-ui';
import { cn } from '@/lib/utils';
import { WolfPlayer } from '@/types';
import {
  EyeIcon,
  FlaskConical,
  ShieldCheck,
  Skull,
  Sword,
  Trash2,
  User,
} from 'lucide-react';

interface WolfPlayerCardProps {
  player: WolfPlayer;
  isCurrentSpeaker?: boolean;
  showIdentity?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}

const ROLE_CONFIG = {
  villager: { label: '村民', icon: User, badgeClass: 'border-[2px] border-[#454341] bg-[#53dbc9] text-[#173f3a]' },
  werewolf: { label: '狼人', icon: Skull, badgeClass: 'border-[2px] border-[#454341] bg-[#ff7169] text-[#69211d]' },
  seer: { label: '预言家', icon: EyeIcon, badgeClass: 'border-[2px] border-[#454341] bg-[#6fc2ff] text-[#17496a]' },
  witch: { label: '女巫', icon: FlaskConical, badgeClass: 'border-[2px] border-[#454341] bg-[#ff9538] text-[#7c4109]' },
  hunter: { label: '猎人', icon: Sword, badgeClass: 'border-[2px] border-[#454341] bg-[#ffde00] text-[#5d4f00]' },
} as const;

const EMPHASIS_CLASS_MAP = {
  focus: 'wolf-player-card-focus',
  alive: 'wolf-player-card-alive',
  warning: 'wolf-player-card-warning',
  out: 'wolf-player-card-out',
} as const;

export function WolfPlayerCard({ player, isCurrentSpeaker = false, showIdentity = false, onRemove, onEdit }: WolfPlayerCardProps) {
  const role = ROLE_CONFIG[player.role] || ROLE_CONFIG.villager;
  const RoleIcon = role.icon;
  const stateMeta = getPlayerStateMeta(player, { isCurrentSpeaker, showIdentity });
  const configured = Boolean(player.apiKey && player.model);
  const isEliminated = stateMeta.emphasis === 'out';

  return (
    <article
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onClick={onEdit}
      onKeyDown={onEdit ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onEdit();
        }
      } : undefined}
      className={cn(
        'group relative overflow-hidden rounded-none border px-3 py-2 transition-[transform,border-color,box-shadow,background-color] duration-200 hover:translate-x-[2px] hover:-translate-y-[2px]',
        onEdit && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#454341] focus-visible:ring-offset-2',
        EMPHASIS_CLASS_MAP[stateMeta.emphasis],
        isEliminated && 'border-[#454341] bg-[#111111] text-[#f5efe6]'
      )}
    >
      <div className="grid gap-2">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
          <span className={cn('wolf-seat-pill', isEliminated && 'border-[#f5efe6] bg-[#f5efe6] text-[#111111]')}>#{player.playerNumber}</span>
          <div className="min-w-0">
            <div className={cn('truncate text-[12px] font-semibold leading-4 text-[#3e3d3c]', isEliminated && 'text-[#f5efe6]')}>{player.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="outline" className={cn('gap-1 rounded-none px-2 py-0.5 text-[9px] font-medium', isEliminated ? 'border-[2px] border-[#8a7a2f] bg-[#1a1a1a] text-[#f8d84a]' : role.badgeClass)}>
                <RoleIcon className="h-3 w-3" />
                {showIdentity ? role.label : '身份未公开'}
              </Badge>
              <Badge variant="outline" className={cn('rounded-none border-[2px] border-[#454341] bg-[var(--panel)] px-2 py-0.5 text-[9px] text-[#3e3d3c]', isEliminated && 'bg-[#1a1a1a] text-[#f5efe6]')}>
                {stateMeta.stateLabel}
              </Badge>
            </div>
          </div>
          {onRemove ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn('h-7 w-7 shrink-0 rounded-none border-[2px] border-[#454341] bg-[var(--panel)] text-[#69211d] hover:bg-[#ff7169] hover:text-[#69211d]', isEliminated && 'bg-[#1a1a1a] text-[#f5efe6] hover:bg-[#2a2a2a] hover:text-[#f5efe6]')}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              aria-label={`移除 ${player.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : <div />}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className={cn('wolf-player-meta-row rounded-none min-w-0', isEliminated && 'border-[#454341] bg-[#1a1a1a]')}>
            <span className={cn('wolf-player-meta-label', isEliminated && 'text-[#c8beb3]')}>模型</span>
            <span className={cn('block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[9px] text-[#3e3d3c]', isEliminated && 'text-[#f5efe6]')}>
              {player.model || '未设置'}
            </span>
          </div>
          <div className={cn('wolf-player-meta-row rounded-none min-w-[74px] px-2.5', isEliminated && 'border-[#454341] bg-[#1a1a1a]')}>
            <span className={cn('wolf-player-meta-label', isEliminated && 'text-[#c8beb3]')}>配置</span>
            <span className={cn('inline-flex items-center gap-1 text-[9px] font-medium', isEliminated ? 'text-[#f5efe6]' : configured ? 'text-[#173f3a]' : 'text-[#69211d]')}>
              <ShieldCheck className="h-3 w-3" />
              {configured ? '完成' : '待补全'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
