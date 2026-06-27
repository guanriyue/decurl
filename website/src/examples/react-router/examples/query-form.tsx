import { useSearchValues } from 'decurl';
import { defineFields, field } from 'decurl/codec';
import {
  elementOf,
  length,
  mapItems,
  pipe,
  trim,
  unique,
} from 'decurl/decode';
import { RotateCcw, Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const fields = defineFields({
  keyword: field({
    name: 'example_form_keyword',
    decode: pipe(trim, length.min(1)),
  }),
  scope: field({
    name: 'example_form_scope',
    decode: elementOf(['all', 'guides', 'api']),
    defaultValue: 'all',
  }),
  tags: field({
    name: 'example_form_tag',
    mode: 'multi',
    decode: pipe(mapItems(elementOf(['react', 'router', 'docs'])), unique),
  }),
  topics: field({
    name: 'example_form_topic',
    mode: 'multi',
    decode: pipe(
      mapItems(
        elementOf([
          'filters',
          'forms',
          'pagination',
          'routing',
          'sharing',
          'state',
        ]),
      ),
      unique,
    ),
    defaultValue: ['routing'],
  }),
});

const tagOptions = [
  { value: 'react', label: 'React' },
  { value: 'router', label: 'Router' },
  { value: 'docs', label: 'Docs' },
];

const topicOptions = [
  { value: 'filters', label: 'Filters' },
  { value: 'forms', label: 'Forms' },
  { value: 'pagination', label: 'Pagination' },
  { value: 'routing', label: 'Routing' },
  { value: 'sharing', label: 'Sharing' },
  { value: 'state', label: 'State' },
];

const topicLabels = new Map(
  topicOptions.map((option) => [option.value, option.label]),
);

const tagValues = new Set(tagOptions.map((option) => option.value));
const topicValues = new Set(topicOptions.map((option) => option.value));

const toSearchText = (search: string): string => {
  return search.length > 0 ? search : '(empty)';
};

const setFieldValue = (
  form: HTMLFormElement,
  name: string,
  value: string,
): void => {
  const element = form.elements.namedItem(name);

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement
  ) {
    element.value = value;
  }
};

const getTextValue = (value: FormDataEntryValue | undefined) => {
  return typeof value === 'string' ? value.trim() : '';
};

const getScopeValue = (value: FormDataEntryValue | undefined) => {
  return value === 'guides' || value === 'api' ? value : 'all';
};

const getStringList = (
  values: FormDataEntryValue[],
  availableValues: ReadonlySet<string>,
) => {
  const nextValues = values.filter((value): value is string => {
    return typeof value === 'string' && availableValues.has(value);
  });

  return nextValues.length > 0 ? nextValues : undefined;
};

const QueryForm = () => {
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const topicsAnchorRef = useComboboxAnchor();
  const [values, setValues] = useSearchValues(fields);

  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    setFieldValue(form, 'keyword', values.keyword ?? '');
    setFieldValue(form, 'scope', values.scope);
  }, [values.keyword, values.scope]);

  return (
    <form
      ref={formRef}
      className="mx-auto w-full max-w-5xl p-4"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const keyword = getTextValue(formData.get('keyword') ?? undefined);
        const scope = getScopeValue(formData.get('scope') ?? undefined);
        const tags = getStringList(formData.getAll('tags'), tagValues) as never;
        const topics = getStringList(
          formData.getAll('topics'),
          topicValues,
        ) as never;

        setValues({
          keyword: keyword === '' ? undefined : keyword,
          scope,
          tags,
          topics,
        });
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="space-y-2">
              <Label htmlFor="example-form-keyword">Keyword</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="example-form-keyword"
                  name="keyword"
                  className="pl-9"
                  placeholder="router docs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="example-form-scope">Scope</Label>
              <Select
                key={values.scope}
                name="scope"
                defaultValue={values.scope}
              >
                <SelectTrigger id="example-form-scope" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="guides">Guides</SelectItem>
                  <SelectItem value="api">API Reference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-3">
              <Label>Tags</Label>
              <div
                key={values.tags?.join('|') ?? 'empty'}
                className="flex flex-wrap gap-x-4 gap-y-2"
              >
                {tagOptions.map((option) => (
                  // biome-ignore lint/a11y/noLabelWithoutControl: label wraps the checkbox
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      name="tags"
                      value={option.value}
                      defaultChecked={
                        values.tags?.some((tag) => tag === option.value) ??
                        false
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topics</Label>
              <Combobox
                key={values.topics.join('|')}
                multiple
                name="topics"
                defaultValue={values.topics}
              >
                <ComboboxChips ref={topicsAnchorRef}>
                  <ComboboxValue>
                    {(selectedValues: string[]) =>
                      selectedValues.map((value) => (
                        <ComboboxChip key={value}>
                          {topicLabels.get(value) ?? value}
                        </ComboboxChip>
                      ))
                    }
                  </ComboboxValue>
                  <ComboboxChipsInput placeholder="Search topics..." />
                </ComboboxChips>
                <ComboboxContent anchor={topicsAnchorRef}>
                  <ComboboxList>
                    {topicOptions.map((option) => (
                      <ComboboxItem key={option.value} value={option.value}>
                        {option.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                  <ComboboxEmpty>No topics found.</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Submit</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValues({
                  keyword: undefined,
                  scope: undefined,
                  tags: undefined,
                  topics: undefined,
                });
              }}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>
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
              <Badge variant="secondary">
                topics: {values.topics.join(', ')}
              </Badge>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
};

export default QueryForm;
