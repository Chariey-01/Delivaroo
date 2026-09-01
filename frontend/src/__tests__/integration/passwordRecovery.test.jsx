import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CUSTOMER_USER, fail, mockApi, ok, renderApp, renderSignedIn, signedOutState } from '../testUtils';

const type = async (user, label, value) => user.type(await screen.findByLabelText(label), value);

describe('password recovery', () => {
  test('requests a reset only after a valid email and waits for the API response', async () => {
    const user = userEvent.setup();
    const calls = mockApi({
      'POST /api/auth/forgot-password': ok(null, 'If the email exists, a password reset link will be sent'),
    });

    renderApp({ route: '/forgot-password', preloadedState: signedOutState });

    await type(user, /email address/i, 'customer@delivaroo.test');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/if the email exists/i);
    expect(calls[0].body).toEqual({ email: 'customer@delivaroo.test' });
  });

  test('shows reset failures instead of claiming success', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/reset-password': fail(400, 'Password reset token has expired') });

    renderApp({ route: '/reset-password?token=expired-token', preloadedState: signedOutState });

    await type(user, /^new password$/i, 'new-password');
    await type(user, /confirm new password/i, 'new-password');
    await user.click(screen.getByRole('button', { name: /^reset password$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Password reset token has expired');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('changes the signed-in user password through the protected API', async () => {
    const user = userEvent.setup();
    renderSignedIn(CUSTOMER_USER, {
      route: '/settings/security',
      routes: { 'POST /api/auth/change-password': ok(null, 'Password changed successfully') },
    });

    await type(user, /current password/i, 'old-password');
    await type(user, /^new password$/i, 'new-password');
    await type(user, /confirm new password/i, 'new-password');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Password changed successfully');
  });
});
