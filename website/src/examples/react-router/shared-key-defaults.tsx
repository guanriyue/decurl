import { useSearchValue, useSearchValues } from '@decurl/react-router';
import { defineFields, field } from '@decurl/react-router/codec';
import { trim } from '@decurl/react-router/decode';
import { useLocation } from 'react-router';
import { toSearchText, useDemoI18n } from '@/examples/i18n';

const leftField = defineFields({
  value: field({
    name: 'demo_shared_default',
    decode: trim,
    defaultValue: 'left-default',
  }),
});

const rightFields = defineFields({
  value: field({
    name: 'demo_shared_default',
    decode: trim,
    defaultValue: 'right-default',
  }),
});

const SharedKeyDefaultsDemo = () => {
  const t = useDemoI18n();
  const location = useLocation();
  const [leftValue, setLeftValue] = useSearchValue(leftField.value);
  const [rightValues, setRightValues] = useSearchValues(rightFields);

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
          {t('demo.sharedDefaults.writeLeft')}
        </button>
        <button
          type="button"
          onClick={() => {
            setRightValues({ value: 'from-right' });
          }}
        >
          {t('demo.sharedDefaults.writeRight')}
        </button>
        <button
          type="button"
          className="decurl-demo__button-secondary"
          onClick={() => {
            setLeftValue(undefined);
          }}
        >
          {t('demo.sharedDefaults.deleteKey')}
        </button>
      </div>
      <div className="decurl-demo__state">
        <span>{t('demo.currentSearch')}</span>
        <code>{toSearchText(location.search, t)}</code>
      </div>
    </div>
  );
};

export default SharedKeyDefaultsDemo;
