import { useSearchValue, useSearchValues } from 'decurl';
import { defineFields, field } from 'decurl/codec';
import { trim } from 'decurl/decode';
import { useLocation } from 'react-router';
import { toSearchText, useDemoI18n } from '@/examples/i18n';

const singleField = defineFields({
  keyword: field({
    name: 'demo_shared',
    decode: trim,
  }),
});

const valuesFields = defineFields({
  query: field({
    name: 'demo_shared',
    decode: trim,
  }),
});

const SharedKeyHooksDemo = () => {
  const t = useDemoI18n();
  const location = useLocation();
  const [keyword, setKeyword] = useSearchValue(singleField.keyword);
  const [values, setValues] = useSearchValues(valuesFields);

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__grid">
        <label className="decurl-demo__field">
          <span>useSearchValue</span>
          <input
            value={keyword ?? ''}
            placeholder={t('demo.shared.singlePlaceholder')}
            onChange={(event) => {
              const nextValue = event.currentTarget.value.trim();
              setKeyword(nextValue === '' ? undefined : nextValue);
            }}
          />
        </label>
        <label className="decurl-demo__field">
          <span>useSearchValues</span>
          <input
            value={values.query ?? ''}
            placeholder={t('demo.shared.valuesPlaceholder')}
            onChange={(event) => {
              const nextValue = event.currentTarget.value.trim();
              setValues({
                query: nextValue === '' ? undefined : nextValue,
              });
            }}
          />
        </label>
        <div className="decurl-demo__state">
          <span>{t('demo.shared.singleValue')}</span>
          <code>{keyword ?? t('demo.empty')}</code>
        </div>
        <div className="decurl-demo__state">
          <span>{t('demo.shared.valuesValue')}</span>
          <code>{values.query ?? t('demo.empty')}</code>
        </div>
      </div>
      <div className="decurl-demo__state">
        <span>{t('demo.currentSearch')}</span>
        <code>{toSearchText(location.search, t)}</code>
      </div>
    </div>
  );
};

export default SharedKeyHooksDemo;
