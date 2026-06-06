import type {
  FieldCodec,
  InferFieldValue,
  MultiOptionalFieldCodec,
  MultiRequiredFieldCodec,
} from './codec';

export const decodeField = <TCodec extends FieldCodec>(
  codec: TCodec,
  searchParams: URLSearchParams,
  key: string,
): InferFieldValue<TCodec> => {
  if (isMultiFieldCodec(codec)) {
    const decoded =
      codec.decode(searchParams.getAll(key)) ?? codec.defaultValue;
    return decoded as never;
  }

  const raw = searchParams.get(key);

  if (raw === null) {
    return codec.defaultValue as never;
  }

  const decoded = codec.decode(raw) ?? codec.defaultValue;
  return decoded as never;
};

const isMultiFieldCodec = <TValue>(
  codec: FieldCodec<TValue>,
): codec is
  | MultiOptionalFieldCodec<TValue>
  | MultiRequiredFieldCodec<TValue> => {
  return codec.mode === 'multi';
};
