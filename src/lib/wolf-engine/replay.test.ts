import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { replayFixture, ReplayFixture } from './replay';

const FIXTURE_DIR = join(process.cwd(), 'src/lib/wolf-engine/__fixtures__/golden');
const FIXTURE_FILES = [
  'night-witch-save.json',
  'hunter-day-kill.json',
  'tie-vote-no-elim.json',
];

describe('golden replay fixtures', () => {
  for (const file of FIXTURE_FILES) {
    it(`matches timeline for ${file}`, () => {
      const fixture = JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf-8')) as ReplayFixture;
      const timeline = replayFixture(fixture);
      expect(timeline).toEqual(fixture.expectedTimeline);
    });
  }
});
