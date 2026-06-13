import { defineFields, field } from '@decurl/react-router/codec';
import { createReactRouterSearch } from '@decurl/react-router/configured';
import { min, pipe, shape, toNumber } from '@decurl/react-router/decode';
import { useRef } from 'react';
import { useLocation } from 'react-router';

const fields = defineFields({
  countA: field({
    name: 'demo_bound_a',
    decode: pipe(shape.integer, toNumber, min(0)),
    defaultValue: 0,
  }),
  countB: field({
    name: 'demo_bound_b',
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

const ConfiguredStoreRendersDemo = () => {
  return (
    <search.Provider>
      <div className="decurl-demo">
        <div className="decurl-demo__state">
          <span>observation flushDelay</span>
          <code>{observationDelay}ms</code>
        </div>
        <div className="decurl-demo__grid">
          <CountA />
          <CountB />
        </div>
        <LocationSearch />
      </div>
    </search.Provider>
  );
};

const LocationSearch = () => {
  const renderCountRef = useRef(0);
  const location = useLocation();

  renderCountRef.current += 1;

  return (
    <div className="decurl-demo__state">
      <span>React Router location</span>
      <code>{toSearchText(location.search)}</code>
      <code>renders: {renderCountRef.current}</code>
    </div>
  );
};

const CountA = () => {
  const renderCountRef = useRef(0);
  const [count, setCount] = search.useSearchValue(fields.countA);

  renderCountRef.current += 1;

  return (
    <section className="decurl-demo__state">
      <span>countA</span>
      <code>value: {count}</code>
      <code>renders: {renderCountRef.current}</code>
      <div className="decurl-demo__actions">
        <button
          type="button"
          onClick={() => {
            setCount((value) => value + 1);
          }}
        >
          更新 A
        </button>
      </div>
    </section>
  );
};

const CountB = () => {
  const renderCountRef = useRef(0);
  const [count, setCount] = search.useSearchValue(fields.countB);

  renderCountRef.current += 1;

  return (
    <section className="decurl-demo__state">
      <span>countB</span>
      <code>value: {count}</code>
      <code>renders: {renderCountRef.current}</code>
      <div className="decurl-demo__actions">
        <button
          type="button"
          onClick={() => {
            setCount((value) => value + 1);
          }}
        >
          更新 B
        </button>
      </div>
    </section>
  );
};

export default ConfiguredStoreRendersDemo;
