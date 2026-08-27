import { Link } from 'react-router-dom';
import PageShell from './PageShell';
import { color } from '../theme';

export default function NotFound() {
  return (
    <PageShell title="Page not found." subtitle="That link doesn't lead anywhere.">
      <Link to="/" style={{ fontWeight: 700, color: color.orangeDeep }}>
        Go home
      </Link>
    </PageShell>
  );
}
