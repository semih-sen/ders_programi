import './globals.css'
import Footer from './components/Footer'

export const metadata = {
  title: 'Sirkadiyen',
  description: 'İstanbul Tıp Fakültesi ders programınızı otomatik olarak Google Takviminize aktarın.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col">
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
