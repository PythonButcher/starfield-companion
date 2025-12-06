import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Starfield Companion',
  description: 'Explore the settled systems with expedition logs and crew manifests.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-space-black text-star-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">{children}</main>
        <footer className="p-4 text-center text-xs text-gray-500 border-t border-gray-800">
          <p>STARFIELD COMPANION // SYSTEM ONLINE</p>
        </footer>
      </body>
    </html>
  );
}
