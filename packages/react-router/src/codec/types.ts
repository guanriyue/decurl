import type { AnyFunction, Prettier } from '../_internal/types';
import type { Decode } from '../decode/types';

export type FieldMode = 'single' | 'multi';

export type FieldName = string | readonly string[];

export type DefinedFieldName = string | readonly [string, ...string[]];

export type FieldCodecBase<TValue> = {
  eq?: (left: NonNullable<TValue>, right: NonNullable<TValue>) => boolean;
  name?: FieldName;
};

export type SingleOptionalFieldCodec<TValue> = FieldCodecBase<TValue> & {
  mode?: 'single';
  decode: Decode<string, TValue>;
  encode?: (value: NonNullable<TValue>) => string | null | undefined;
  defaultValue?: never;
};

export type SingleRequiredFieldCodec<TValue> = FieldCodecBase<TValue> & {
  mode?: 'single';
  decode: Decode<string, TValue>;
  encode?: (value: NonNullable<TValue>) => string | null | undefined;
  defaultValue: NonNullable<TValue>;
};

export type MultiOptionalFieldCodec<TValue> = FieldCodecBase<TValue> & {
  mode: 'multi';
  decode: Decode<string[], TValue>;
  encode?: (value: NonNullable<TValue>) => string[] | null | undefined;
  defaultValue?: never;
};

export type MultiRequiredFieldCodec<TValue> = FieldCodecBase<TValue> & {
  mode: 'multi';
  decode: Decode<string[], TValue>;
  encode?: (value: NonNullable<TValue>) => string[] | null | undefined;
  defaultValue: NonNullable<TValue>;
};

export type OptionalFieldCodec<TValue> =
  | SingleOptionalFieldCodec<TValue>
  | MultiOptionalFieldCodec<TValue>;

export type RequiredFieldCodec<TValue> =
  | SingleRequiredFieldCodec<TValue>
  | MultiRequiredFieldCodec<TValue>;

// biome-ignore lint/suspicious/noExplicitAny: 用于表达任意 FieldCodec
export type FieldCodec<TValue = any> = OptionalFieldCodec<TValue> | RequiredFieldCodec<TValue>;

export type WithDefinedFieldName<TCodec extends FieldCodec> = {
  name: DefinedFieldName;
} & Omit<TCodec, 'name'>;

// biome-ignore lint/suspicious/noExplicitAny: 用于表达任意具名 FieldCodec 分支
export type NamedFieldCodec<T = any> =
  | WithDefinedFieldName<SingleOptionalFieldCodec<T>>
  | WithDefinedFieldName<SingleRequiredFieldCodec<T>>
  | WithDefinedFieldName<MultiOptionalFieldCodec<T>>
  | WithDefinedFieldName<MultiRequiredFieldCodec<T>>;

export type RecordCodec = Record<string, FieldCodec>;

export type OptionalFieldCodecOf<TValue> = TValue extends readonly unknown[]
  ? SingleOptionalFieldCodec<TValue> | MultiOptionalFieldCodec<TValue>
  : SingleOptionalFieldCodec<TValue>;

export type RequiredFieldCodecOf<TValue> = TValue extends readonly unknown[]
  ? SingleRequiredFieldCodec<TValue> | MultiRequiredFieldCodec<TValue>
  : SingleRequiredFieldCodec<TValue>;

export type FieldCodecOf<TValue> = undefined extends TValue
  ? OptionalFieldCodecOf<NonNullable<TValue>>
  : RequiredFieldCodecOf<NonNullable<TValue>>;

export type FieldsCodec<TData extends Record<string, unknown>> = Prettier<{
  [key in keyof TData]-?: FieldCodecOf<TData[key]>;
}>;

export type InferFieldValue<TCodec> =
  // biome-ignore lint/complexity/noBannedTypes: 使用 {} 代表 Nonnullable 值
  TCodec extends { defaultValue: {}; decode: AnyFunction }
    ? NonNullable<ReturnType<TCodec['decode']>>
    : TCodec extends OptionalFieldCodec<infer TValue>
      ? NonNullable<TValue> | undefined
      : never;

export type InferFieldValues<TDefinition extends RecordCodec> = Prettier<{
  [key in keyof TDefinition]: InferFieldValue<TDefinition[key]>;
}>;

export function field<TValue>(
  definition: SingleOptionalFieldCodec<TValue> & { name: DefinedFieldName },
): WithDefinedFieldName<SingleOptionalFieldCodec<TValue>>;

export function field<TValue>(
  definition: SingleRequiredFieldCodec<TValue> & { name: DefinedFieldName },
): WithDefinedFieldName<SingleRequiredFieldCodec<TValue>>;

export function field<TValue>(
  definition: MultiOptionalFieldCodec<TValue> & { name: DefinedFieldName },
): WithDefinedFieldName<MultiOptionalFieldCodec<TValue>>;

export function field<TValue>(
  definition: MultiRequiredFieldCodec<TValue> & { name: DefinedFieldName },
): WithDefinedFieldName<MultiRequiredFieldCodec<TValue>>;

export function field<TValue>(
  definition: SingleOptionalFieldCodec<TValue>,
): SingleOptionalFieldCodec<TValue>;

export function field<TValue>(
  definition: SingleRequiredFieldCodec<TValue>,
): SingleRequiredFieldCodec<TValue>;

export function field<TValue>(
  definition: MultiOptionalFieldCodec<TValue>,
): MultiOptionalFieldCodec<TValue>;

export function field<TValue>(
  definition: MultiRequiredFieldCodec<TValue>,
): MultiRequiredFieldCodec<TValue>;

export function field<TValue>(definition: FieldCodec<TValue>): FieldCodec<TValue> {
  return definition;
}
