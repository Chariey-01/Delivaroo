import { checkPassword, STRENGTH_STEPS } from '../../lib/passwordStrength';
import { color, font, radius } from '../../theme';
import Icon from '../Icon';

const TONE = {
  danger: color.orangeDeep,
  warn: color.orange,
  ok: color.green,
};

/**
 * The meter and the checklist under a new-password field.
 *
 * The checklist separates the one rule the server enforces from the four that only
 * make the password better, and says so in as many words. Everything here is derived
 * from the value the field already holds — nothing about the password is stored,
 * copied or sent anywhere.
 */
export default function PasswordStrength({ value, id }) {
  const { rules, score, label, tone } = checkPassword(value);
  const active = TONE[tone];
  const [required, ...advice] = rules;

  return (
    <div id={id} style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          aria-hidden="true"
          style={{ display: 'flex', gap: '5px', flex: '1 1 auto' }}
        >
          {Array.from({ length: STRENGTH_STEPS }, (unused, index) => (
            <span
              key={index}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: radius.pill,
                background: index < score ? active : color.border,
                transition: 'background .3s ease'
              }}
            />
          ))}
        </span>
        {/* Announced politely: the strength changes on every keystroke, and a live
            region that interrupts would be unusable. */}
        <span
          aria-live="polite"
          style={{
            minWidth: '7ch',
            textAlign: 'right',
            fontFamily: font.mono,
            fontSize: '11.5px',
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: value ? active : color.muted
          }}
        >
          {value ? label : ''}
        </span>
      </div>

      <ul
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px 16px',
          margin: '12px 0 0',
          padding: 0,
          listStyle: 'none',
          fontSize: '12.5px',
          lineHeight: 1.5,
          color: color.body
        }}
      >
        <Rule rule={required} emphasis />
        {advice.map((rule) => (
          <Rule key={rule.id} rule={rule} />
        ))}
      </ul>
      <p style={{ margin: '9px 0 0', fontSize: '12px', lineHeight: 1.5, color: color.muted }}>
        Only the first is required. The rest are what turn a password that passes into
        one that holds.
      </p>
    </div>
  );
}

function Rule({ rule, emphasis = false }) {
  const met = rule.met;
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flex: '0 1 auto',
        color: met ? color.green : emphasis ? color.ink : color.muted,
        fontWeight: emphasis ? 600 : 400,
        transition: 'color .2s ease'
      }}
    >
      <Icon
        name={met ? 'check_circle' : 'radio_button_unchecked'}
        size={15}
        color="currentColor"
      />
      {/* The state is spelled out for assistive tech; the glyph carries it visually. */}
      <span>{rule.label}</span>
      <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        {met ? ' — met' : ' — not met'}
      </span>
    </li>
  );
}
