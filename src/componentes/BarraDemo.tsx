import { Code2, MessageCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { restaurar } from '../dados/loja';

export const CODIGO = 'https://github.com/VictorNlc/lutz-agenda';
export const AUTOR_WHATSAPP = 'https://wa.me/5551998328628?text=' + encodeURIComponent('Oi, Victor! Vi a demonstração da agenda online e quero conversar sobre um sistema.');

export function BarraDemo() {
  const [restaurado, setRestaurado] = useState(false);
  return (
    <div className="bg-tinta text-[13px] text-papel/90">
      <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-2">
        <span className="min-w-0 truncate">
          <strong className="font-semibold text-latao-claro">Demonstração</strong>
          <span className="hidden md:inline"> com empresa e dados fictícios · feita por Victor Natanael · Lutz Solution</span>
          <span className="md:hidden"> · dados fictícios</span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              restaurar();
              setRestaurado(true);
              setTimeout(() => setRestaurado(false), 2000);
            }}
            className="inline-flex items-center gap-1 hover:text-white"
          >
            <RotateCcw size={13} /> <span className="hidden sm:inline">{restaurado ? 'Dados restaurados' : 'Restaurar dados'}</span>
          </button>
          <a href={CODIGO} target="_blank" rel="noreferrer" aria-label="Código" className="inline-flex items-center gap-1 hover:text-white">
            <Code2 size={13} /> <span className="hidden sm:inline">Código</span>
          </a>
          <a href={AUTOR_WHATSAPP} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-latao-claro hover:text-white">
            <MessageCircle size={13} /> <span className="hidden sm:inline">Quero um sistema assim</span>
            <span className="sm:hidden">Quero um</span>
          </a>
        </span>
      </div>
    </div>
  );
}
