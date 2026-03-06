import { describe, expect, it } from 'vitest';
import { canPromote } from './promotion';

describe('canPromote', () => {
  it('rejects promotion when release gate fails or uplift < 5%', () => {
    expect(canPromote({ uplift: 0.03, gatePassed: true })).toBe(false);
    expect(canPromote({ uplift: 0.08, gatePassed: false })).toBe(false);
  });
});
