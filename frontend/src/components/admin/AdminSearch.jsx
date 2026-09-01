import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { selectAllOrders } from '../../store/ordersSlice';
import { selectCouriers, selectNotifications, selectUsers } from '../../store/adminSlice';
import { PERMISSION, ROLE_LABEL, can, roleOf } from '../../lib/roles';
import { STATUS_LABEL } from '../../lib/orderStatus';
import { color, control, font, radius } from '../../theme';
import { SECTIONS } from './adminSections';
import Icon from '../Icon';

const searchable = (values, needle) =>
  values.filter(Boolean).some((value) => String(value).toLowerCase().includes(needle));

const routeWithSearch = (path, value) => `${path}?search=${encodeURIComponent(value)}`;

export default function AdminSearch() {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const orders = useSelector(selectAllOrders);
  const couriers = useSelector(selectCouriers);
  const users = useSelector(selectUsers);
  const notifications = useSelector(selectNotifications);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];

    const found = [];

    for (const order of orders) {
      const values = [
        order.id,
        order.trackingNumber,
        order.pickup?.label,
        order.destination?.label,
        order.sender?.name,
        order.sender?.email,
        order.courier?.name
      ];
      if (!searchable(values, needle)) continue;
      found.push({
        id: `order-${order.id}`,
        kind: 'Delivery',
        label: order.id || order.trackingNumber,
        detail: `${order.pickup?.name || order.pickup?.label || 'Pickup'} to ${order.destination?.name || order.destination?.label || 'destination'} · ${STATUS_LABEL[order.status] || order.status}`,
        icon: 'inventory_2',
        to: routeWithSearch('/admin/deliveries', order.id || order.trackingNumber)
      });
    }

    if (can(user, PERMISSION.MANAGE_COURIERS)) {
      for (const courier of couriers) {
        if (!searchable([courier.name, courier.phone, courier.plate, courier.vehicle], needle)) continue;
        found.push({
          id: `courier-${courier.id}`,
          kind: 'Courier',
          label: courier.name,
          detail: [courier.vehicle, courier.plate, courier.onShift ? 'On shift' : 'Off shift'].filter(Boolean).join(' · '),
          icon: 'two_wheeler',
          to: routeWithSearch('/admin/couriers', courier.name)
        });
      }
    }

    if (can(user, PERMISSION.VIEW_ACCOUNTS)) {
      for (const account of users) {
        if (!searchable([account.name, account.email, account.phone, roleOf(account)], needle)) continue;
        const searchValue = account.email || account.phone || account.name;
        found.push({
          id: `account-${account.id}`,
          kind: 'Account',
          label: account.name || account.email || account.phone,
          detail: [account.email || account.phone, ROLE_LABEL[roleOf(account)]].filter(Boolean).join(' · '),
          icon: 'person',
          to: routeWithSearch('/admin/accounts', searchValue)
        });
      }
    }

    if (can(user, PERMISSION.VIEW_NOTIFICATIONS)) {
      for (const entry of notifications) {
        if (!searchable([entry.orderId, entry.to, entry.message], needle)) continue;
        const searchValue = entry.orderId || entry.to;
        found.push({
          id: `notification-${entry.id}`,
          kind: 'Notification',
          label: entry.orderId || 'Customer message',
          detail: [entry.to, entry.message].filter(Boolean).join(' · '),
          icon: 'mail',
          to: routeWithSearch('/admin/notifications', searchValue)
        });
      }
    }

    for (const section of SECTIONS) {
      if (!can(user, section.permission) || !searchable([section.label, section.title, section.blurb], needle)) continue;
      found.push({
        id: `section-${section.id}`,
        kind: 'Section',
        label: section.label,
        detail: section.blurb,
        icon: section.icon,
        to: section.to
      });
    }

    return found.slice(0, 8);
  }, [couriers, notifications, orders, query, user, users]);

  const hasQuery = query.trim().length >= 2;
  const showResults = open && hasQuery;
  const selectedIndex = results.length ? Math.min(activeIndex, results.length - 1) : 0;

  const choose = (to) => {
    setOpen(false);
    setQuery('');
    navigate(to);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && showResults && results[selectedIndex]) {
      event.preventDefault();
      choose(results[selectedIndex].to);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div
      role="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      style={{ position: 'relative', width: '100%', maxWidth: '760px', marginBottom: 'clamp(22px,3vw,32px)' }}
    >
      <label htmlFor="admin-search" style={{ ...control.label, marginBottom: '8px' }}>
        Search admin records
      </label>
      <span style={{ position: 'relative', display: 'block' }}>
        <Icon
          name="search"
          size={20}
          color={color.muted}
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          ref={inputRef}
          id="admin-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="admin-search-results"
          aria-activedescendant={showResults && results[selectedIndex] ? results[selectedIndex].id : undefined}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search deliveries, couriers, accounts or sections"
          style={{ ...control.field, height: '52px', paddingLeft: '48px', paddingRight: query ? '52px' : '16px' }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear admin search"
            onClick={() => {
              setQuery('');
              setOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: '4px',
              top: '4px',
              display: 'grid',
              width: '44px',
              height: '44px',
              placeItems: 'center',
              border: 0,
              borderRadius: '10px',
              background: 'transparent',
              color: color.muted,
              cursor: 'pointer'
            }}
          >
            <Icon name="close" size={19} color="currentColor" />
          </button>
        )}
      </span>

      {showResults && (
        <div
          id="admin-search-results"
          role="listbox"
          aria-label="Admin search results"
          style={{
            position: 'absolute',
            zIndex: 30,
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            overflow: 'hidden',
            border: '1px solid rgba(17,17,17,.14)',
            borderRadius: radius.card,
            background: color.white,
            boxShadow: '0 24px 48px -26px rgba(17,17,17,.42)'
          }}
        >
          {results.length ? (
            results.map((result, index) => (
              <Link
                key={result.id}
                id={result.id}
                to={result.to}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={(event) => {
                  event.preventDefault();
                  choose(result.to);
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px minmax(0,1fr)',
                  gap: '12px',
                  alignItems: 'center',
                  minHeight: '68px',
                  padding: '10px 14px',
                  borderTop: index ? '1px solid rgba(17,17,17,.08)' : 'none',
                  background: index === selectedIndex ? 'rgba(245,145,30,.12)' : color.white,
                  color: color.ink
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    width: '40px',
                    height: '40px',
                    placeItems: 'center',
                    borderRadius: '12px',
                    background: index === selectedIndex ? color.orange : 'rgba(17,17,17,.06)'
                  }}
                >
                  <Icon name={result.icon} size={19} color={color.ink} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'flex', gap: '8px', alignItems: 'baseline', minWidth: 0 }}>
                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
                      {result.label}
                    </strong>
                    <span style={{ flex: 'none', fontFamily: font.mono, fontSize: '9px', textTransform: 'uppercase', color: color.orangeDeep }}>
                      {result.kind}
                    </span>
                  </span>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '3px', fontSize: '12.5px', color: color.muted }}>
                    {result.detail}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <div style={{ padding: '18px', fontSize: '14px', color: color.body }}>
              No admin records match “{query.trim()}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
