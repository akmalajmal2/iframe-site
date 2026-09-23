export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 16, margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
