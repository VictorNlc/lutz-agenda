import { CalendarDays, ExternalLink, Home, MessageCircle, Scissors, Settings, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useDados } from '../../dados/loja';

const MENU = [
  { para: '/painel', nome: 'Início', icone: Home, fim: true },
  { para: '/painel/agenda', nome: 'Agenda', icone: CalendarDays },
  { para: '/painel/clientes', nome: 'Clientes', icone: Users },
  { para: '/painel/whatsapp', nome: 'WhatsApp', icone: MessageCircle },
  { para: '/painel/servicos', nome: 'Serviços e equipe', icone: Scissors },
  { para: '/painel/ajustes', nome: 'Ajustes', icone: Settings },
];

export function Moldura() {
  const dados = useDados();
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row">
      <aside className="border-b border-linha lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 pt-4 lg:block lg:px-5 lg:pt-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-apagado">Painel</div>
            <div className="font-titulo text-xl font-semibold">{dados.config.negocio}</div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium whitespace-nowrap text-latao hover:bg-latao-claro/50 lg:mt-3 lg:-ml-2"
          >
            <span className="hidden sm:inline">Página de agendamento</span>
            <span className="sm:hidden">Página do cliente</span>
            <ExternalLink size={14} />
          </Link>
        </div>
        <nav className="sem-barra flex gap-1 overflow-x-auto px-3 py-3 lg:mt-4 lg:flex-col lg:px-3">
          {MENU.map(({ para, nome, icone: Icone, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-tinta text-papel' : 'text-tinta/80 hover:bg-tinta/5'
                }`
              }
            >
              <Icone size={17} /> {nome}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function Titulo({ titulo, sub, children }: { titulo: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-titulo text-3xl font-semibold tracking-tight">{titulo}</h1>
        {sub && <p className="mt-1 text-sm text-apagado">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
