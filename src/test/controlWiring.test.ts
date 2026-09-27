import { describe, expect, it } from 'vitest';

const sources = import.meta.glob(['../App.tsx', '../components/*.tsx', '../pages/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

describe('visible button wiring', () => {
  it('does not ship a button without an explicit click handler or submit type', () => {
    const unwired: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      let cursor = 0;
      while (true) {
        const start = source.indexOf('<button', cursor);
        if (start < 0) break;
        const end = source.indexOf('</button>', start);
        const segment = source.slice(start, end < 0 ? source.length : end + '</button>'.length);
        if (!segment.includes('onClick=') && !/type=["']submit["']/.test(segment)) {
          const line = source.slice(0, start).split('\n').length;
          unwired.push(`${file}:${line}`);
        }
        cursor = end < 0 ? source.length : end + '</button>'.length;
      }
    }
    expect(unwired).toEqual([]);
  });
});
