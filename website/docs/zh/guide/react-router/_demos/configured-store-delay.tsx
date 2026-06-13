import { defineFields, field } from '@decurl/react-router/codec';
import { createReactRouterSearch } from '@decurl/react-router/configured';
import { min, pipe, shape, toNumber } from '@decurl/react-router/decode';
import { memo, useRef } from 'react';
import { useLocation } from 'react-router';

const fields = defineFields({
  countA: field({
    name: 'demo_delay_a',
    decode: pipe(shape.integer, toNumber, min(0)),
    defaultValue: 0,
  }),
  countB: field({
    name: 'demo_delay_b',
    decode: pipe(shape.integer, toNumber, min(0)),
    defaultValue: 0,
  }),
});

const observationDelay = 2000;

const search = createReactRouterSearch({
  flushDelay: observationDelay,
  flushMode: 'debounce',
});

const toSearchText = (searchText: string): string => {
  return searchText.length > 0 ? searchText : '(empty)';
};

const ConfiguredStoreDelayDemo = () => {
  return (
    <search.Provider>
      <DemoShell />
    </search.Provider>
  );
};

const DemoShell = () => {
  const renderCountRef = useRef(0);
  const location = useLocation();

  renderCountRef.current += 1;

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__state">
        <span>parent / React Router location</span>
        <code>{toSearchText(location.search)}</code>
        <code>parent renders: {renderCountRef.current}</code>
        <code>observation flushDelay: {observationDelay}ms</code>
      </div>
      <div className="decurl-demo__grid">
        <CountPanel fieldKey="countA" title="plain countA" buttonText="更新 A" />
        <CountPanel fieldKey="countB" title="plain countB" buttonText="更新 B" />
      </div>
      <div className="decurl-demo__grid">
        <MemoCountPanel fieldKey="countA" title="memo countA" buttonText="更新 A" />
        <MemoCountPanel fieldKey="countB" title="memo countB" buttonText="更新 B" />
      </div>
    </div>
  );
};

type CountPanelProps = {
  fieldKey: 'countA' | 'countB';
  title: string;
  buttonText: string;
};

const CountPanel = ({ fieldKey, title, buttonText }: CountPanelProps) => {
  const renderCountRef = useRef(0);
  const [count, setCount] = search.useSearchValue(fields[fieldKey]);

  renderCountRef.current += 1;

  return (
    <section className="decurl-demo__state">
      <span>{title}</span>
      <code>value: {count}</code>
      <code>renders: {renderCountRef.current}</code>
      <div className="decurl-demo__actions">
        <button
          type="button"
          onClick={() => {
            setCount((value) => value + 1);
          }}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
};

const MemoCountPanel = memo(CountPanel);

export default ConfiguredStoreDelayDemo;
