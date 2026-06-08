import type {
  EncodeFieldsValues,
  InferFieldValues,
  RecordCodec,
} from '@decurl/core/codec';
import type { SearchLocation, SearchNavigateOptions, SearchRuntime } from '../runtime/types';

export type SearchPatch<TDefinition extends RecordCodec> =
  | EncodeFieldsValues<TDefinition>
  | ((
      previousValues: InferFieldValues<TDefinition>,
    ) => EncodeFieldsValues<TDefinition>);

export type PendingEntry<TDefinition extends RecordCodec = RecordCodec> = {
  id: number;
  pathname: string;
  baseSearch: string;
  schema: TDefinition;
  patch: SearchPatch<TDefinition>;
  options?: SearchNavigateOptions;
};

export type InflightFlush = SearchLocation;

export type SearchStoreSnapshot = {
  location: SearchLocation;
};

export type SearchStore = {
  getSnapshot: () => SearchStoreSnapshot;
  getServerSnapshot: () => SearchStoreSnapshot;
  subscribe: (listener: () => void) => () => void;
  configureRuntime: (runtime: SearchRuntime) => void;
  locationChanged: (location: SearchLocation) => void;
  setValues: <TDefinition extends RecordCodec>(
    schema: TDefinition,
    patch: SearchPatch<TDefinition>,
    options?: SearchNavigateOptions,
  ) => void;
  flush: () => void;
};

