import { useEffect, useState } from 'react';

export function useLazyResource<T>(resource: { peek: () => T | undefined; load: () => Promise<T> }, enabled = true) {
  const [value, setValue] = useState(resource.peek);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setError(false);
    void resource.load().then((module) => { if (active) setValue(() => module); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [resource, enabled, attempt]);
  return { value: value ?? resource.peek(), error, retry: () => setAttempt((current) => current + 1) };
}
