export type FlushScheduler = {
  schedule: () => void;
  cancel: () => void;
};

/**
 * Flush 调度模式。
 *
 * - throttle: 第一次 schedule 后启动固定窗口，窗口内重复 schedule 不会推迟 flush。
 * - debounce: 每次 schedule 都重新计时，持续更新会推迟 flush。
 */
export type FlushSchedulerMode = 'throttle' | 'debounce';

export type CreateFlushSchedulerOptions = {
  /** Flush 延迟毫秒数。负数会按 0 处理。 */
  delay: number;

  /** Flush 调度模式。 */
  mode: FlushSchedulerMode;

  /** 延迟结束后执行的 flush。 */
  flush: () => void;
};

export const createFlushScheduler = ({
  delay,
  mode,
  flush,
}: CreateFlushSchedulerOptions): FlushScheduler => {
  const normalizedDelay = Math.max(0, delay);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    if (typeof timer === 'undefined') {
      return;
    }

    clearTimeout(timer);
    timer = undefined;
  };

  return {
    schedule: () => {
      if (mode === 'throttle' && typeof timer !== 'undefined') {
        return;
      }

      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        flush();
      }, normalizedDelay);
    },
    cancel,
  };
};
