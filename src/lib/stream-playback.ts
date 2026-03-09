export interface StreamingPlaybackPlan {
  chunkSize: number;
  delayMs: number;
}

export function getStreamingPlaybackPlan(backlog: number): StreamingPlaybackPlan {
  if (backlog >= 220) {
    return { chunkSize: 54, delayMs: 12 };
  }

  if (backlog >= 80) {
    return { chunkSize: 20, delayMs: 22 };
  }

  return { chunkSize: 10, delayMs: 34 };
}
