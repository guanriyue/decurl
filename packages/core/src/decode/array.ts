import type { Decode } from '../codec';

type Identity<TValue, TIdentity> = (value: TValue) => TIdentity;

type Unique = {
  <TValue>(input: readonly TValue[]): TValue[];
  by: <TValue, TIdentity>(
    identity: Identity<TValue, TIdentity>,
  ) => Decode<readonly TValue[], TValue[]>;
};

const uniqueByIdentity = <TValue, TIdentity>(
  input: readonly TValue[],
  identity: Identity<TValue, TIdentity>,
): TValue[] => {
  const identities: TIdentity[] = [];
  const values: TValue[] = [];

  for (const value of input) {
    const currentIdentity = identity(value);

    if (identities.some((item) => Object.is(item, currentIdentity))) {
      continue;
    }

    identities.push(currentIdentity);
    values.push(value);
  }

  return values;
};

export const unique: Unique = Object.assign(
  <TValue>(input: readonly TValue[]): TValue[] => {
    return uniqueByIdentity(input, (value) => value);
  },
  {
    by: <TValue, TIdentity>(
      identity: Identity<TValue, TIdentity>,
    ): Decode<readonly TValue[], TValue[]> => {
      return (input) => uniqueByIdentity(input, identity);
    },
  },
);
