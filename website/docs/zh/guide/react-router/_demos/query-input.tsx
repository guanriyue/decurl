import { useSearchValue } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import { trim } from '@decurl/react-router/decode';
import { useLocation } from 'react-router';

const fields = defineFields({
  keyword: {
    name: 'demo_q',
    decode: trim
  }
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const QueryInputDemo = () => {
  const location = useLocation();
  const [keyword, setKeyword] = useSearchValue(fields.keyword);

  return (
    <div className="decurl-demo">
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
        <span>当前值</span>
        <code>{keyword}</code>
      </div>
      <div className="decurl-demo__state">
        <span>当前路由参数</span>
        <code>{toSearchText(location.search)}</code>
      </div>
    </div>
  );
};

export default QueryInputDemo;
