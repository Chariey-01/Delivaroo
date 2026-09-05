import { useEffect, useState } from 'react';
import { listPublicReviews } from '../../api/reviews';
import { color, font, radius, shadow } from '../../theme';

export default function Testimonials() {
  const [state, setState] = useState({ loading: true, items: [], error: '' });
  useEffect(() => { listPublicReviews({ per_page: 6 }).then((data) => setState({ loading: false, items: data.items || [], error: '' })).catch((error) => setState({ loading: false, items: [], error: error.message })); }, []);
  return (
    <section aria-labelledby="customer-feedback" style={{ padding: 'clamp(56px,8vw,100px) clamp(20px,5vw,72px)', background: color.paper }}>
      <p style={{ marginBottom: '8px', color: color.orangeDeep, fontWeight: 700 }}>Verified deliveries</p>
      <h2 id="customer-feedback" style={{ margin: 0, fontFamily: font.display, fontSize: 'clamp(32px,5vw,54px)', color: color.ink }}>What customers say</h2>
      {state.loading ? <p role="status" style={{ marginTop: '24px', color: color.body }}>Loading customer feedback…</p> : state.error ? <p role="alert" style={{ marginTop: '24px', color: color.body }}>Customer feedback is temporarily unavailable.</p> : state.items.length === 0 ? <p style={{ marginTop: '24px', color: color.body }}>Customer feedback will appear here after completed deliveries.</p> : (
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: '16px' }}>
          {state.items.map((item) => <article key={item.id} style={{ padding: '24px', borderRadius: radius.card, border: `1px solid ${color.borderSoft}`, background: color.card, boxShadow: shadow.card }}>
            <div aria-label={`${item.rating} out of 5 stars`} style={{ color: color.orangeDeep, letterSpacing: '3px' }}>{'★'.repeat(item.rating)}<span aria-hidden="true" style={{ color: color.border }}>{'★'.repeat(5-item.rating)}</span></div>
            <p style={{ margin: '16px 0', color: color.ink, lineHeight: 1.65 }}>{item.comment}</p>
            <footer style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: color.muted, fontSize: '13px' }}><strong style={{ color: color.body }}>{item.customer_name}</strong><span>✓ Verified delivery</span></footer>
          </article>)}
        </div>
      )}
    </section>
  );
}
