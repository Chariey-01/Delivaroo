import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { makeStore } from '../store';
import { AppRoutes } from '../App';
import { setTokens, clearTokens } from '../lib/tokenStorage';

const mount = (route) => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

const four01 = () => {
  global.fetch = jest.fn(async () => ({
    ok: false, status: 401, text: async () => JSON.stringify({ message: 'Token has expired' }),
  }));
};

test('A: start directly at /login with expired token', async () => {
  clearTokens(); setTokens({ access: 'expired' }); four01();
  const store = mount('/login');
  await waitFor(() => expect(store.getState().auth.status).toBe('ready'));
  await waitFor(() => expect(document.body.textContent).toMatch(/Welcome back/i), { timeout: 3000 })
    .then(() => console.log('A: Login rendered'))
    .catch(() => console.log('A: FAILED text=', JSON.stringify(document.body.textContent)));
});

test('B: start at /dashboard with NO token (fulfilled null)', async () => {
  clearTokens();
  global.fetch = jest.fn(async () => { throw new Error('should not fetch'); });
  const store = mount('/dashboard');
  await waitFor(() => expect(store.getState().auth.status).toBe('ready'));
  await waitFor(() => expect(document.body.textContent).toMatch(/Welcome back/i), { timeout: 3000 })
    .then(() => console.log('B: Login rendered'))
    .catch(() => console.log('B: FAILED text=', JSON.stringify(document.body.textContent)));
});

test('C: start at /dashboard with expired token (rejected)', async () => {
  clearTokens(); setTokens({ access: 'expired' }); four01();
  const store = mount('/dashboard');
  await waitFor(() => expect(store.getState().auth.status).toBe('ready'));
  await waitFor(() => expect(document.body.textContent).toMatch(/Welcome back/i), { timeout: 3000 })
    .then(() => console.log('C: Login rendered'))
    .catch(() => console.log('C: FAILED text=', JSON.stringify(document.body.textContent)));
});
