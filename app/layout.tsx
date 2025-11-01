export const metadata = {
  title: 'Ders Programi',
  description: 'Course scheduling application with secure Google OAuth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
