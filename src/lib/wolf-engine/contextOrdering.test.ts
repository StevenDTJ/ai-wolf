import { describe, it, expect } from 'vitest';
import { orderPublicInfo } from './context';

describe('orderPublicInfo', () => {
  it('orders by round asc, then timestamp asc', () => {
    const events = [
      { round: 2, timestamp: 20, type: 'speech', content: 'b' },
      { round: 1, timestamp: 30, type: 'vote', content: 'c' },
      { round: 1, timestamp: 10, type: 'broadcast', content: 'a' },
    ];
    const ordered = orderPublicInfo(events);
    expect(ordered.map(e => e.timestamp)).toEqual([10, 30, 20]);
  });
});
