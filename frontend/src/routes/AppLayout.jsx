// The shell every screen sits inside.
//
// It asks the one question the whole app depends on — "is anyone signed in?" — exactly
// once, on mount. Every guard then reads the answer from the store rather than each
// screen firing its own /auth/me.

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadSession } from '../store/authSlice';
import { color, font } from '../theme';
import Nav from '../components/Nav';
import Toast from '../components/Toast';

export default function AppLayout() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  return (
    <div style={{ minHeight: '100vh', background: color.paper, fontFamily: font.body, color: color.body }}>
      <Nav />
      <Outlet />
      <Toast />
    </div>
  );
}
