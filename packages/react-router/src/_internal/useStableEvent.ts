/** biome-ignore-all lint/suspicious/noExplicitAny: 作为稳定引用的 fallback 机制 */
import * as React from 'react';

type AnyFunction = (...args: any[]) => any;

const useCommitEffect = React.useInsertionEffect || React.useLayoutEffect;

export const useStableEvent = <TFunction extends AnyFunction>(callback: TFunction): TFunction => {
  const callbackRef = React.useRef<TFunction>((() => {
    throw new Error('Cannot call an event handler while rendering.');
  }) as never);

  useCommitEffect(() => {
    callbackRef.current = callback;
  });

  return React.useMemo(
    () =>
      ((...args) => {
        return callbackRef.current(...args);
      }) as TFunction,
    [],
  );
};
