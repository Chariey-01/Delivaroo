import { useId, useState } from 'react';
import { color, control, font } from '../../theme';
import Icon from '../Icon';

/**
 * Labelled text input. Inline styles have no :focus, so focus is tracked in state —
 * the same reason useHover exists. Errors are wired with aria-describedby (§24).
 */
export default function Field({
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  onKeyDown,
  inputRef,
  disabled,
  ...rest
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && passwordVisible ? 'text' : type;

  return (
    <div style={{ display: 'block' }} {...rest}>
      {label && <label htmlFor={id} style={control.label}>{label}</label>}
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          id={id}
          ref={inputRef}
          type={inputType}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onKeyDown={onKeyDown}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          disabled={disabled}
          style={{
            ...control.field,
            ...(isPassword ? { paddingRight: '56px' } : null),
            ...(focused ? control.fieldFocus : null),
            ...(error ? control.fieldInvalid : null)
          }}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setPasswordVisible((visible) => !visible)}
            style={{
              position: 'absolute',
              top: '50%',
              right: '6px',
              display: 'grid',
              width: '44px',
              height: '44px',
              placeItems: 'center',
              transform: 'translateY(-50%)',
              border: 'none',
              borderRadius: '10px',
              background: 'transparent',
              color: color.muted,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} size={20} color="currentColor" />
          </button>
        )}
      </span>
      {(error || hint) && (
        <span
          id={`${id}-note`}
          role={error ? 'alert' : undefined}
          style={{
            display: 'block',
            marginTop: '7px',
            fontSize: '13px',
            fontFamily: font.body,
            color: error ? color.orangeDeep : color.muted
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
