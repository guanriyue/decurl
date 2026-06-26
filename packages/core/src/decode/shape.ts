import { isUndefined } from '../_internal/isUndefined';
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

const isRealMonth = (month: number): boolean => {
  return Number.isInteger(month) && month >= 1 && month <= 12;
};

const isMonth = (input: string): boolean => {
  const matched = input.match(/^(\d{4})-(\d{2})$/);

  if (!matched) {
    return false;
  }

  return isRealMonth(Number(matched[2]));
};

const isRealDate = (year: number, month: number, day: number): boolean => {
  if (!isRealMonth(month)) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const isDate = (input: string): boolean => {
  const matched = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!matched) {
    return false;
  }

  const [, year, month, day] = matched;
  return isRealDate(Number(year), Number(month), Number(day));
};

const isRealTime = (hour: number, minute: number, second: number | undefined): boolean => {
  return (
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59 &&
    (isUndefined(second) || (Number.isInteger(second) && second >= 0 && second <= 59))
  );
};

const isTimezoneOffset = (input: string): boolean => {
  if (input === 'Z') {
    return true;
  }

  const matched = input.match(/^[+-](\d{2}):(\d{2})$/);

  if (!matched) {
    return false;
  }

  const [, hour, minute] = matched;
  return isRealTime(Number(hour), Number(minute), undefined);
};

const isDatetime = (input: string): boolean => {
  const matched = input.match(
    /^(\d{4})-(\d{2})-(\d{2})([T ])(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/,
  );

  if (!matched) {
    return false;
  }

  const [, year, month, day, separator, hour, minute, second, timezone] = matched;

  if (!isRealDate(Number(year), Number(month), Number(day))) {
    return false;
  }

  if (!isRealTime(Number(hour), Number(minute), isUndefined(second) ? undefined : Number(second))) {
    return false;
  }

  if (isUndefined(timezone)) {
    return true;
  }

  return separator === 'T' && !isUndefined(second) && isTimezoneOffset(timezone);
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
