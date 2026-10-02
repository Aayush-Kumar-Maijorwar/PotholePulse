import './globals.css';

export const metadata = {
  title: 'Municipal Road Hazard Monitoring Portal',
  description: 'PotholePulse — Pilot Deployment'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
