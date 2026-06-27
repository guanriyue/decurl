import { useSearchValues } from '@guanriyue/decurl';
import { defineFields, field } from '@guanriyue/decurl/codec';
import {
  elementOf,
  min,
  pipe,
  shape,
  toBoolean,
  toNumber,
  trim,
} from '@guanriyue/decurl/decode';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { toSearchText, useDemoI18n } from '@/examples/i18n';

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

const QueryFormDemo = () => {
  const t = useDemoI18n();
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
      <div className="decurl-demo__grid">
        <label className="decurl-demo__field">
          <span>{t('demo.keyword')}</span>
          <input name="query" placeholder={t('demo.queryForm.placeholder')} />
        </label>
        <label className="decurl-demo__field">
          <span>{t('demo.queryForm.category')}</span>
          <select name="category">
            <option value="all">{t('demo.queryForm.all')}</option>
            <option value="docs">{t('demo.queryForm.guides')}</option>
            <option value="api">{t('demo.queryForm.api')}</option>
          </select>
        </label>
      </div>
      <label className="decurl-demo__check">
        <input name="inStock" type="checkbox" value="true" />
        <span>{t('demo.queryForm.availableOnly')}</span>
      </label>
      <div className="decurl-demo__actions">
        <button type="submit">{t('demo.queryForm.submit')}</button>
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
          {t('demo.reset')}
        </button>
      </div>
      <div className="decurl-demo__state">
        <span>{t('demo.currentSearch')}</span>
        <code>{toSearchText(location.search, t)}</code>
      </div>
    </form>
  );
};

export default QueryFormDemo;
