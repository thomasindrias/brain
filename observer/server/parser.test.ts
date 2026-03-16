import { describe, it, expect } from 'vitest';
import { parseKeyValue, parseNeuroTable } from './parser';
import type { NeuroLevels } from '../src/lib/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('parseKeyValue', () => {
  it('parses single-line key-value pairs', () => {
    const input = `
[INTENT]: Query system status
[USER_TONE]: Neutral
[OUTPUT_FORMAT]: Structured report
    `.trim();

    const result = parseKeyValue(input);

    expect(result).toEqual({
      INTENT: 'Query system status',
      USER_TONE: 'Neutral',
      OUTPUT_FORMAT: 'Structured report',
    });
  });

  it('parses multi-line values', () => {
    const input = `
[BLUEPRINT]:
1. Read system logs
2. Analyze error patterns
3. Generate report
4. Send to user

[NEXT_ACTION]: Execute blueprint
    `.trim();

    const result = parseKeyValue(input);

    expect(result.BLUEPRINT).toContain('1. Read system logs');
    expect(result.BLUEPRINT).toContain('2. Analyze error patterns');
    expect(result.BLUEPRINT).toContain('3. Generate report');
    expect(result.BLUEPRINT).toContain('4. Send to user');
    expect(result.NEXT_ACTION).toBe('Execute blueprint');
  });

  it('returns empty object for empty input', () => {
    const result = parseKeyValue('');
    expect(result).toEqual({});
  });

  it('handles values containing colons', () => {
    const input = `
[ERROR]: Error at line 5: unexpected token
[TIMESTAMP]: 2024-03-16T10:30:00
    `.trim();

    const result = parseKeyValue(input);

    expect(result.ERROR).toBe('Error at line 5: unexpected token');
    expect(result.TIMESTAMP).toBe('2024-03-16T10:30:00');
  });

  it('trims whitespace from keys and values', () => {
    const input = `
[KEY_ONE]:   Value with leading spaces
[KEY_TWO]: Value with trailing spaces
    `.trim();

    const result = parseKeyValue(input);

    expect(result.KEY_ONE).toBe('Value with leading spaces');
    expect(result.KEY_TWO).toBe('Value with trailing spaces');
  });

  it('ignores markdown headers and blank lines', () => {
    const input = `
# Signal Buffer Output

[FIELD_ONE]: Value one

## Subsection

[FIELD_TWO]: Value two
    `.trim();

    const result = parseKeyValue(input);

    expect(result).toEqual({
      FIELD_ONE: 'Value one',
      FIELD_TWO: 'Value two',
    });
    expect(Object.keys(result)).not.toContain('#');
    expect(Object.keys(result)).not.toContain('##');
  });

  it('handles multi-line values until next field marker', () => {
    const input = `
[DESCRIPTION]:
This is a longer description
that spans multiple lines
and should be captured together

[STATUS]: Complete
    `.trim();

    const result = parseKeyValue(input);

    expect(result.DESCRIPTION).toContain('This is a longer description');
    expect(result.DESCRIPTION).toContain('that spans multiple lines');
    expect(result.DESCRIPTION).toContain('and should be captured together');
    expect(result.STATUS).toBe('Complete');
  });
});

