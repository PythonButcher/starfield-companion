import { useCallback, useState } from 'react';
import { useResource } from '../hooks/useResource';
import { SystemsContext } from './systems';
export function SelectedSystemsProvider({ children }) {
  const resource = useResource('/api/systems?limit=200');
  const [selectedSystem, selectSystem] = useState(null);
  const clearSystem = useCallback(() => selectSystem(null), []);
  return <SystemsContext.Provider value={{ selectedSystem, selectSystem, clearSystem, systems: resource.data || [], resource }}>{children}</SystemsContext.Provider>;
}
