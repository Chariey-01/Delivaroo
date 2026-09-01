import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../api/notifications';
import { usingMockBackend } from '../api';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Icon from '../components/Icon';
import PageShell from './PageShell';
import { color, font } from '../theme';

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : '';

const defaultPreferences = {
  email_enabled: true,
  sms_enabled: false,
  status_updates: true,
  location_updates: true,
};

export default function Notifications() {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(!usingMockBackend);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (usingMockBackend) return;
    setLoading(true);
    setError('');
    try {
      const [inbox, savedPreferences] = await Promise.all([
        listNotifications({ perPage: 50 }),
        getNotificationPreferences(),
      ]);
      setNotifications(inbox || []);
      setPreferences({ ...defaultPreferences, ...savedPreferences });
    } catch (requestError) {
      setError(requestError.message || 'Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const markRead = async (notification) => {
    if (notification.read_at) return;
    try {
      const saved = await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    } catch (requestError) {
      setError(requestError.message || 'Notification could not be updated.');
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    } catch (requestError) {
      setError(requestError.message || 'Notifications could not be updated.');
    }
  };

  const updatePreference = async (field, value) => {
    const previous = preferences;
    const next = { ...preferences, [field]: value };
    setPreferences(next);
    setSaving(true);
    try {
      const saved = await updateNotificationPreferences({ [field]: value });
      setPreferences({ ...defaultPreferences, ...saved });
    } catch (requestError) {
      setPreferences(previous);
      setError(requestError.message || 'Preference could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const unread = notifications.filter((notification) => !notification.read_at).length;

  return (
    <PageShell
      eyebrow={unread ? `${unread} unread` : 'All caught up'}
      title="Notifications"
      aside={
        unread ? (
          <Button variant="ghostLight" icon="done_all" iconPosition="left" onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null
      }
    >
      {error && (
        <div role="alert" style={{ marginBottom: '18px', color: color.orangeDeep, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {usingMockBackend ? (
        <EmptyState icon="notifications_none" title="Notifications appear here" body="Connect to the live backend to see delivery updates and manage notification preferences." />
      ) : loading ? (
        <p style={{ color: color.muted }}>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <EmptyState icon="notifications_none" title="No notifications yet" body="Delivery updates and account messages will appear here." />
      ) : (
        <div style={{ borderTop: '1px solid rgba(17,17,17,.12)' }}>
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markRead(notification)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr)',
                gap: '12px',
                padding: '18px 4px',
                textAlign: 'left',
                border: 'none',
                borderBottom: '1px solid rgba(17,17,17,.12)',
                background: 'transparent',
                color: color.ink,
                cursor: notification.read_at ? 'default' : 'pointer',
              }}
            >
              <span style={{ paddingTop: '4px' }}>
                <Icon name={notification.read_at ? 'notifications_none' : 'notifications'} size={20} color={notification.read_at ? color.muted : color.orangeDeep} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px', alignItems: 'baseline' }}>
                  <strong style={{ fontFamily: font.display, fontSize: '18px', letterSpacing: 0 }}>{notification.title}</strong>
                  <time style={{ marginLeft: 'auto', fontSize: '12px', color: color.muted }}>{formatTime(notification.created_at)}</time>
                </span>
                <span style={{ display: 'block', marginTop: '3px', color: color.body, lineHeight: 1.55 }}>{notification.message}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {!usingMockBackend && (
        <section style={{ marginTop: 'clamp(42px,6vw,72px)', maxWidth: '620px' }} aria-labelledby="notification-preferences">
          <h2 id="notification-preferences" style={{ margin: '0 0 8px', fontFamily: font.display, fontSize: '28px', letterSpacing: 0, color: color.ink }}>
            Delivery preferences
          </h2>
          <div style={{ display: 'grid', borderTop: '1px solid rgba(17,17,17,.12)' }}>
            {[
              ['email_enabled', 'Email updates'],
              ['sms_enabled', 'SMS updates'],
              ['status_updates', 'Parcel status updates'],
              ['location_updates', 'Parcel location updates'],
            ].map(([field, label]) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '15px 0', borderBottom: '1px solid rgba(17,17,17,.12)', fontWeight: 700, color: color.ink }}>
                {label}
                <input type="checkbox" checked={Boolean(preferences[field])} disabled={saving} onChange={(event) => updatePreference(field, event.target.checked)} style={{ width: '18px', height: '18px', accentColor: color.orangeDeep }} />
              </label>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
