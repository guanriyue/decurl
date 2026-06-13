import { isUndefined } from '../_internal/isUndefined';
import type { Prettier } from '../_internal/types';
import type {
  DefinedFieldName,
  FieldName,
  RecordCodec,
  WithDefinedFieldName,
} from './types';

export type DefinedFields<TDefinition extends RecordCodec> = Prettier<{
  [key in keyof TDefinition]: WithDefinedFieldName<TDefinition[key]>;
}>;

export type DefineFieldsOptions = {
  warnOnNameConflict?: boolean;
};

export const defineFields = <TDefinition extends RecordCodec>(
  definition: TDefinition,
  options: DefineFieldsOptions = {},
): DefinedFields<TDefinition> => {
  const entries = Object.entries(definition).map(([key, codec]) => {
    const names = normalizeFieldNames(codec.name, key);

    return [
      key,
      {
        ...codec,
        name: names.length === 1 ? names[0] : names,
      },
    ];
  });
  const fields = Object.fromEntries(entries) as DefinedFields<TDefinition>;

  if (
    options.warnOnNameConflict !== false &&
    process.env.NODE_ENV !== 'production'
  ) {
    checkFieldNameConflicts(fields);
  }

  return fields;
};

const normalizeFieldNames = (
  name: FieldName | undefined,
  key: string,
): DefinedFieldName => {
  if (typeof name === 'string') {
    return name;
  }

  if (Array.isArray(name) && name.length > 0) {
    return [...name] as [string, ...string[]];
  }

  return key;
};

const toFieldNames = (name: DefinedFieldName): readonly string[] => {
  return typeof name === 'string' ? [name] : name;
};

const checkFieldNameConflicts = (
  definition: Record<string, { name: DefinedFieldName }>,
): void => {
  const nameOwners = new Map<string, string>();

  for (const [key, codec] of Object.entries(definition)) {
    for (const fieldName of toFieldNames(codec.name)) {
      const owner = nameOwners.get(fieldName);

      if (!isUndefined(owner)) {
        console.warn(
          `[decurl] Duplicate field name "${fieldName}" in schema definition: "${owner}" and "${key}".`,
        );
        continue;
      }

      nameOwners.set(fieldName, key);
    }
  }
};
