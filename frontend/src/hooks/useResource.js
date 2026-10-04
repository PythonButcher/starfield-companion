import { useCallback, useEffect, useState } from 'react';
import { request } from '../api/client';
/** Cancel obsolete reads when filters change and expose an explicit retry. */
export function useResource(path) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: '', total: 0 });
  const key = path + ':' + version;
  useEffect(() => {
    const controller = new AbortController();
    request(path, { signal: controller.signal, meta: true })
      .then(({ data, total }) => setResult({ key, data, total, error: '' }))
      .catch((error) => { if (error.name !== 'AbortError') setResult({ key, data: null, total: 0, error: error.message }); });
    return () => controller.abort();
  }, [path, key]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...result, loading: result.key !== key, reload };
}
