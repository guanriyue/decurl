import { where } from './predicate';
import type { Decode } from './types';

type Shape = {
  (regexp: RegExp): Decode<string, string>;
  integer: Decode<string, string>;
  number: Decode<string, string>;
  boolish: Decode<string, 'true' | 'false'>;
  month: Decode<string, string>;
  date: Decode<string, string>;
  datetime: Decode<string, string>;
};

const isInteger = (input: string): boolean => {
  return /^-?(0|[1-9]\d*)$/.test(input);
};

const isNumber = (input: string): boolean => {
  return /^-?(0|[1-9]\d*)(\.\d+)?$/.test(input);
};

const isBoolish = (input: string): input is 'true' | 'false' => {
  return input === 'true' || input === 'false';
};

const isMonth = (input: string): boolean => {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(input);
};

const isRealDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isDate = (input: string): boolean => {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(input)) {
    return false;
  }

  const [year, month, day] = input.split('-').map(Number);
  return isRealDate(year, month, day);
};

const isDatetime = (input: string): boolean => {
  const matched = input.match(
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:(?:[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?)|(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
  );

  if (!matched) {
    return false;
  }

  const [, year, month, day] = matched;
  return isRealDate(Number(year), Number(month), Number(day));
};

const createShape = (regexp: RegExp): Decode<string, string> => {
  return where((input) => regexp.test(input));
};

export const shape: Shape = Object.assign(createShape, {
  integer: where(isInteger),

  number: where(isNumber),

  boolish: where(isBoolish),

  month: where(isMonth),

  date: where(isDate),

  datetime: where(isDatetime),
});
