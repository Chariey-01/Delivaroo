import { useId, useState } from 'react';
import { color, control, font, radius } from '../../theme';
import Icon from '../Icon';

/**
 * Labelled text input. Inline styles have no :focus, so focus is tracked in state —
 * the same reason useHover exists. Errors are wired with aria-describedby (§24).
 *
 * `valid` draws the quiet tick that tells someone a field is settled without them
 * having to submit to find out. Password fields never get one: the eye button already
 * owns that corner, and "this password is well formed" is not news worth the clash.
 */
export default function Field({
  label,
  value,
  onChange,
  error,
  hint,
  valid = false,
  type = 'text',
  name,
  inputMode,
  placeholder,
  autoComplete,
  autoFocus,
  required,
  describedBy,
  onKeyDown,
  onBlur,
  inputRef,
  disabled,
  ...rest
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && passwordVisible ? 'text' : type;
  const showTick = valid && !error && !isPassword;

  // Both the note and anything the caller owns (a strength meter, say) are announced.
  const noteId = error || hint ? `${id}-note` : null;
  const description = [noteId, describedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div style={{ display: 'block' }} {...rest}>
      {label && (
        <label htmlFor={id} style={control.label}>
          {label}
          {required === false && (
            <span style={{ marginLeft: '7px', letterSpacing: '.06em', color: color.muted, opacity: 0.75 }}>
              optional
            </span>
          )}
        </label>
      )}
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          id={id}
          name={name}
          ref={inputRef}
          type={inputType}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required === true || undefined}
          onKeyDown={onKeyDown}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={description}
          disabled={disabled}
          style={{
            ...control.field,
            ...(isPassword || showTick ? { paddingRight: '56px' } : null),
            ...(focused ? control.fieldFocus : null),
            ...(valid && !error ? { borderColor: 'rgba(36,75,66,.55)' } : null),
            ...(error ? control.fieldInvalid : null),
            ...(disabled ? { background: color.paper, color: color.muted, cursor: 'not-allowed' } : null)
          }}
        />
        {isPassword && (
          <button
            type="button"
            // The label states the action, `aria-pressed` states the current state —
            // between them a screen reader user knows both without guessing.
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            title={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            disabled={disabled}
            // Keeps the caret and the browser's own password-manager focus where they
            // were: toggling visibility is not a reason to leave the field.
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
              borderRadius: '12px',
              background: 'transparent',
              color: passwordVisible ? color.green : color.muted,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'color .18s ease, background .18s ease'
            }}
            className="auth-icon-button"
          >
            <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} size={20} color="currentColor" />
          </button>
        )}
        {showTick && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              right: '18px',
              transform: 'translateY(-50%)',
              display: 'grid',
              placeItems: 'center',
              width: '22px',
              height: '22px',
              borderRadius: radius.pill,
              background: 'rgba(36,75,66,.12)',
              color: color.green,
              animation: 'popIn .22s cubic-bezier(.16,1,.3,1) both'
            }}
          >
            <Icon name="check" size={15} color="currentColor" />
          </span>
        )}
      </span>
      {(error || hint) && (
        <span
          id={noteId}
          role={error ? 'alert' : undefined}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginTop: '7px',
            fontSize: '13px',
            lineHeight: 1.45,
            fontFamily: font.body,
            color: error ? color.orangeDeep : color.muted
          }}
        >
          {error && <Icon name="error" size={15} color="currentColor" style={{ marginTop: '1px', flex: 'none' }} />}
          {error || hint}
        </span>
      )}
    </div>
  );
}
