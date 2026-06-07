import type { Decode } from './types';

type LengthLike = {
  length: number;
};

type EnumDefinition = Record<string, string | number>;

type EnumValue<TDefinition extends EnumDefinition> = TDefinition[keyof TDefinition];

export function where<TValue, TOutput extends TValue>(
  predicate: (value: TValue) => value is TOutput,
): Decode<TValue, TOutput>;

export function where<TValue>(
  predicate: (value: TValue) => boolean,
): Decode<TValue, TValue>;

export function where<TValue>(
  predicate: (value: TValue) => boolean,
): Decode<TValue, TValue> {
  return (input) => (predicate(input) ? input : undefined);
}

export const startsWith = <TPrefix extends string>(
  prefix: TPrefix,
): Decode<string, `${TPrefix}${string}`> => {
  return (input) =>
    input.startsWith(prefix) ? (input as `${TPrefix}${string}`) : undefined;
};

export function elementOf<const TValues extends readonly unknown[]>(
  values: TValues,
): Decode<unknown, TValues[number]>;

export function elementOf<const TDefinition extends EnumDefinition>(
  enumDefinition: TDefinition,
): Decode<unknown, EnumValue<TDefinition>>;

export function elementOf(
  valuesOrEnumDefinition: readonly unknown[] | EnumDefinition,
): Decode<unknown, unknown> {
  const values = Array.isArray(valuesOrEnumDefinition)
    ? valuesOrEnumDefinition
    : Object.values(valuesOrEnumDefinition);

  return (input) =>
    values.some((value) => Object.is(value, input)) ? input : undefined;
}

export const min = (minimum: number): Decode<number, number> => {
  return (input) => (input >= minimum ? input : undefined);
};

export const max = (maximum: number): Decode<number, number> => {
  return (input) => (input <= maximum ? input : undefined);
};

export const length = <T extends LengthLike>(
  sizeOrRange: number | readonly [min: number, max: number],
): Decode<T, T> => {
  return (input) => {
    if (typeof sizeOrRange === 'number') {
      return input.length === sizeOrRange ? input : undefined;
    }

    const [minimum, maximum] = sizeOrRange;
    return input.length >= minimum && input.length <= maximum
      ? input
      : undefined;
  };
};

length.min = <T extends LengthLike>(minimum: number): Decode<T, T> => {
  return (input) => (input.length >= minimum ? input : undefined);
};

length.max = <T extends LengthLike>(maximum: number): Decode<T, T> => {
  return (input) => (input.length <= maximum ? input : undefined);
};
