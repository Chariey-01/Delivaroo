import { useCallback, useEffect, useState } from 'react';
import { listAdminReviews, moderateReview } from '../../api/reviews';
import { color, control, font, radius } from '../../theme';
import Panel from '../../components/admin/Panel';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function AdminReviews() {
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: { total: 0, pages: 1 } });
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const load = useCallback(() => { setState('loading'); setError(''); listAdminReviews({ status: filter, page, per_page: 10 }).then((result) => { setData(result); setState('ready'); }).catch((err) => { setError(err.message); setState('error'); }); }, [filter, page]);
  useEffect(load, [load]);
  const decide = async (review, decision) => {
    if (!window.confirm(`${decision === 'approve' ? 'Publish' : 'Reject'} this review?`)) return;
    setState(`saving-${review.id}`); setError('');
    try { await moderateReview(review.id, decision); load(); } catch (err) { setError(err.message); setState('ready'); }
  };
  return <Panel title={`Moderation queue · ${data.pagination.total}`} note="Only approved reviews are published. Customer contact details remain private." action={<select aria-label="Review status" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} style={{ ...control.field, width: 'auto', height: '44px' }}>{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>}>
    {error && <p role="alert" style={{ color: color.orangeDeep, marginBottom: '14px' }}>{error}</p>}
    {state === 'loading' ? <p role="status" style={{ color: color.muted }}>Loading reviews…</p> : data.items.length === 0 ? <EmptyState icon="reviews" title={`No ${filter} reviews`} body="Reviews will appear here after customers submit feedback for delivered parcels." /> : <div style={{ display: 'grid', gap: '12px' }}>{data.items.map((review) => <article key={review.id} style={{ padding: '18px', borderRadius: radius.field, background: 'rgba(255,255,255,.82)', border: `1px solid ${color.border}` }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px' }}><strong style={{ color: color.ink }}>{review.customer_name}</strong><span aria-label={`${review.rating} out of 5 stars`} style={{ color: color.orangeDeep }}>{'★'.repeat(review.rating)}</span></header>
      <p style={{ margin: '12px 0', color: color.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{review.comment}</p>
      <div style={{ fontFamily: font.mono, fontSize: '12px', color: color.muted }}>Parcel {review.parcel_id.slice(0, 8)} · {new Date(review.created_at).toLocaleString('en-KE')} · {labels[review.status]}</div>
      {review.status === 'pending' && <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}><Button size="sm" disabled={state === `saving-${review.id}`} onClick={() => decide(review, 'approve')}>Approve</Button><Button size="sm" variant="danger" disabled={state === `saving-${review.id}`} onClick={() => decide(review, 'reject')}>Reject</Button></div>}
    </article>)}</div>}
    {data.pagination.pages > 1 && <nav aria-label="Review pages" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px' }}><Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span>Page {page} of {data.pagination.pages}</span><Button size="sm" variant="ghost" disabled={page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button></nav>}
  </Panel>;
}
