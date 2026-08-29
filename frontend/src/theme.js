// Single source of truth for the values repeated across the inline styles.
// Kept deliberately small — the visual design is another task's territory; this is
// only enough shared vocabulary for the auth and map screens to look intentional.

export const color = {
  ink: '#141414',
  body: '#4A5A61',
  muted: '#6E6862',
  paper: '#F3F1ED',
  white: '#FFFFFF',
  orange: '#F5911E',
  orangeDeep: '#C4700F',
  // The kite in the logo only — the UI accent above is a separate, softer orange.
  brand: '#FF5000',
  danger: '#B3261E',
  success: '#1E7B4F',
};

export const font = {
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

export const radius = {
  field: '14px',
  card: '22px',
  pill: '999px',
};

export const control = {
  field: {
    width: '100%',
    height: '52px',
    padding: '0 16px',
    borderRadius: radius.field,
    // Longhand, not the `border` shorthand: the focus and invalid states below
    // override borderColor alone, and React warns when a shorthand and one of its
    // longhands are mixed across renders.
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: 'rgba(17,17,17,.14)',
    background: color.white,
    fontFamily: font.body,
    fontSize: '16px',
    color: color.ink,
    outline: 'none',
    transition: 'border-color .18s, box-shadow .18s',
  },
  fieldFocus: {
    borderColor: color.orange,
    boxShadow: '0 0 0 3px rgba(245,145,30,.22)',
  },
  fieldInvalid: {
    borderColor: color.danger,
    boxShadow: '0 0 0 3px rgba(179,38,30,.15)',
  },
  label: {
    display: 'block',
    marginBottom: '7px',
    fontSize: '13.5px',
    fontWeight: 600,
    color: color.body,
  },
};
