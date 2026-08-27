import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { makeStore } from '../../src/store';
import { AppRoutes } from '../../src/App';
import { setTokens } from '../../src/lib/tokenStorage';

test('debug expired token', async () => {
  setTokens({ access: 'expired' });
  global.fetch = jest.fn(async () => ({
    ok: false, status: 401, text: async () => JSON.stringify({ message: 'Token has expired' }),
  }));

  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );

  await waitFor(() => expect(store.getState().auth.status).toBe('ready'));
  console.log('AUTH STATE:', JSON.stringify(store.getState().auth));
  console.log('FETCH CALLS:', global.fetch.mock.calls.map(c => c[0]));
  await new Promise(r => setTimeout(r, 200));
  console.log('BODY LEN:', document.body.innerHTML.length);
  console.log('HAS main:', document.body.innerHTML.includes('<main'));
  console.log('H1:', [...document.querySelectorAll('h1')].map(h=>h.textContent));
});
