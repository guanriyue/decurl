import type {
  EncodeFieldsValues,
  InferFieldValues,
  RecordCodec,
} from '@decurl/core/codec';
import type {
  SearchLocation,
  SearchNavigateOptions,
  SearchRuntime,
} from '../runtime/types';

/**
 * 某个 search schema 对应的 decoded values 局部 patch。
 *
 * 对象 patch 会被直接应用。updater patch 会在 store replay 时重新执行，
 * 并使用 entry 自己的 schema 从中间 search string 中 decode 出 previous values。
 */
export type SearchPatch<TDefinition extends RecordCodec> =
  | EncodeFieldsValues<TDefinition>
  | ((
      previousValues: InferFieldValues<TDefinition>,
    ) => EncodeFieldsValues<TDefinition>);

/**
 * 已经影响 optimistic state，但尚未一定持久化到 router 的 pending mutation。
 */
export type PendingEntry<TDefinition extends RecordCodec = RecordCodec> = {
  /** Store 分配的单调递增 id，用于调试和排序。 */
  id: number;

  /**
   * 创建 entry 时的 visible base location。
   *
   * 该字段记录 entry 的原始上下文，可用于调试或后续更严格的失效规则。
   * 它不代表每次 replay 都必须从该 location 开始。
   */
  baseLocation: SearchLocation;

  /**
   * Replay 时用于 decode updater previous values 和 encode patch 的 schema。
   */
  schema: TDefinition;

  /** Hook 提交的 patch。 */
  patch: SearchPatch<TDefinition>;

  /**
   * 随 entry 一起提交的可选 navigate options。
   *
   * Flush 时，只有被消费 entries 中最后一个 entry 的显式 options 会与默认
   * navigate options 合并。
   */
  options?: SearchNavigateOptions;
};

/**
 * 已发送给 runtime.navigate，但尚未被匹配 location change 确认的 location。
 */
export type InflightFlush = SearchLocation;

/**
 * Store 内部状态。
 */
export type SearchStoreState = {
  /** 最近一次被 React Router 或其他 runtime source 确认的 location。 */
  confirmedLocation: SearchLocation;

  /** 当前对 React subscribers 可见的 location。 */
  optimisticLocation: SearchLocation;

  /** 应用在当前 visible base 上的 pending entries。 */
  pendingEntries: PendingEntry[];

  /** 等待 runtime 确认的 flush target。 */
  inflightFlush?: InflightFlush;
};

/**
 * React 通过 useSyncExternalStore 消费的公开 snapshot。
 */
export type SearchStoreSnapshot = {
  /** Selector 和 hook 使用的 optimistic location。 */
  location: SearchLocation;
};

/**
 * 与具体框架无关的 search state store。
 */
export type SearchStore = {
  /** 返回当前 optimistic snapshot。 */
  getSnapshot: () => SearchStoreSnapshot;

  /** 返回 useSyncExternalStore 使用的 server snapshot。 */
  getServerSnapshot: () => SearchStoreSnapshot;

  /** 订阅 optimistic search state 变化。 */
  subscribe: (listener: () => void) => () => void;

  /**
   * 替换 flush 使用的 runtime capability。
   *
   * Runtime configuration 是幂等配置，不应通知 subscribers。
   */
  configureRuntime: (runtime: SearchRuntime) => void;

  /**
   * 通知 store runtime/router 发生了 location change。
   *
   * Store 会自行判断这是 decurl flush confirmation，还是 external location change。
   */
  locationChanged: (location: SearchLocation) => void;

  /**
   * 添加 pending patch entry，并立即更新 optimistic state。
   */
  setValues: <TDefinition extends RecordCodec>(
    schema: TDefinition,
    patch: SearchPatch<TDefinition>,
    options?: SearchNavigateOptions,
  ) => void;

  /**
   * 通过已配置的 runtime 持久化当前 optimistic location。
   */
  flush: () => void;
};
