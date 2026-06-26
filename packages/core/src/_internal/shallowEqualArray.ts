export const shallowEqualArray = (value: unknown, previousValue: unknown): boolean => {
  if (!Array.isArray(value) || !Array.isArray(previousValue)) {
    return false;
  }

  if (value.length !== previousValue.length) {
    return false;
  }

  return value.every((item, index) => Object.is(item, previousValue[index]));
};
