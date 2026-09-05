import { useEffect, useState } from 'react';
import { createReview, listMyReviews } from '../../api/reviews';
import { color, control, font, radius } from '../../theme';
import Button from '../ui/Button';

export default function ReviewForm({ parcelId }) {
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listMyReviews({ per_page: 50 }).then((data) => {
      if (!active) return;
      setReview((data.items || []).find((item) => item.parcel_id === parcelId) || null);
      setState('ready');
    }).catch((err) => { if (active) { setError(err.message); setState('ready'); } });
    return () => { active = false; };
  }, [parcelId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return setError('Choose a rating from 1 to 5 stars.');
    if (comment.trim().length < 10) return setError('Please write at least 10 characters.');
    setState('submitting'); setError('');
    try { setReview(await createReview(parcelId, rating, comment.trim())); setState('ready'); }
    catch (err) { setError(err.message); setState('ready'); }
  };

  if (state === 'loading') return <p role="status" style={{ color: color.muted }}>Checking review status…</p>;
  if (review) return (
    <div role="status" style={{ padding: '16px', borderRadius: radius.field, background: 'rgba(36,75,66,.07)' }}>
      <strong style={{ color: color.ink }}>Thank you. Your review has been submitted for approval.</strong>
      <span style={{ display: 'block', marginTop: '5px', color: color.body }}>Moderation status: {review.status}</span>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ ...control.label }}>Your rating</legend>
        <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: '6px' }}>
          {[1,2,3,4,5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value > 1 ? 's' : ''}`} onClick={() => setRating(value)} style={{ border: 0, background: 'transparent', color: value <= rating ? color.orangeDeep : color.muted, fontSize: '30px', cursor: 'pointer' }}>★</button>)}
        </div>
      </fieldset>
      <label>
        <span style={control.label}>Your feedback</span>
        <textarea value={comment} minLength={10} maxLength={1000} required onChange={(e) => setComment(e.target.value)} style={{ ...control.field, height: '130px', padding: '14px 16px', resize: 'vertical' }} />
        <span style={{ display: 'block', textAlign: 'right', fontFamily: font.mono, fontSize: '12px', color: color.muted }}>{comment.length}/1000</span>
      </label>
      {error && <p role="alert" style={{ color: color.orangeDeep }}>{error}</p>}
      <Button type="submit" disabled={state === 'submitting'}>{state === 'submitting' ? 'Submitting…' : 'Submit review'}</Button>
    </form>
  );
}