describe('parseNeuroTable', () => {
  it('parses markdown table with neuromodulator levels', () => {
    const input = `
| **Noradrenaline** | HIGH | Heightened attention |
| **Acetylcholine** | MEDIUM | Normal learning rate |
| **Serotonin** | LOW | Reduced constraint |
| **Dopamine** | HIGH | Strong motivation |
    `.trim();

    const result = parseNeuroTable(input);

    expect(result).toEqual({
      noradrenaline: 'HIGH',
      acetylcholine: 'MEDIUM',
      serotonin: 'LOW',
      dopamine: 'HIGH',
    });
  });

  it('returns default levels for empty input', () => {
    const result = parseNeuroTable('');

    expect(result).toEqual({
      noradrenaline: 'MEDIUM',
      acetylcholine: 'MEDIUM',
      serotonin: 'MEDIUM',
      dopamine: 'MEDIUM',
    });
  });

  it('handles table rows without bold markers', () => {
    const input = `
| Noradrenaline | HIGH | Effect text |
| Acetylcholine | LOW | Effect text |
| Serotonin | MEDIUM | Effect text |
| Dopamine | HIGH | Effect text |
    `.trim();

    const result = parseNeuroTable(input);

    expect(result.noradrenaline).toBe('HIGH');
    expect(result.acetylcholine).toBe('LOW');
    expect(result.serotonin).toBe('MEDIUM');
    expect(result.dopamine).toBe('HIGH');
  });

  it('handles table with header row', () => {
    const input = `
| **Name** | Level | Effect |
|----------|-------|--------|
| **Noradrenaline** | HIGH | Heightened attention |
| **Acetylcholine** | MEDIUM | Normal learning |
| **Serotonin** | LOW | Reduced constraint |
| **Dopamine** | MEDIUM | Normal motivation |
    `.trim();

    const result = parseNeuroTable(input);

    expect(result).toEqual({
      noradrenaline: 'HIGH',
      acetylcholine: 'MEDIUM',
      serotonin: 'LOW',
      dopamine: 'MEDIUM',
    });
  });

  it('returns defaults for malformed table', () => {
    const input = 'Not a table at all';
    const result = parseNeuroTable(input);

    expect(result).toEqual({
      noradrenaline: 'MEDIUM',
      acetylcholine: 'MEDIUM',
      serotonin: 'MEDIUM',
      dopamine: 'MEDIUM',
    });
  });

  it('handles case-insensitive neuromodulator names', () => {
    const input = `
| **noradrenaline** | HIGH | Effect |
| **ACETYLCHOLINE** | LOW | Effect |
| **SeRoToNiN** | MEDIUM | Effect |
| **DoPaMiNe** | HIGH | Effect |
    `.trim();

    const result = parseNeuroTable(input);

    expect(result.noradrenaline).toBe('HIGH');
    expect(result.acetylcholine).toBe('LOW');
    expect(result.serotonin).toBe('MEDIUM');
    expect(result.dopamine).toBe('HIGH');
  });
});

describe('parseKeyValue with fixture files', () => {
  const fixturesDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'test', 'fixtures');

  it('parses signal-amygdala-safe.md', async () => {
    const content = await fs.readFile(path.join(fixturesDir, 'signal-amygdala-safe.md'), 'utf-8');
    const result = parseKeyValue(content);

    expect(result.THREAT_LEVEL).toBe('SAFE');
    expect(result.THREAT_TYPE).toBe('NONE');
    expect(result.EMOTIONAL_VALENCE).toBe('+1');
    expect(result.RECOMMENDED_ACTION).toBe('proceed');
  });

  it('parses signal-amygdala-elevated.md', async () => {
    const content = await fs.readFile(path.join(fixturesDir, 'signal-amygdala-elevated.md'), 'utf-8');
    const result = parseKeyValue(content);

    expect(result.THREAT_LEVEL).toBe('ELEVATED');
    expect(result.THREAT_TYPE).toBe('potential_code_injection');
    expect(result.EMOTIONAL_VALENCE).toBe('-2');
    expect(result.RECOMMENDED_ACTION).toBe('re-analyze');
    expect(result.CONTEXT).toContain('eval()');
  });

  it('parses motor-plan-multiline.md with multiline values', async () => {
    const content = await fs.readFile(path.join(fixturesDir, 'motor-plan-multiline.md'), 'utf-8');
    const result = parseKeyValue(content);

    expect(result.APPROACH).toBe('Direct implementation');
    expect(result.STEP_BY_STEP_BLUEPRINT).toContain('1. Read the target file');
    expect(result.STEP_BY_STEP_BLUEPRINT).toContain('2. Identify the function to modify');
    expect(result.STEP_BY_STEP_BLUEPRINT).toContain('5. Commit if tests pass');
    expect(result.CONFIDENCE).toBe('HIGH');
    expect(result.ESTIMATED_COMPLEXITY).toBe('LOW');
  });
});

describe('parseNeuroTable with fixture files', () => {
  const fixturesDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'test', 'fixtures');

  it('parses state-neuromodulators.md', async () => {
    const content = await fs.readFile(path.join(fixturesDir, 'state-neuromodulators.md'), 'utf-8');
    const result = parseNeuroTable(content);

    expect(result.noradrenaline).toBe('LOW');
    expect(result.acetylcholine).toBe('MEDIUM');
    expect(result.serotonin).toBe('HIGH');
    expect(result.dopamine).toBe('MEDIUM');
  });
});
