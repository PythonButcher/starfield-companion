import { Link } from 'react-router-dom';
import InteractiveMap from '../components/InteractiveMap';
import { Panel, SectionHeader } from '../components/ui';
export default function Hub() {
  return <><SectionHeader eyebrow="Constellation / Navigation desk" title="The stars are waiting."><Link className="button button-primary" to="/journal/new">+ Record an expedition</Link></SectionHeader><Panel className="map-panel"><InteractiveMap /></Panel></>;
}
