import { describe, expect, it } from 'vitest';
import { extractContentFromResponse } from './useDebate';

describe('extractContentFromResponse', () => {
  it('reads standard non-stream chat completion content', () => {
    expect(
      extractContentFromResponse({
        choices: [
          {
            message: {
              content: 'hello world',
            },
          },
        ],
      })
    ).toBe('hello world');
  });

  it('reads block-array message content from compatibility providers', () => {
    expect(
      extractContentFromResponse({
        choices: [
          {
            message: {
              content: [
                { type: 'text', text: 'first part ' },
                { type: 'text', text: 'second part' },
              ],
            },
          },
        ],
      })
    ).toBe('first part second part');
  });

  it('falls back to reasoning content when message content is empty', () => {
    expect(
      extractContentFromResponse({
        choices: [
          {
            message: {
              reasoning_content: 'reasoning only response',
            },
          },
        ],
      })
    ).toBe('reasoning only response');
  });
});
