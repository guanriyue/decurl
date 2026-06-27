import { useSearchValues } from '@guanriyue/decurl';
import { defineFields, field } from '@guanriyue/decurl/codec';
import {
  elementOf,
  length,
  mapItems,
  pipe,
  trim,
  unique,
} from '@guanriyue/decurl/decode';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fields = defineFields({
  keyword: field({
    name: 'example_batch_keyword',
    decode: pipe(trim, length.min(1)),
  }),
  scope: field({
    name: 'example_batch_scope',
    decode: elementOf(['all', 'guides', 'api']),
    defaultValue: 'all',
  }),
  tags: field({
    name: 'example_batch_tag',
    mode: 'multi',
    decode: pipe(mapItems(elementOf(['react', 'router', 'docs'])), unique),
  }),
});

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const BatchUpdates = () => {
  const location = useLocation();
  const [values, setValues] = useSearchValues(fields);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold">Apply preset</h2>
            <p className="text-sm text-muted-foreground">
              The preset calls setValues three times in a row.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setValues({ keyword: 'router' });
                setValues({ scope: 'guides' });
                setValues({ tags: ['react', 'docs'] });
              }}
            >
              <Sparkles />
              Apply docs preset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValues({
                  keyword: undefined,
                  scope: undefined,
                  tags: undefined,
                });
              }}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>

          <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs">
            <code>{`setValues({ keyword: 'router' });
setValues({ scope: 'guides' });
setValues({ tags: ['react', 'docs'] });`}</code>
          </pre>
        </div>

        <aside className="min-w-0 space-y-4 rounded-md bg-muted/40 p-4 text-sm">
          <div className="space-y-2">
            <span className="font-medium">location.search</span>
            <code className="block break-all rounded-md bg-background/70 px-2.5 py-2 font-mono text-xs">
              {toSearchText(location.search)}
            </code>
          </div>
          <div className="space-y-2">
            <span className="font-medium">Decoded values</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                keyword: {values.keyword ?? '-'}
              </Badge>
              <Badge variant="secondary">scope: {values.scope}</Badge>
              <Badge variant="secondary">
                tags: {values.tags?.join(', ') || '-'}
              </Badge>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default BatchUpdates;
