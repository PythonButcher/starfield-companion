import { useResource } from '../hooks/useResource';
export default function ReferenceCredit() {
  const resource = useResource('/api/reference/meta');
  if (resource.loading) return <span>Loading reference credits…</span>;
  if (resource.error) return <button onClick={resource.reload}>Retry reference credits</button>;
  return <span><a href={resource.data.source} target="_blank" rel="noreferrer">Starfield Wiki contributors</a>
    {' · '}<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">{resource.data.license}</a>
    {' · Reference build ' + resource.data.built_at.slice(0, 10)}</span>;
}
