import './globals.css';
import Layout from '../components/Layout';

export const metadata = {
  title: 'Starfield Companion',
  description: 'Monolithic Next.js companion with star map, crew roster, and expedition journal.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-space-black text-star-white font-mono">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
