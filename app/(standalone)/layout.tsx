import { ReactNode } from 'react';

// Standalone layout - no footer, no global styles from main app
export default function StandaloneLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
