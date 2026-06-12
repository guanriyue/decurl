import { useSearchValue, useSearchValues } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import {
  elementOf,
  min,
  pipe,
  shape,
  toBoolean,
  toNumber,
  trim,
} from '@decurl/react-router/decode';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

const inputFields = defineFields({
  keyword: field({
    name: 'demo_q',
    decode: pipe(trim, shape(/.+/)),
  }),
});

const formFields = defineFields({
  query: field({
    name: 'demo_query',
    decode: pipe(trim, shape(/.+/)),
  }),
  category: field({
    name: 'demo_category',
    decode: elementOf(['all', 'docs', 'api'] as const),
    defaultValue: 'all',
  }),
  inStock: field({
    name: 'demo_in_stock',
    decode: pipe(shape.boolish, toBoolean),
    defaultValue: false,
  }),
  page: field({
    name: 'demo_page',
    decode: pipe(shape.integer, toNumber, min(1)),
    defaultValue: 1,
  }),
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

export function QueryInputDemo() {
  const location = useLocation();
  const [keyword, setKeyword] = useSearchValue(inputFields.keyword);

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__header">
        <h3>输入框与 URL 联动</h3>
        <p>输入内容会立即写入 query 参数，清空输入框会删除参数。</p>
      </div>
      <label className="decurl-demo__field">
        <span>关键词</span>
        <input
          value={keyword ?? ''}
          placeholder="输入 router、search、docs..."
          onChange={(event) => {
            const nextValue = event.currentTarget.value.trim();
            setKeyword(nextValue === '' ? undefined : nextValue);
          }}
        />
      </label>
      <div className="decurl-demo__state">
        <span>当前参数</span>
        <code>{toSearchText(location.search)}</code>
      </div>
    </div>
  );
}

export function QueryFormDemo() {
  const location = useLocation();
  const [values, setValues] = useSearchValues(formFields);
  const [query, setQuery] = useState(values.query ?? '');
  const [category, setCategory] = useState(values.category);
  const [inStock, setInStock] = useState(values.inStock);

  useEffect(() => {
    setQuery(values.query ?? '');
    setCategory(values.category);
    setInStock(values.inStock);
  }, [values.category, values.inStock, values.query]);

  return (
    <form
      className="decurl-demo"
      onSubmit={(event) => {
        event.preventDefault();

        const nextQuery = query.trim();

        setValues({
          query: nextQuery === '' ? undefined : nextQuery,
          category,
          inStock,
          page: 1,
        });
      }}
    >
      <div className="decurl-demo__header">
        <h3>查询表单初始化与提交</h3>
        <p>表单从 URL 初始化；提交后用 schema patch 更新 URL。</p>
      </div>
      <div className="decurl-demo__grid">
        <label className="decurl-demo__field">
          <span>关键词</span>
          <input
            value={query}
            placeholder="搜索文档"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
          />
        </label>
        <label className="decurl-demo__field">
          <span>分类</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.currentTarget.value as typeof category);
            }}
          >
            <option value="all">全部</option>
            <option value="docs">指南</option>
            <option value="api">API</option>
          </select>
        </label>
      </div>
      <label className="decurl-demo__check">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(event) => {
            setInStock(event.currentTarget.checked);
          }}
        />
        <span>只看可用结果</span>
      </label>
      <div className="decurl-demo__actions">
        <button type="submit">提交查询</button>
        <button
          type="button"
          className="decurl-demo__button-secondary"
          onClick={() => {
            setValues({
              query: undefined,
              category: 'all',
              inStock: false,
              page: 1,
            });
          }}
        >
          重置
        </button>
      </div>
      <div className="decurl-demo__state">
        <span>当前参数</span>
        <code>{toSearchText(location.search)}</code>
      </div>
    </form>
  );
}
