import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Testimonials from '../components/reviews/Testimonials';
import ReviewForm from '../components/reviews/ReviewForm';

const response = (data, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(JSON.stringify({ data })),
});

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; jest.restoreAllMocks(); });

it('shows an honest testimonial empty state without fallback quotes', async () => {
  global.fetch.mockReturnValue(response({ items: [], pagination: { total: 0 } }));
  render(<Testimonials />);
  expect(await screen.findByText('Customer feedback will appear here after completed deliveries.')).toBeInTheDocument();
});

it('renders only API-provided public testimonial content safely', async () => {
  global.fetch.mockReturnValue(response({ items: [{ id: 'r1', rating: 5, comment: '<img src=x onerror=alert(1)> Careful delivery', customer_name: 'Amina' }] }));
  const { container } = render(<Testimonials />);
  expect(await screen.findByText(/Careful delivery/)).toBeInTheDocument();
  expect(container.querySelector('img')).toBeNull();
});

it('validates and submits a delivered parcel review', async () => {
  const fetch = global.fetch
    .mockReturnValueOnce(response({ items: [] }))
    .mockReturnValueOnce(response({ id: 'r1', parcel_id: 'p1', rating: 5, comment: 'Excellent delivery', status: 'pending' }, 201));
  render(<ReviewForm parcelId="p1" />);
  await screen.findByText('Submit review');
  fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
  fireEvent.change(screen.getByLabelText(/Your feedback/), { target: { value: 'Excellent delivery' } });
  fireEvent.click(screen.getByText('Submit review'));
  expect(await screen.findByText('Thank you. Your review has been submitted for approval.')).toBeInTheDocument();
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
});
