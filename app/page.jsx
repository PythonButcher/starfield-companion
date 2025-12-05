import InteractiveMap from '../components/InteractiveMap';

export default function HomePage() {
  return (
    <div className="hub-container w-full h-full flex flex-col">
      <h1 className="px-5 py-4 m-0 border-b border-gray-800 text-2xl font-bold">Star Map</h1>
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: '60vh' }}>
        <InteractiveMap />
      </div>
    </div>
  );
}
