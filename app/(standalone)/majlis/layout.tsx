import { ReactNode } from 'react';

// This layout overrides the root layout completely
export default function MajlisLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, height: '100vh', width: '100vw' }}>
        {children}
      </body>
    </html>
  );
}
