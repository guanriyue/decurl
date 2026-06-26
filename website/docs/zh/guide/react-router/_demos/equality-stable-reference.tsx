import { useSearchValue, useSearchValues } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import { trim } from '@decurl/react-router/decode';
import { useRef } from 'react';
import { useLocation } from 'react-router';

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

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const EqualityStableReferenceDemo = () => {
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
          <span>监听的 key</span>
          <input
            value={values.keyword}
            placeholder="会改变 values 引用"
            onChange={(event) => {
              setValues({ keyword: event.currentTarget.value });
            }}
          />
        </label>
        <label className="decurl-demo__field">
          <span>无关的 key</span>
          <input
            value={unrelatedValue}
            placeholder="不会改变 values 引用"
            onChange={(event) => {
              setUnrelatedValue(event.currentTarget.value);
            }}
          />
        </label>
      </div>
      <div className="decurl-demo__grid">
        <div className="decurl-demo__state">
          <span>组件渲染次数</span>
          <code>{renderCountRef.current}</code>
        </div>
        <div className="decurl-demo__state">
          <span>values 引用变化次数</span>
          <code>{valuesChangeCountRef.current}</code>
        </div>
      </div>
      <div className="decurl-demo__state">
        <span>当前参数</span>
        <code>{toSearchText(location.search)}</code>
      </div>
    </div>
  );
};

export default EqualityStableReferenceDemo;
