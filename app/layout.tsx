import { Providers } from './providers'

export const metadata = {
  title: 'CreditLinker',
  description: 'Financial Intelligence Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
