import { createContext, useContext } from 'react';
export const SystemsContext = createContext(null);
export function useSelectedSystems() {
  const value = useContext(SystemsContext);
  if (!value) throw new Error('Use the systems provider.');
  return value;
}
