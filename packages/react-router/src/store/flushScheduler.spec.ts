import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFlushScheduler } from './flushScheduler';

describe('createFlushScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs flush after the configured delay', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = createFlushScheduler({
      delay: 100,
      mode: 'throttle',
      flush,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(99);

    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('does not reschedule pending flush in throttle mode', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = createFlushScheduler({
      delay: 100,
      mode: 'throttle',
      flush,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(50);
    scheduler.schedule();
    vi.advanceTimersByTime(49);

    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('reschedules pending flush in debounce mode', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = createFlushScheduler({
      delay: 100,
      mode: 'debounce',
      flush,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(50);
    scheduler.schedule();
    vi.advanceTimersByTime(99);

    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('can cancel pending flush', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = createFlushScheduler({
      delay: 100,
      mode: 'throttle',
      flush,
    });

    scheduler.schedule();
    scheduler.cancel();
    vi.advanceTimersByTime(100);

    expect(flush).not.toHaveBeenCalled();
  });

  it('normalizes negative delay to zero', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = createFlushScheduler({
      delay: -1,
      mode: 'throttle',
      flush,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(0);

    expect(flush).toHaveBeenCalledTimes(1);
  });
});
