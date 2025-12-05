import Link from 'next/link';
import StardateClock from './StarDate';

const Navbar = () => {
  return (
    <nav className="bg-space-black border-b border-hud-blue/30 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-hud-blue font-bold text-xl tracking-widest uppercase">
            Starfield Companion
          </Link>
          <div className="flex space-x-6">
            <Link href="/" className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider">
              Hub
            </Link>
            <Link
              href="/journal"
              className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider"
            >
              Journal
            </Link>
            <span className="text-star-white uppercase text-sm tracking-wider opacity-50">PlanetPulse</span>
            <Link href="/crew" className="text-star-white hover:text-hud-blue transition-colors uppercase text-sm tracking-wider">
              Crew
            </Link>
          </div>
        </div>
        <StardateClock />
      </div>
    </nav>
  );
};

export default Navbar;
