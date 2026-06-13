import { useSearchValue, useSearchValues } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import { trim } from '@decurl/react-router/decode';
import { useLocation } from 'react-router';

const singleField = defineFields({
  keyword: field({
    name: 'demo_shared',
    decode: trim,
  }),
});

const valuesSchema = defineFields({
  query: field({
    name: 'demo_shared',
    decode: trim,
  }),
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

export default function SharedKeyHooksDemo() {
  const location = useLocation();
  const [keyword, setKeyword] = useSearchValue(singleField.keyword);
  const [values, setValues] = useSearchValues(valuesSchema);

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__grid">
        <label className="decurl-demo__field">
          <span>useSearchValue</span>
          <input
            value={keyword ?? ''}
            placeholder="从单字段 hook 更新"
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
            placeholder="从多字段 hook 更新"
            onChange={(event) => {
              const nextValue = event.currentTarget.value.trim();
              setValues({
                query: nextValue === '' ? undefined : nextValue,
              });
            }}
          />
        </label>
        <div className="decurl-demo__state">
          <span>useSearchValue 读到的值</span>
          <code>{keyword ?? '(empty)'}</code>
        </div>
        <div className="decurl-demo__state">
          <span>useSearchValues 读到的值</span>
          <code>{values.query ?? '(empty)'}</code>
        </div>
      </div>
      <div className="decurl-demo__state">
        <span>当前参数</span>
        <code>{toSearchText(location.search)}</code>
      </div>
    </div>
  );
}
