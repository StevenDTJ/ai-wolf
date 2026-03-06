// Engine-to-UI Event Adapter
// Converts WolfGameState transitions into UiEventV1 events

import { createUiEvent, type UiEventV1 } from './uiEvents';
import type { WolfGameState } from './types';
import type { WolfGameStatus } from '@/types';

// Map status to display text
const STATUS_TEXT_MAP: Record<WolfGameStatus, { public: string; director?: string }> = {
  waiting: { public: '等待游戏开始' },
  night: { public: '夜晚降临' },
  night_witch: { public: '女巫行动阶段' },
  night_seer: { public: '预言家行动阶段' },
  night_werewolf: { public: '狼人行动阶段' },
  werewolf_chat: { public: '狼人密聊中' },
  day: { public: '白天讨论阶段' },
  day_speech: { public: '白天发言阶段' },
  voting: { public: '投票阶段' },
  ended: { public: '游戏结束' },
};

// Detect state changes and generate UI events
export function deriveUiEvents(
  prev: WolfGameState,
  next: WolfGameState
): UiEventV1[] {
  const events: UiEventV1[] = [];

  // Round started (new round)
  if (next.currentRound > prev.currentRound) {
    const phase = next.status === 'night' ? 'night' : 'day';
    events.push(
      createUiEvent('round_started', {
        gameId: next.id,
        round: next.currentRound,
        phase,
        publicText: `第 ${next.currentRound} 天开始`,
        directorText: `第 ${next.currentRound} 天 - ${phase === 'night' ? '夜晚' : '白天'}阶段`,
      })
    );
  }

  // Phase changed (status change)
  if (prev.status !== next.status) {
    const statusText = STATUS_TEXT_MAP[next.status] || { public: next.status };
    events.push(
      createUiEvent('phase_changed', {
        gameId: next.id,
        round: next.currentRound,
        previousStatus: prev.status,
        currentStatus: next.status,
        publicText: statusText.public,
        directorText: statusText.director,
      })
    );
  }

  // Player eliminated
  if (next.eliminatedPlayerId && !prev.eliminatedPlayerId) {
    const eliminatedPlayer = next.players.find(p => p.id === next.eliminatedPlayerId);
    if (eliminatedPlayer) {
      events.push(
        createUiEvent('player_eliminated', {
          gameId: next.id,
          round: next.currentRound,
          playerId: eliminatedPlayer.id,
          playerName: eliminatedPlayer.name,
          reason: 'voted_out',
          publicText: `${eliminatedPlayer.name} 被投票出局`,
          directorText: `${eliminatedPlayer.name} (${eliminatedPlayer.role}) 被投票出局`,
        })
      );
    }
  }

  // Check for players that became dead
  prev.players.forEach(prevPlayer => {
    const nextPlayer = next.players.find(p => p.id === prevPlayer.id);
    if (prevPlayer.isAlive && nextPlayer && !nextPlayer.isAlive && next.eliminatedPlayerId !== prevPlayer.id) {
      events.push(
        createUiEvent('player_eliminated', {
          gameId: next.id,
          round: next.currentRound,
          playerId: prevPlayer.id,
          playerName: prevPlayer.name,
          reason: 'wolf_kill',
          publicText: `昨夜死亡：${prevPlayer.name}`,
          directorText: `${prevPlayer.name} (${prevPlayer.role}) 被狼人击杀`,
        })
      );
    }
  });

  // Night action events
  if (next.nightAction.killedId && prev.nightAction.killedId !== next.nightAction.killedId) {
    const killedPlayer = next.players.find(p => p.id === next.nightAction.killedId);
    if (killedPlayer) {
      const wasBlocked = next.nightAction.healedId === killedPlayer.id;
      events.push(
        createUiEvent('night_action', {
          gameId: next.id,
          round: next.currentRound,
          actionType: 'wolf_kill',
          targetId: killedPlayer.id,
          targetName: killedPlayer.name,
          result: wasBlocked ? 'blocked' : 'success',
          publicText: wasBlocked ? '昨夜是平安夜' : `昨夜死亡：${killedPlayer.name}`,
          directorText: wasBlocked
            ? `狼人刀向 ${killedPlayer.name} (${killedPlayer.role})，被女巫解药阻止`
            : `狼人击杀了 ${killedPlayer.name} (${killedPlayer.role})`,
        })
      );
    }
  }

  if (next.nightAction.checkResult && prev.nightAction.checkResult !== next.nightAction.checkResult) {
    const checkedPlayer = next.players.find(p => p.id === next.nightAction.checkedId);
    if (checkedPlayer) {
      const isEvil = next.nightAction.checkResult === 'evil';
      events.push(
        createUiEvent('night_action', {
          gameId: next.id,
          round: next.currentRound,
          actionType: 'seer_check',
          targetId: checkedPlayer.id,
          targetName: checkedPlayer.name,
          result: 'success',
          publicText: '夜晚行动已结算',
          directorText: `预言家查验 ${checkedPlayer.name} 为 ${isEvil ? '狼人' : '好人'}`,
        })
      );
    }
  }

  // Vote events
  if (next.votes.length > prev.votes.length) {
    const newVotes = next.votes.slice(prev.votes.length);
    newVotes.forEach(vote => {
      events.push(
        createUiEvent('vote_cast', {
          gameId: next.id,
          round: next.currentRound,
          voterId: vote.voterId,
          voterName: vote.voterName,
          targetId: vote.targetId,
          targetName: vote.targetName,
          publicText: `${vote.voterName} 投票给 ${vote.targetName}`,
        })
      );
    });
  }

  // Vote result
  if (Object.keys(next.votingResults).length > 0 &&
      JSON.stringify(next.votingResults) !== JSON.stringify(prev.votingResults) &&
      next.status !== 'voting') {
    const maxVotes = Math.max(...Object.values(next.votingResults));
    const topVoted = Object.entries(next.votingResults)
      .filter(([, votes]) => votes === maxVotes)
      .map(([playerId, votes]) => {
        const player = next.players.find(p => p.id === playerId);
        return { playerId, playerName: player?.name || playerId, votes };
      });

    if (topVoted.length === 1) {
      events.push(
        createUiEvent('vote_result', {
          gameId: next.id,
          round: next.currentRound,
          eliminatedPlayerId: topVoted[0].playerId,
          eliminatedPlayerName: topVoted[0].playerName,
          votes: next.votingResults,
          publicText: `${topVoted[0].playerName} 获得 ${maxVotes} 票被投出`,
        })
      );
    } else {
      events.push(
        createUiEvent('vote_result', {
          gameId: next.id,
          round: next.currentRound,
          tiedPlayers: topVoted,
          votes: next.votingResults,
          publicText: `投票平局: ${topVoted.map(p => p.playerName).join(', ')}`,
        })
      );
    }
  }

  // Game ended
  if (next.status === 'ended' && prev.status !== 'ended' && next.winner) {
    const goodWins = next.winner === 'good' ? 1 : 0;
    const evilWins = next.winner === 'evil' ? 1 : 0;

    events.push(
      createUiEvent('game_ended', {
        gameId: next.id,
        winner: next.winner,
        finalRound: next.currentRound,
        publicText: `游戏结束，${next.winner === 'good' ? '好人' : '狼人'}获胜`,
        directorText: `游戏结束 - ${next.winner === 'good' ? '好人阵营' : '狼人阵营'}获胜`,
        summary: {
          goodWins,
          evilWins,
          totalRounds: next.currentRound,
        },
      })
    );
  }

  return events;
}
