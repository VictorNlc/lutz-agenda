import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

export function useAgora(intervaloMs = 30_000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

export const origem = () => window.location.origin;

type Variante = 'principal' | 'secundario' | 'fantasma' | 'perigo' | 'zap';

const VARIANTES: Record<Variante, string> = {
  principal: 'bg-tinta text-papel hover:bg-tinta-2 disabled:bg-tinta/30',
  secundario: 'bg-white text-tinta ring-1 ring-linha hover:ring-tinta/30 disabled:opacity-50',
  fantasma: 'text-tinta hover:bg-tinta/5 disabled:opacity-40',
  perigo: 'bg-white text-perigo ring-1 ring-perigo/30 hover:bg-perigo/5',
  zap: 'bg-zap text-white hover:brightness-95 disabled:opacity-40 disabled:hover:brightness-100',
};

export function Botao({
  variante = 'principal',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
    />
  );
}

export function Cartao({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl bg-white ring-1 ring-linha ${className}`}>{children}</div>;
}

export function Modal({ titulo, aoFechar, children, largura = 'max-w-lg' }: { titulo: string; aoFechar: () => void; children: ReactNode; largura?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialogo = ref.current!;
    dialogo.showModal();
    return () => dialogo.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && aoFechar()}
      className={`m-auto w-[calc(100%-2rem)] ${largura} rounded-2xl bg-white p-0 text-tinta shadow-2xl backdrop:bg-tinta/40`}
    >
      <div className="flex items-center justify-between border-b border-linha px-5 py-4">
        <h2 className="text-base font-semibold">{titulo}</h2>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1.5 text-apagado hover:bg-tinta/5">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}

export function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-apagado">{dica}</span>}
    </label>
  );
}

export const estiloEntrada =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] ring-1 ring-linha placeholder:text-apagado/70 focus:ring-2 focus:ring-latao focus:outline-none';

export function Chave({ ligado, aoMudar, rotulo }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => aoMudar(!ligado)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${ligado ? 'bg-zap' : 'bg-tinta/20'}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${ligado ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export function Avatar({ nome, cor, tamanho = 'size-9' }: { nome: string; cor: string; tamanho?: string }) {
  return (
    <span className={`inline-grid ${tamanho} shrink-0 place-items-center rounded-full text-sm font-semibold text-white`} style={{ background: cor }}>
      {nome.charAt(0)}
    </span>
  );
}

export function Selo({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'verde' | 'vermelho' | 'latao' | 'cinza' }) {
  const tons = {
    neutro: 'bg-tinta/5 text-tinta',
    verde: 'bg-zap/12 text-[#137a3d]',
    vermelho: 'bg-perigo/10 text-perigo',
    latao: 'bg-latao-claro text-[#7a5414]',
    cinza: 'bg-tinta/5 text-apagado',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tons[tom]}`}>{children}</span>;
}
