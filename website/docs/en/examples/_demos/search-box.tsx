import { useSearchValue } from '@decurl/react-router';
import { field } from '@decurl/react-router/codec';
import { Search, X } from 'lucide-react';
import { useLocation } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const searchField = field({
  name: 'example_keyword',
  decode: (value: string) => {
    const nextValue = value.trim();
    return nextValue.length > 0 ? nextValue : undefined;
  },
  defaultValue: '',
});

const SearchBox = () => {
  const location = useLocation();
  const [keyword, setKeyword] = useSearchValue(searchField);

  return (
    <section className="mx-auto max-w-xl space-y-5 p-4">
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold">Search products</h2>
        <p className="text-sm text-muted-foreground">
          The input value is stored in the example_keyword search param.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="example-keyword">Keyword</Label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="example-keyword"
              className="pl-9"
              placeholder="router, docs, search..."
              value={keyword}
              onChange={(event) => {
                setKeyword(event.currentTarget.value);
              }}
            />
          </div>
          <Button
            aria-label="Clear keyword"
            disabled={keyword.length === 0}
            type="button"
            variant="outline"
            onClick={() => {
              setKeyword(undefined);
            }}
          >
            <X />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">location.search</span>
        <Badge variant="outline" className="font-mono">
          {location.search || '(empty)'}
        </Badge>
      </div>
    </section>
  );
};

export default SearchBox;
