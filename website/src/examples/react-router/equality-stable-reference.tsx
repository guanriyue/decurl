import { useSearchValue, useSearchValues } from '@guanriyue/decurl';
import { defineFields, field } from '@guanriyue/decurl/codec';
import { trim } from '@guanriyue/decurl/decode';
import { useRef } from 'react';
import { useLocation } from 'react-router';
import { toSearchText, useDemoI18n } from '@/examples/i18n';

const watchedFields = defineFields({
  keyword: field({
    name: 'demo_equal_q',
    decode: trim,
    defaultValue: '',
  }),
});

const unrelatedFields = defineFields({
  value: field({
    name: 'demo_equal_other',
    decode: trim,
    defaultValue: '',
  }),
});

const EqualityStableReferenceDemo = () => {
  const t = useDemoI18n();
  const location = useLocation();
  const [values, setValues] = useSearchValues(watchedFields);
  const [unrelatedValue, setUnrelatedValue] = useSearchValue(
    unrelatedFields.value,
  );
  const renderCountRef = useRef(0);
  const valuesChangeCountRef = useRef(0);
  const previousValuesRef = useRef<typeof values | undefined>(undefined);

  renderCountRef.current += 1;

  if (previousValuesRef.current !== values) {
    valuesChangeCountRef.current += 1;
    previousValuesRef.current = values;
  }

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__grid">
        <label className="decurl-demo__field">
          <span>{t('demo.equality.watchedKey')}</span>
          <input
            value={values.keyword}
            placeholder={t('demo.equality.watchedPlaceholder')}
            onChange={(event) => {
              setValues({ keyword: event.currentTarget.value });
            }}
          />
        </label>
        <label className="decurl-demo__field">
          <span>{t('demo.equality.unrelatedKey')}</span>
          <input
            value={unrelatedValue}
            placeholder={t('demo.equality.unrelatedPlaceholder')}
            onChange={(event) => {
              setUnrelatedValue(event.currentTarget.value);
            }}
          />
        </label>
      </div>
      <div className="decurl-demo__grid">
        <div className="decurl-demo__state">
          <span>{t('demo.equality.renderCount')}</span>
          <code>{renderCountRef.current}</code>
        </div>
        <div className="decurl-demo__state">
          <span>{t('demo.equality.valuesChangeCount')}</span>
          <code>{valuesChangeCountRef.current}</code>
        </div>
      </div>
      <div className="decurl-demo__state">
        <span>{t('demo.currentSearch')}</span>
        <code>{toSearchText(location.search, t)}</code>
      </div>
    </div>
  );
};

export default EqualityStableReferenceDemo;
