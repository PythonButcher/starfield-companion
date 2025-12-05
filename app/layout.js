import './globals.css';
import Layout from '../components/Layout';

export const metadata = {
  title: 'Starfield Companion',
  description: 'Nasapunk companion with Next.js app router.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-space-black text-star-white">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
