import type { NeuroLevels } from '../src/lib/types';
import { DEFAULT_NEURO_LEVELS } from '../src/lib/constants';

/**
 * Parses key-value pairs from markdown buffer files.
 *
 * Handles:
 * - Single-line values: [KEY]: value
 * - Multi-line values: captures lines until next [KEY]: marker
 * - Ignores markdown headers (#, ##) and blank lines
 * - Preserves values with colons
 *
 * @param content - Raw markdown content from buffer file
 * @returns Object mapping field names to their values
 */
export function parseKeyValue(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  let currentKey: string | null = null;
  let currentValue: string[] = [];

  // Regex to match field markers: [FIELD_NAME]: value
  const fieldRegex = /^\[([A-Z_]+)\]:\s*(.*)/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip markdown headers, table separators, and blank lines
    if (
      trimmedLine.startsWith('#') ||
      trimmedLine.startsWith('|') ||
      trimmedLine.startsWith('---') ||
      trimmedLine === ''
    ) {
      continue;
    }

    // Check if this line starts a new field
    const match = trimmedLine.match(fieldRegex);

    if (match) {
      // Save previous field if it exists
      if (currentKey) {
        result[currentKey] = currentValue.join('\n').trim();
      }

      // Start new field
      currentKey = match[1];
      currentValue = match[2] ? [match[2]] : [];
    } else if (currentKey) {
      // This is a continuation line for the current field
      currentValue.push(trimmedLine);
    }
  }

  // Don't forget to save the last field
  if (currentKey) {
    result[currentKey] = currentValue.join('\n').trim();
  }

  return result;
}

/**
 * Parses neuromodulator levels from a markdown table.
 *
 * Expected format:
 * | **Noradrenaline** | HIGH | Effect description |
 * | **Acetylcholine** | MEDIUM | Effect description |
 * | **Serotonin** | LOW | Effect description |
 * | **Dopamine** | MEDIUM | Effect description |
 *
 * @param content - Raw markdown table content
 * @returns NeuroLevels object with current levels
 */
export function parseNeuroTable(content: string): NeuroLevels {
  const result: NeuroLevels = { ...DEFAULT_NEURO_LEVELS };

  if (!content || content.trim() === '') {
    return result;
  }

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines, header separators, and header row
    if (
      trimmedLine === '' ||
      trimmedLine.startsWith('|---') ||
      trimmedLine.toLowerCase().includes('| **name**') ||
      trimmedLine.toLowerCase().includes('| name |')
    ) {
      continue;
    }

    // Parse table row
    if (trimmedLine.startsWith('|')) {
      const cells = trimmedLine
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');

      if (cells.length >= 2) {
        // First cell is the neuromodulator name, second is the level
        const name = cells[0].replace(/\*\*/g, '').trim().toLowerCase();
        const level = cells[1].trim();

        // Map to the correct field in NeuroLevels
        if (name === 'noradrenaline') {
          result.noradrenaline = level;
        } else if (name === 'acetylcholine') {
          result.acetylcholine = level;
        } else if (name === 'serotonin') {
          result.serotonin = level;
        } else if (name === 'dopamine') {
          result.dopamine = level;
        }
      }
    }
  }

  return result;
}
