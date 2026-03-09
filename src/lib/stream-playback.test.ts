import { describe, expect, it } from 'vitest';
import { getStreamingPlaybackPlan } from './stream-playback';

describe('getStreamingPlaybackPlan', () => {
  it('keeps small backlogs readable', () => {
    expect(getStreamingPlaybackPlan(18)).toEqual({
      chunkSize: 10,
      delayMs: 34,
    });
  });

  it('speeds up medium backlogs', () => {
    expect(getStreamingPlaybackPlan(90)).toEqual({
      chunkSize: 20,
      delayMs: 22,
    });
  });

  it('aggressively catches up on large backlogs', () => {
    expect(getStreamingPlaybackPlan(260)).toEqual({
      chunkSize: 54,
      delayMs: 12,
    });
  });
});
