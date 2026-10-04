import { useEffect, useState } from 'react';
import { request } from '../api/client';

/** Debounce edits, cancel stale responses, and never display old stats as current. */
export default function usePlanAnalysis(path, values) {
  const payload = JSON.stringify(values);
  const [result, setResult] = useState({ key: '', data: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      request(path, { method: 'POST', body: JSON.parse(payload), signal: controller.signal })
        .then((data) => setResult({ key: payload, data, error: '' }))
        .catch((error) => { if (error.name !== 'AbortError') setResult({ key: payload, data: null, error: error.message }); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [path, payload, attempt]);
  return { data: result.key === payload ? result.data : null, error: result.key === payload ? result.error : '',
    loading: result.key !== payload, reload: () => setAttempt((value) => value + 1) };
}
