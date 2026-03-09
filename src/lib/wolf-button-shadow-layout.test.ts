import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const headerSource = readFileSync('src/components/header.tsx', 'utf8');
const actionPanelSource = readFileSync('src/components/wolf-game/action-panel.tsx', 'utf8');
const globalsSource = readFileSync('src/app/globals.css', 'utf8');

describe('wolf hard shadow button interaction', () => {
  it('keeps the header action button on the shared hover-shadow class and in a visible overflow container', () => {
    // Wolf page uses utility-link with underline effect for the back button (same as settings button)
    expect(headerSource).toContain('utility-link');
    expect(headerSource).toContain('overflow-visible');
  });

  it('keeps action panel CTA buttons on the shared hover-shadow class', () => {
    expect(actionPanelSource).toContain('wolf-action-cta wolf-hard-shadow-button');
  });

  it('only reveals the black backplate shadow on hover/focus, not at rest', () => {
    expect(globalsSource).toContain('.wolf-hard-shadow-button {');
    expect(globalsSource).toContain('box-shadow: none !important;');
    expect(globalsSource).toContain('.wolf-hard-shadow-button:hover:not(:disabled),');
    expect(globalsSource).toContain('box-shadow: -4px 4px 0 0 #454341 !important;');
  });
});
