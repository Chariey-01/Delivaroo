// W3-03 — smoke tests for the team integration activity.
//
// Deliberately shallow and fast: these answer "is the app standing up?" rather than
// "is this feature correct?". They are the checks to run first after a merge, because
// when one of them fails, nothing else is worth reading.

import { render, screen, within } from '@testing-library/react';
import App from '../../App';
import { clearTokens } from '../../lib/tokenStorage';
import { mockApi, renderApp, signedOutState } from '../testUtils';

beforeEach(() => {
  clearTokens();
  mockApi({});
});

describe('smoke: the app stands up', () => {
  test('App mounts with its own store and router, without crashing', () => {
    render(<App />);
    expect(screen.getByText('Delivaroo')).toBeInTheDocument();
  });

  test('the store is wired with every reducer the app reads', () => {
    const { store } = renderApp({ preloadedState: signedOutState });
    const state = store.getState();

    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('ui');
  });
});

describe('smoke: every public route renders', () => {
  const routes = [
    ['/', /send it/i],
    ['/login', /welcome back/i],
    ['/signup', /create your account/i],
    ['/unauthorized', /don't have access/i],
    ['/definitely-not-a-route', /page not found/i],
  ];

  test.each(routes)('%s renders its screen', async (route, heading) => {
    renderApp({ route, preloadedState: signedOutState });
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });
});

describe('smoke: navigation reflects the session', () => {
  test('signed out, the nav offers sign in and sign up', async () => {
    renderApp({ preloadedState: signedOutState });

    // Scoped to the nav: the landing page carries its own sign-in call to action.
    const nav = within(await screen.findByRole('navigation'));

    expect(nav.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });
});

describe('smoke: the auth forms are usable', () => {
  test('login exposes both fields and a submit button', async () => {
    renderApp({ route: '/login', preloadedState: signedOutState });

    expect(await screen.findByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('signup exposes every field the register endpoint needs', async () => {
    renderApp({ route: '/signup', preloadedState: signedOutState });

    expect(await screen.findByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });
});
