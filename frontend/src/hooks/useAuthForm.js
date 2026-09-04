import { useCallback, useMemo, useState } from 'react';

/**
 * The shared behaviour of the four authentication forms.
 *
 * The rule it exists to enforce is *when* a field is allowed to complain. Validating
 * on every keystroke marks an email invalid while it is still being typed; validating
 * only on submit hides a fixable typo behind a round trip. So a field speaks up once
 * it has been left (blurred) or once submit has been pressed, and from then on it
 * re-checks live — which is also what makes an error disappear the moment it is fixed.
 *
 * `validators` is a map of field name → (value, values) => message | null. The second
 * argument is what lets "confirm password" see the password it has to match.
 */
export default function useAuthForm({ initialValues, validators }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Errors are derived, never stored: one source of truth means a field cannot be
  // left showing a complaint about a value it no longer holds.
  const errors = useMemo(() => {
    const found = {};
    for (const [field, validate] of Object.entries(validators)) {
      const message = validate(values[field], values);
      if (message) found[field] = message;
    }
    return found;
  }, [validators, values]);

  const shows = useCallback(
    (field) => Boolean(submitted || touched[field]),
    [submitted, touched],
  );

  const setValue = useCallback((field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }));
  }, []);

  const blur = useCallback((field) => () => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  }, []);

  /** Marks everything touched and reports whether the form may be submitted. */
  const validateAll = useCallback(() => {
    setSubmitted(true);
    return Object.keys(errors).length === 0;
  }, [errors]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setSubmitted(false);
  }, [initialValues]);

  return {
    values,
    errors,
    valid: Object.keys(errors).length === 0,
    setValue,
    blur,
    validateAll,
    reset,
    /** The message to render for a field — null until the field has earned one. */
    errorFor: (field) => (shows(field) ? errors[field] ?? null : null),
    /** True once a field holds something and that something checks out. */
    okFor: (field) => Boolean(shows(field) && values[field] && !errors[field]),
    /** Field props every input needs, so no route has to remember all four. */
    fieldProps: (field) => ({
      value: values[field],
      onChange: setValue(field),
      onBlur: blur(field),
      error: shows(field) ? errors[field] ?? null : null,
      valid: Boolean(shows(field) && values[field] && !errors[field]),
    }),
  };
}
