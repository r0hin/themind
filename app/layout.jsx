import { Cabin } from 'next/font/google'
import './globals.css'

const cabin = Cabin({ subsets: ['latin'] })

export const metadata = {
  title: 'The Mind',
  description: 'A card game of cooperation, where players must work together to play cards in ascending order.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <body className={cabin.className}>
        <div className="flex flex-col items-center justify-center h-screen">
            {children}
        </div>
    </body>
    </html>
  )
}
 