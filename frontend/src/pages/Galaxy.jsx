import InteractiveMap from '../components/InteractiveMap';
import { Panel, SectionHeader } from '../components/ui';
import Planets from './Planets';

export default function Galaxy() {
  return <div className="stack">
    <SectionHeader eyebrow="Constellation / Stellar cartography" title="Galaxy & Surveys" />
    <Panel className="map-panel"><InteractiveMap /></Panel>
    <Planets />
  </div>;
}
