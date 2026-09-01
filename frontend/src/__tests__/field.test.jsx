import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Field from '../components/ui/Field';

function PasswordField() {
  const [value, setValue] = useState('');
  return <Field label="Password" name="password" type="password" value={value} onChange={setValue} required />;
}

test('password visibility toggle preserves the value and announces its action', async () => {
  const user = userEvent.setup();
  render(<PasswordField />);

  const input = screen.getByLabelText('Password');
  expect(input).toHaveAttribute('name', 'password');
  expect(input).toBeRequired();
  expect(input).toHaveAttribute('autocapitalize', 'none');
  expect(input).toHaveAttribute('spellcheck', 'false');
  await user.type(input, 'top-secret');

  const show = screen.getByRole('button', { name: 'Show password' });
  expect(input).toHaveAttribute('type', 'password');
  await user.click(show);

  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveValue('top-secret');
  expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

  await user.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(input).toHaveAttribute('type', 'password');
  expect(input).toHaveValue('top-secret');
});
