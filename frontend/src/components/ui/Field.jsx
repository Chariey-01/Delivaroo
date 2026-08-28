import { useId, useState } from 'react';
import { color, control, font } from '../../theme';

/**
 * Labelled text input. Inline styles have no :focus, so focus is tracked in state.
 * Errors are wired through aria-describedby and aria-invalid so a screen reader hears
 * the message that the sighted user reads under the box.
 */
export default function Field({
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  name,
  placeholder,
  autoComplete,
  required,
  disabled,
  onKeyDown,
  inputRef,
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const noteId = `${id}-note`;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={id} style={control.label}>
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? noteId : undefined}
        style={{
          ...control.field,
          ...(focused ? control.fieldFocus : null),
          ...(error ? control.fieldInvalid : null),
          ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : null),
        }}
      />
      {(error || hint) && (
        <span
          id={noteId}
          role={error ? 'alert' : undefined}
          style={{
            display: 'block',
            marginTop: '7px',
            fontSize: '13px',
            fontFamily: font.body,
            color: error ? color.danger : color.muted,
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
