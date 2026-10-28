import { differenceInCalendarDays } from 'date-fns';
import { Check, Search, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Botao, Cartao, Modal, Selo, estiloEntrada, origem, useAgora } from '../../componentes/ui';
import { chamarDeVolta } from '../../dados/acoes';
import { useDados } from '../../dados/loja';
import { diaCurto, dinheiro, dinheiroCurto, hora, normalizarWhatsApp, telefone } from '../../regras/formato';
import { DIAS_PARA_SUMIDO, fichasDosClientes, type FichaCliente } from '../../regras/indicadores';
import { textoReativacao } from '../../regras/mensagens';
import { STATUS } from './Agenda';
import { Titulo } from './Moldura';

type Filtro = 'todos' | 'sumidos' | 'fieis';

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: 'todos', nome: 'Todos' },
  { id: 'sumidos', nome: `Sumidos (+${DIAS_PARA_SUMIDO} dias)` },
  { id: 'fieis', nome: 'Mais fiéis' },
];

export function Clientes() {
  const dados = useDados();
  const agora = useAgora(60_000);
  const [params, setParams] = useSearchParams();
  const filtro = (params.get('filtro') as Filtro) || 'todos';
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);

  const fichas = useMemo(() => fichasDosClientes(dados, agora), [dados, agora]);
  const chamados = useMemo(() => {
    const limite = agora.getTime() - 7 * 86_400_000;
    return new Set(dados.avulsas.filter((m) => new Date(m.em).getTime() > limite).map((m) => m.clienteId));
  }, [dados, agora]);

  const termo = busca.trim().toLowerCase();
  const digitos = normalizarWhatsApp(busca) ?? busca.replace(/\D/g, '');
  const lista = fichas
    .filter((f) => (filtro === 'sumidos' ? f.sumido : true))
    .filter((f) => !termo || f.cliente.nome.toLowerCase().includes(termo) || (digitos.length >= 4 && f.cliente.whatsapp.includes(digitos)))
    .sort((a, b) =>
      filtro === 'fieis' ? b.total - a.total : filtro === 'sumidos' ? (b.diasSemVir ?? 0) - (a.diasSemVir ?? 0) : a.cliente.nome.localeCompare(b.cliente.nome),
    );
  const ficha = fichas.find((f) => f.cliente.id === aberto);

  return (
    <div>
      <Titulo titulo="Clientes" sub={`${fichas.length} clientes · ${fichas.filter((f) => f.sumido).length} sumidos`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-apagado" />
          <input className={`${estiloEntrada} pl-9`} placeholder="Buscar por nome ou WhatsApp" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-linha">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setParams(f.id === 'todos' ? {} : { filtro: f.id })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filtro === f.id ? 'bg-tinta text-papel' : 'text-tinta/70 hover:bg-tinta/5'}`}
            >
              {f.nome}
            </button>
          ))}
        </div>
      </div>

      {filtro === 'sumidos' && (
        <p className="mb-4 rounded-xl bg-latao-claro/60 px-4 py-3 text-sm text-[#5c3f0f]">
          Clientes que não voltam há mais de {DIAS_PARA_SUMIDO} dias e não têm horário marcado. O botão manda uma mensagem pronta no WhatsApp com o link para agendar.
        </p>
      )}

      <Cartao className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-papel/60 text-left text-xs text-apagado">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Visitas</th>
                <th className="px-4 py-3 font-medium">Total gasto</th>
                <th className="px-4 py-3 font-medium">Última visita</th>
                <th className="px-4 py-3 font-medium">Próximo horário</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {lista.map((f) => (
                <tr key={f.cliente.id} className="hover:bg-papel/40">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setAberto(f.cliente.id)} className="text-left">
                      <span className="block font-medium hover:underline">{f.cliente.nome}</span>
                      <span className="block text-xs text-apagado">{telefone(f.cliente.whatsapp)}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{f.visitas}</td>
                  <td className="px-4 py-3 tabular-nums">{dinheiroCurto(f.total)}</td>
                  <td className="px-4 py-3">
                    {f.ultimaVisita ? (
                      <span className={f.sumido ? 'font-medium text-perigo' : ''}>há {f.diasSemVir} dias</span>
                    ) : (
                      <span className="text-apagado">ainda não veio</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{f.proximo ? `${diaCurto(new Date(f.proximo.inicio))}, ${hora(new Date(f.proximo.inicio))}` : <span className="text-apagado">–</span>}</td>
                  <td className="px-4 py-3 text-right">
                    {f.sumido && <BotaoChamar clienteId={f.cliente.id} chamado={chamados.has(f.cliente.id)} />}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-apagado">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Cartao>

      {ficha && <Ficha ficha={ficha} agora={agora} chamado={chamados.has(ficha.cliente.id)} aoFechar={() => setAberto(null)} />}
    </div>
  );
}

function BotaoChamar({ clienteId, chamado }: { clienteId: string; chamado: boolean }) {
  if (chamado)
    return (
      <Selo tom="verde">
        <Check size={12} /> Mensagem enviada
      </Selo>
    );
  return (
    <Botao variante="zap" className="min-h-8 px-3 text-xs" onClick={() => chamarDeVolta(clienteId, origem())}>
      <Send size={13} /> Chamar de volta
    </Botao>
  );
}

function Ficha({ ficha, agora, chamado, aoFechar }: { ficha: FichaCliente; agora: Date; chamado: boolean; aoFechar: () => void }) {
  const dados = useDados();
  const historico = dados.agendamentos.filter((a) => a.clienteId === ficha.cliente.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const servicoPreferido = Object.entries(
    historico.filter((a) => a.status === 'concluido').reduce<Record<string, number>>((t, a) => ({ ...t, [a.servicoId]: (t[a.servicoId] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1])[0];

  return (
    <Modal titulo={ficha.cliente.nome} aoFechar={aoFechar}>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Mini rotulo="Visitas" valor={String(ficha.visitas)} />
        <Mini rotulo="Total gasto" valor={dinheiroCurto(ficha.total)} />
        <Mini rotulo="Faltas" valor={String(ficha.faltas)} />
      </div>
      <p className="mt-4 text-sm text-apagado">
        {telefone(ficha.cliente.whatsapp)}
        {servicoPreferido && ` · costuma fazer ${dados.servicos.find((s) => s.id === servicoPreferido[0])?.nome.toLowerCase()}`}
        {ficha.ultimaVisita && ` · cliente há ${differenceInCalendarDays(agora, new Date(ficha.cliente.criadoEm))} dias`}
      </p>

      {ficha.sumido && (
        <div className="mt-4 rounded-xl bg-zap-fundo p-3 text-sm">
          <div className="mb-1 text-xs font-semibold">Mensagem que vai no WhatsApp</div>
          <p className="whitespace-pre-line">{textoReativacao(dados, ficha.cliente.id, origem())}</p>
          <div className="mt-3">
            <BotaoChamar clienteId={ficha.cliente.id} chamado={chamado} />
          </div>
        </div>
      )}

      <h3 className="mt-5 mb-2 text-sm font-semibold">Histórico</h3>
      <ul className="divide-y divide-linha text-sm">
        {historico.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              <span className="font-medium">{diaCurto(new Date(a.inicio))}</span>
              <span className="text-apagado"> · {dados.servicos.find((s) => s.id === a.servicoId)?.nome}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums text-apagado">{dinheiro(a.preco)}</span>
              <Selo tom={STATUS[a.status].tom}>{STATUS[a.status].nome}</Selo>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function Mini({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-papel p-3">
      <div className="text-lg font-semibold tabular-nums">{valor}</div>
      <div className="text-xs text-apagado">{rotulo}</div>
    </div>
  );
}
