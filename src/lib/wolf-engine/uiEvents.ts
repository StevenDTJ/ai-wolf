export type UiEventType =
  | 'round_started'
  | 'phase_changed'
  | 'player_eliminated'
  | 'vote_cast'
  | 'vote_result'
  | 'night_action'
  | 'message_added'
  | 'game_ended';

export type UiEventV1<TData extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  type: UiEventType;
  timestamp: number;
  data: TData;
};

export function createUiEvent<TData extends Record<string, unknown>>(type: UiEventType, data: TData): UiEventV1<TData> {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    data,
  };
}
