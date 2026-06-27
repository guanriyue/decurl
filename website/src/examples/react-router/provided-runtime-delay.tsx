import { SearchProvider } from '@guanriyue/decurl';
import {
  SearchRuntimeConnector,
  useProvidedSearchValue,
} from '@guanriyue/decurl/provided';
import { defineFields, field } from '@guanriyue/decurl/codec';
import { min, pipe, shape, toNumber } from '@guanriyue/decurl/decode';
import { memo, useRef } from 'react';
import { useLocation } from 'react-router';
import { toSearchText, useDemoI18n } from '@/examples/i18n';

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

const ProvidedRuntimeDelayDemo = () => {
  return (
    <SearchProvider flushDelay={observationDelay} flushMode="debounce">
      <SearchRuntimeConnector />
      <DemoShell />
    </SearchProvider>
  );
};

const DemoShell = () => {
  const t = useDemoI18n();
  const renderCountRef = useRef(0);
  const location = useLocation();

  renderCountRef.current += 1;

  return (
    <div className="decurl-demo">
      <div className="decurl-demo__state">
        <span>parent / React Router location</span>
        <code>{toSearchText(location.search, t)}</code>
        <code>parent renders: {renderCountRef.current}</code>
        <code>observation flushDelay: {observationDelay}ms</code>
      </div>
      <div className="decurl-demo__grid">
        <CountPanel
          fieldKey="countA"
          title="plain countA"
          buttonText={t('demo.provided.updateA')}
        />
        <CountPanel
          fieldKey="countB"
          title="plain countB"
          buttonText={t('demo.provided.updateB')}
        />
      </div>
      <div className="decurl-demo__grid">
        <MemoCountPanel
          fieldKey="countA"
          title="memo countA"
          buttonText={t('demo.provided.updateA')}
        />
        <MemoCountPanel
          fieldKey="countB"
          title="memo countB"
          buttonText={t('demo.provided.updateB')}
        />
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
  const [count, setCount] = useProvidedSearchValue(fields[fieldKey]);

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

export default ProvidedRuntimeDelayDemo;
