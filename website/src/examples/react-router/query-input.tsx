import { useSearchValue } from '@guanriyue/decurl';
import { defineFields } from '@guanriyue/decurl/codec';
import { trim } from '@guanriyue/decurl/decode';
import { useLocation } from 'react-router';
import { toSearchText, useDemoI18n } from '@/examples/i18n';

const fields = defineFields({
  keyword: {
    name: 'demo_q',
    decode: trim,
  },
});

const QueryInputDemo = () => {
  const t = useDemoI18n();
  const location = useLocation();
  const [keyword, setKeyword] = useSearchValue(fields.keyword);

  return (
    <div className="decurl-demo">
      <label className="decurl-demo__field">
        <span>{t('demo.keyword')}</span>
        <input
          value={keyword ?? ''}
          placeholder={t('demo.queryInput.placeholder')}
          onChange={(event) => {
            const nextValue = event.currentTarget.value.trim();
            setKeyword(nextValue === '' ? undefined : nextValue);
          }}
        />
      </label>
      <div className="decurl-demo__state">
        <span>{t('demo.currentValue')}</span>
        <code>{keyword}</code>
      </div>
      <div className="decurl-demo__state">
        <span>{t('demo.currentSearch')}</span>
        <code>{toSearchText(location.search, t)}</code>
      </div>
    </div>
  );
};

export default QueryInputDemo;
