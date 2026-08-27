import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gestor de Listas de Materiais Industriais',
  description: 'Sistema profissional para criação e exportação de listas de materiais (PDF, Excel e WhatsApp)',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-cyan-500 selection:text-zinc-950" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
