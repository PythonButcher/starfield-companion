import InteractiveMap from '../components/InteractiveMap';

export default function Home() {
  return (
    <div className="hub-container w-full h-full flex flex-col">
      <h1 className="p-5 m-0 border-b border-gray-800 text-2xl font-bold">Star Map</h1>
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <InteractiveMap />
      </div>
    </div>
  );
}
