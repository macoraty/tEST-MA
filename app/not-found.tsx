import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center text-zinc-100">
      <h1 className="text-4xl font-bold tracking-tight text-cyan-400">404</h1>
      <p className="mt-2 text-sm text-zinc-400">Página não encontrada</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-400"
      >
        Voltar ao Início
      </Link>
    </div>
  );
}
