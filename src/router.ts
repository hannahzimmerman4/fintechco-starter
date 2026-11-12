export type RouteName = 'overview' | 'accounts' | 'transactions' | 'insights';

export interface Route {
  name: RouteName;
  params: URLSearchParams;
}

const ROUTES: readonly RouteName[] = ['overview', 'accounts', 'transactions', 'insights'];

/** '#/transactions?account=cc' → { name: 'transactions', params }. Unknown or empty hashes go to overview. */
export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?', 2);
  const name = (ROUTES as readonly string[]).includes(path) ? (path as RouteName) : 'overview';
  return { name, params: new URLSearchParams(query) };
}

/** Build a hash link; empty or undefined params are left out. */
export function routeHref(name: RouteName, params: Record<string, string | undefined> = {}): string {
  const entries = Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]));
  const qs = new URLSearchParams(entries).toString();
  return `#/${name}${qs ? `?${qs}` : ''}`;
}
