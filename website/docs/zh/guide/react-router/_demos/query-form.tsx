import { useSearchValues } from '@decurl/react-router';
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
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const fields = defineFields({
  query: field({
    name: 'demo_query',
    decode: trim,
  }),
  category: field({
    name: 'demo_category',
    decode: elementOf(['all', 'docs', 'api']),
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

const setFieldValue = (
  form: HTMLFormElement,
  name: string,
  value: string,
): void => {
  const element = form.elements.namedItem(name);

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement
  ) {
    element.value = value;
  }
};

const setCheckboxValue = (
  form: HTMLFormElement,
  name: string,
  checked: boolean,
): void => {
  const element = form.elements.namedItem(name);

  if (element instanceof HTMLInputElement) {
    element.checked = checked;
  }
};

const normalizeCategory = (value: FormDataEntryValue | undefined) => {
  return value === 'docs' || value === 'api' ? value : 'all';
};

export default function QueryFormDemo() {
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useSearchValues(fields);

  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    setFieldValue(form, 'query', values.query ?? '');
    setFieldValue(form, 'category', values.category);
    setCheckboxValue(form, 'inStock', values.inStock);
  }, [values]);

  return (
    <form
      ref={formRef}
      className="decurl-demo"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const rawValues = Object.fromEntries(formData);
        const nextQuery =
          typeof rawValues.query === 'string' ? rawValues.query.trim() : '';

        setValues({
          query: nextQuery === '' ? undefined : nextQuery,
          category: normalizeCategory(rawValues.category),
          inStock: rawValues.inStock === 'true',
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
          <input name="query" placeholder="搜索文档" />
        </label>
        <label className="decurl-demo__field">
          <span>分类</span>
          <select name="category">
            <option value="all">全部</option>
            <option value="docs">指南</option>
            <option value="api">API</option>
          </select>
        </label>
      </div>
      <label className="decurl-demo__check">
        <input name="inStock" type="checkbox" value="true" />
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
