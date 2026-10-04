import { useResource } from '../hooks/useResource';
import SessionRadar from '../components/SessionRadar';
import { SectionHeader, ResourceState, Button } from '../components/ui';
export default function Radar() {
  const resource = useResource('/api/radar/session_handover');
  return <><SectionHeader eyebrow="Command / Handover" title="Session Radar"><Button onClick={resource.reload}>Refresh radar</Button></SectionHeader>
    <ResourceState resource={resource}>{resource.data && <SessionRadar data={resource.data} />}</ResourceState></>;
}
