export const trim = (input: string) => {
  return input.trim();
};

trim.start = (input: string) => input.trimStart();
trim.end = (input: string) => input.trimEnd();
