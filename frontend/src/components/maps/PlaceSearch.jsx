// Address autocomplete, backed by Google Places (W2-17).
//
// Keystrokes are debounced and superseded requests aborted, so a fast typist never
// sees results from an earlier query overwrite a later one. Predictions carry no
// coordinates, so the chosen one is resolved to a point before it is handed up —
// which also keeps the geocoding call off the per-keystroke billing tier.
//
// Implemented as an ARIA combobox: arrow keys move, Enter selects, Escape closes.

import { useEffect, useId, useRef, useState } from 'react';
import { currentPosition, resolvePlace, reverseGeocode, searchPlaces } from '../../api/geo';
import { color, control, font, radius } from '../../theme';

const DEBOUNCE_MS = 350;

export default function PlaceSearch({
  value,
  onChange,
  label = 'Address',
  placeholder = 'Search an address',
}) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Below the threshold the list is simply not shown — derived rather than cleared in
  // an effect, which would be a cascading render for something already known here.
  const visible = query.trim().length >= 3 ? results : [];

  useEffect(() => {
    if (query.trim().length < 3) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const found = await searchPlaces(query, { signal: controller.signal });
        setResults(found);
        setOpen(true);
        setActive(-1);
      } catch {
        /* aborted — a newer keystroke is already in flight */
      } finally {
        setBusy(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = async (prediction) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await resolvePlace(prediction));
      setQuery('');
      setResults([]);
      setOpen(false);
      setActive(-1);
    } catch {
      setError('Could not look up that address. Try another one.');
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = async () => {
    setBusy(true);
    setError(null);
    try {
      onChange(await reverseGeocode(await currentPosition()));
    } catch (locationError) {
      setError(locationError.message);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (event) => {
    if (!open || !visible.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % visible.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + visible.length) % visible.length);
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      choose(visible[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  // A chosen place replaces the box entirely — one clear state, not a filled input.
  if (value) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <span style={control.label}>{label}</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: radius.field,
            border: `1.5px solid ${color.ink}`,
            background: color.white,
          }}
        >
          <span style={{ flex: 1, minWidth: 0, fontSize: '15px', fontWeight: 600, color: color.ink }}>
            {value.label}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              flex: 'none',
              height: '40px',
              padding: '0 14px',
              borderRadius: radius.pill,
              border: 'none',
              background: 'transparent',
              fontFamily: font.body,
              fontSize: '13.5px',
              fontWeight: 700,
              color: color.muted,
              cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <label htmlFor={`${listId}-input`} style={control.label}>
        {label}
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          // Let a click on an option land before the list unmounts.
          setTimeout(() => setOpen(false), 140);
        }}
        onKeyDown={onKeyDown}
        style={{ ...control.field, ...(focused ? control.fieldFocus : null) }}
      />

      <button
        type="button"
        onClick={useMyLocation}
        style={{
          marginTop: '8px',
          padding: 0,
          border: 'none',
          background: 'transparent',
          fontFamily: font.body,
          fontSize: '13px',
          fontWeight: 600,
          color: color.orangeDeep,
          cursor: 'pointer',
        }}
      >
        {busy ? 'Working…' : 'Use my current location'}
      </button>

      {error ? (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: '13px', color: color.danger }}>
          {error}
        </p>
      ) : (
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: color.muted }}>
          Type at least 3 characters, use your location, or tap the map.
        </p>
      )}

      {open && visible.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 20,
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: '6px',
            listStyle: 'none',
            background: color.white,
            border: '1px solid rgba(17,17,17,.1)',
            borderRadius: '18px',
            boxShadow: '0 28px 54px -28px rgba(17,17,17,.55)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {visible.map((prediction, index) => (
            <li key={prediction.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(prediction)}
                onMouseEnter={() => setActive(index)}
                style={{
                  display: 'block',
                  width: '100%',
                  minHeight: '46px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: index === active ? 'rgba(245,145,30,.16)' : 'transparent',
                  fontFamily: font.body,
                  fontSize: '14.5px',
                  color: color.ink,
                }}
              >
                {prediction.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
