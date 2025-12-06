import InteractiveMap from './components/InteractiveMap';

export default function HomePage() {
  return (
    <div className="hub-container w-full h-full flex flex-col gap-6">
      <header className="flex items-center justify-between border-b border-gray-700 pb-4">
        <div>
          <p className="text-xs text-gray-500 tracking-widest uppercase">Navigation</p>
          <h1 className="text-3xl font-bold text-hud-blue tracking-wide">Star Map</h1>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>Use scroll to zoom and click to lock targets.</p>
          <p className="text-xs">Right click for contextual actions.</p>
        </div>
      </header>
      <div className="flex-1 relative overflow-hidden min-h-[500px] border border-gray-800 rounded-lg bg-black/40">
        <InteractiveMap />
      </div>
    </div>
  );
}
