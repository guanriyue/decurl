import { describe, expect, it } from 'vitest';
import { elementOf, mapItems, pipe, shape, toNumber, unique } from './index';

describe('unique', () => {
  it('removes duplicate items with Object.is while preserving order', () => {
    expect(unique(['a', 'a', 'b', 'a'])).toEqual(['a', 'b']);
    expect(unique([NaN, NaN, 1])).toEqual([NaN, 1]);
  });

  it('creates an identity based array decoder', () => {
    const itemA = { id: 1, label: 'a' };
    const itemB = { id: 1, label: 'b' };
    const itemC = { id: 2, label: 'c' };

    expect(unique.by((item: { id: number }) => item.id)([itemA, itemB, itemC])).toEqual([
      itemA,
      itemC,
    ]);
  });

  it('can be used as a pipe step after mapItems', () => {
    const decodeIds = pipe(mapItems(shape.integer, toNumber), unique);

    expect(decodeIds(['1', '2', '1', 'x'])).toEqual([1, 2]);
  });
});

describe('elementOf', () => {
  it('returns the original value when it belongs to an array', () => {
    const decodeOrder = elementOf(['asc', 'desc'] as const);

    expect(decodeOrder('asc')).toBe('asc');
    expect(decodeOrder('other')).toBeUndefined();
  });

  it('uses Object.is for membership checks', () => {
    const decodeValue = elementOf([NaN, 0] as const);

    expect(decodeValue(NaN)).toBeNaN();
    expect(decodeValue(-0)).toBeUndefined();
  });

  it('does not convert raw values for number enum definitions', () => {
    const PageSize = {
      20: 'Small',
      50: 'Large',
      Small: 20,
      Large: 50,
    } as const;

    const decodePageSize = pipe(shape.integer, toNumber, elementOf(PageSize));

    expect(decodePageSize('20')).toBe(20);
    expect(elementOf(PageSize)('20')).toBeUndefined();
  });
});

describe('shape.month', () => {
  it('accepts YYYY-MM with a valid month', () => {
    expect(shape.month('2026-01')).toBe('2026-01');
    expect(shape.month('2026-12')).toBe('2026-12');
  });

  it('rejects invalid month values', () => {
    expect(shape.month('2026-00')).toBeUndefined();
    expect(shape.month('2026-13')).toBeUndefined();
    expect(shape.month('2026-1')).toBeUndefined();
  });
});

describe('shape.datetime', () => {
  it('accepts supported datetime shapes', () => {
    expect(shape.datetime('2026-06-07T13:45')).toBe('2026-06-07T13:45');
    expect(shape.datetime('2026-06-07T13:45:30')).toBe('2026-06-07T13:45:30');
    expect(shape.datetime('2026-06-07 13:45')).toBe('2026-06-07 13:45');
    expect(shape.datetime('2026-06-07 13:45:30')).toBe('2026-06-07 13:45:30');
    expect(shape.datetime('2026-06-07T13:45:30Z')).toBe('2026-06-07T13:45:30Z');
    expect(shape.datetime('2026-06-07T13:45:30+08:00')).toBe('2026-06-07T13:45:30+08:00');
  });

  it('rejects invalid datetime shapes', () => {
    expect(shape.datetime('2026-02-30T13:45')).toBeUndefined();
    expect(shape.datetime('2026-06-07T24:00')).toBeUndefined();
    expect(shape.datetime('2026-06-07T99:99:99')).toBeUndefined();
    expect(shape.datetime('2026-06-07T13:45Z')).toBeUndefined();
    expect(shape.datetime('2026-06-07T13:45+08:00')).toBeUndefined();
    expect(shape.datetime('2026-06-07 13:45:30Z')).toBeUndefined();
    expect(shape.datetime('2026/06/07 13:45')).toBeUndefined();
  });
});
