import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Seeds a page filter from a global-search result while keeping local typing local. */
export default function useRouteSearch(name = 'search') {
  const [searchParams] = useSearchParams();
  const routeQuery = searchParams.get(name) || '';
  const [query, setQuery] = useState(routeQuery);

  useEffect(() => setQuery(routeQuery), [routeQuery]);

  return [query, setQuery];
}
