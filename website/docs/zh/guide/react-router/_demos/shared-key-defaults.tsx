import { useSearchValue, useSearchValues } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import { trim } from '@decurl/react-router/decode';
import { useLocation } from 'react-router';

const leftField = defineFields({
  value: field({
    name: 'demo_shared_default',
    decode: trim,
    defaultValue: 'left-default',
  }),
});

const rightSchema = defineFields({
  value: field({
    name: 'demo_shared_default',
    decode: trim,
    defaultValue: 'right-default',
  }),
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

export default function SharedKeyDefaultsDemo() {
  const location = useLocation();
  const [leftValue, setLeftValue] = useSearchValue(leftField.value);
  const [rightValues, setRightValues] = useSearchValues(rightSchema);

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__grid">
        <div className="decurl-demo__state">
          <span>useSearchValue defaultValue</span>
          <code>{leftValue}</code>
        </div>
        <div className="decurl-demo__state">
          <span>useSearchValues defaultValue</span>
          <code>{rightValues.value}</code>
        </div>
      </div>
      <div className="decurl-demo__actions">
        <button
          type="button"
          onClick={() => {
            setLeftValue('from-left');
          }}
        >
          写入 left
        </button>
        <button
          type="button"
          onClick={() => {
            setRightValues({ value: 'from-right' });
          }}
        >
          写入 right
        </button>
        <button
          type="button"
          className="decurl-demo__button-secondary"
          onClick={() => {
            setLeftValue(undefined);
          }}
        >
          删除 key
        </button>
      </div>
      <div className="decurl-demo__state">
        <span>当前参数</span>
        <code>{toSearchText(location.search)}</code>
      </div>
    </div>
  );
}
