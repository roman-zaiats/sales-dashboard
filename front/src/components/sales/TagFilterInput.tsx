import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from 'react';

import { useTagsQuery } from '@/generated/graphql';
import { normalizeTagFilters } from '@/store/sales/sales.filters';

type TagFilterInputProps = {
  tagIds: string[];
  onTagsChange: (nextTagIds: string[]) => void;
};

type SuggestionTag = {
  id: string;
  name: string;
};

const normalizeTagInput = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

const dedupe = (values: string[]): string[] => {
  const normalized = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = normalizeTagInput(value);
    if (!normalizedValue) {
      continue;
    }

    const key = normalizedValue.toLowerCase();
    if (!normalized.has(key)) {
      normalized.set(key, normalizedValue);
    }
  }

  return [...normalized.values()];
};

const removeTag = (values: string[], tag: string): string[] => {
  const key = normalizeTagInput(tag).toLowerCase();

  return values.filter(value => value.toLowerCase() !== key);
};

export const TagFilterInput = ({ tagIds, onTagsChange }: TagFilterInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSuggestionOpen, setSuggestionOpen] = useState(false);
  const [tagLabelsByValue, setTagLabelsByValue] = useState<Record<string, string>>({});
  const normalizedTags = useMemo(() => normalizeTagFilters(tagIds), [tagIds]);
  const searchValue = inputValue.trim();

  const tagsQuery = useTagsQuery({
    variables: {
      search: searchValue || undefined,
      limit: 50,
    },
    fetchPolicy: 'cache-and-network',
  });

  const suggestionById = useMemo(() => {
    const map: Record<string, string> = {};

    for (const tag of tagsQuery.data?.tags ?? []) {
      map[tag.id] = tag.name;
    }

    return map;
  }, [tagsQuery.data]);

  const selectedLookup = useMemo(() => {
    const values = new Set<string>();

    for (const tag of normalizedTags) {
      values.add(tag.toLowerCase());
    }

    for (const label of Object.values(tagLabelsByValue)) {
      const normalized = normalizeTagInput(label).toLowerCase();
      if (normalized) {
        values.add(normalized);
      }
    }

    return values;
  }, [normalizedTags, tagLabelsByValue]);

  const suggestionList = useMemo(() => {
    const values = selectedLookup;

    return (tagsQuery.data?.tags ?? []).filter(tag => {
      const normalized = normalizeTagInput(tag.name).toLowerCase();
      const hasByName = values.has(normalized);
      const hasById = values.has(tag.id.toLowerCase());

      return normalized.length > 0 && !hasByName && !hasById;
    });
  }, [selectedLookup, tagsQuery.data]);

  const hasExistingMatches = normalizedTags.length > 0;
  const hasSuggestions = suggestionList.length > 0;
  const noMatchesForQuery = !tagsQuery.loading && !tagsQuery.error && !hasSuggestions && searchValue.length > 0;

  const tagLabel = (value: string): string => {
    return tagLabelsByValue[value] ?? suggestionById[value] ?? value;
  };

  const addTag = (value: string, nextLabel?: string): void => {
    const normalized = normalizeTagInput(value);
    if (!normalized) {
      return;
    }

    const merged = dedupe([...normalizedTags, normalized]);
    if (merged.length === normalizedTags.length) {
      return;
    }

    onTagsChange(merged);
    setInputValue('');
    setSuggestionOpen(false);

    setTagLabelsByValue(current => {
      if (current[normalized]) {
        return current;
      }

      return {
        ...current,
        [normalized]: nextLabel ?? normalized,
      };
    });
  };

  const addTagFromSuggestion = (tag: SuggestionTag): void => {
    addTag(tag.id, tag.name);
  };

  const removeSelectedTag = (tagName: string): void => {
    onTagsChange(removeTag(normalizedTags, tagName));

    setTagLabelsByValue(current => {
      const next = { ...current };
      delete next[tagName];
      return next;
    });
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setSuggestionOpen(true);
  };

  const handleFocus = () => {
    setSuggestionOpen(true);
  };

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    setTimeout(() => setSuggestionOpen(false), 120);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    addTag(inputValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag(inputValue);
      setSuggestionOpen(false);
      return;
    }

    if (event.key === ',' || event.key === 'Tab') {
      if (event.key === ',') {
        event.preventDefault();
        addTag(inputValue);
      }
      return;
    }

    if (event.key === 'Backspace' && !inputValue) {
      const next = [...normalizedTags];
      next.pop();
      if (next.length !== normalizedTags.length) {
        onTagsChange(next);
      }
    }
  };

  const handleSuggestionPointerDown = (tag: SuggestionTag) => {
    setSuggestionOpen(false);
    addTagFromSuggestion(tag);
  };

  const handleSuggestionMouseDown = (event: MouseEvent<HTMLButtonElement>, tag: SuggestionTag): void => {
    event.preventDefault();
    handleSuggestionPointerDown(tag);
  };

  const handleSuggestionTouchStart = (event: TouchEvent<HTMLButtonElement>, tag: SuggestionTag): void => {
    event.preventDefault();
    handleSuggestionPointerDown(tag);
  };

  useEffect(() => {
    setTagLabelsByValue(current => {
      const withExistingValues = { ...current };

      for (const tag of normalizedTags) {
        if (withExistingValues[tag]) {
          continue;
        }

        if (tag.length > 0 && suggestionById[tag]) {
          withExistingValues[tag] = suggestionById[tag];
          continue;
        }

        withExistingValues[tag] = tag;
      }

      return withExistingValues;
    });
  }, [normalizedTags, suggestionById]);

  useEffect(() => {
    const next = Object.entries(tagLabelsByValue).reduce<Record<string, string>>((acc, [value, label]) => {
      if (normalizedTags.includes(value)) {
        acc[value] = label;
      }

      return acc;
    }, {});

    if (Object.keys(next).length !== Object.keys(tagLabelsByValue).length) {
      setTagLabelsByValue(next);
    }
  }, [normalizedTags, tagLabelsByValue]);

  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      Tags
      <div className="rounded-md border border-slate-200 bg-white p-2">
        <div className="tag-filter-input-shell">
          {normalizedTags.map(tag => (
            <span
              key={tag}
              className="tag-filter-chip"
            >
              <span>{tagLabel(tag)}</span>
              <button
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/80 text-xs leading-none"
                type="button"
                aria-label={`Remove tag ${tagLabel(tag)}`}
                onClick={() => removeSelectedTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
          <form onSubmit={handleSubmit}>
            <input
              className="tag-filter-input"
              value={inputValue}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={hasExistingMatches ? 'Add another tag name...' : 'Search or add tags...'}
              aria-label="Tag filter input"
            />
          </form>
        </div>

        {isSuggestionOpen ? (
          <div className="tag-filter-suggestions" role="listbox" aria-label="Tag suggestions">
            {tagsQuery.loading ? (
              <p className="px-2 py-1 text-xs text-slate-500">Loading tags…</p>
            ) : tagsQuery.error ? (
              <p className="px-2 py-1 text-xs text-rose-600">Unable to load tag suggestions. You can still type new tags.</p>
            ) : noMatchesForQuery ? (
              <p className="px-2 py-1 text-xs text-slate-500">
                No matching tags found. Press Enter to use your typed value.
              </p>
            ) : hasSuggestions ? (
              <ul className="space-y-1">
                {suggestionList.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full rounded-sm px-2 py-1 text-left text-sm transition hover:bg-slate-100"
                      onMouseDown={event => handleSuggestionMouseDown(event, item)}
                      onTouchStart={event => handleSuggestionTouchStart(event, item)}
                      onClick={() => handleSuggestionPointerDown(item)}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </label>
  );
};
