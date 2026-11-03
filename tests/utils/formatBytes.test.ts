import { describe, expect, it } from 'vitest';
import { formatBytes } from '@/utils/formatBytes';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'], [0.5, '1 B'], [40, '40 B'], [1023, '1023 B'], [1024, '1 KB'], [1229, '1.2 KB'],
    [3565158, '3.4 MB'], [1024 ** 3, '1 GB'], [1024 ** 4, '1 TB'], [1024 ** 5, '1 PB'],
    [-1, '0 B'], [NaN, '0 B'], [Infinity, '0 B'],
  ])('formats %s as %s', (input, expected) => { expect(formatBytes(input)).toBe(expected); });
});
