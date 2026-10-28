import { isSameDay } from 'date-fns';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BellRing, UserRoundX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Cartao, Selo, origem, useAgora } from '../../componentes/ui';
import { useDados } from '../../dados/loja';
import { diaCurto, dinheiro, dinheiroCurto, hora, maiuscula } from '../../regras/formato';
import { faturamentoPorDia, fichasDosClientes, resumoDoMes, servicosMaisVendidos } from '../../regras/indicadores';
import { todasMensagens } from '../../regras/mensagens';
import { Titulo } from './Moldura';

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function Inicio() {
  const dados = useDados();
  const agora = useAgora();
  const resumo = useMemo(() => resumoDoMes(dados, agora), [dados, agora]);
  const porDia = useMemo(() => faturamentoPorDia(dados, agora), [dados, agora]);
  const top = useMemo(() => servicosMaisVendidos(dados, agora), [dados, agora]);
  const sumidos = useMemo(() => fichasDosClientes(dados, agora).filter((f) => f.sumido).length, [dados, agora]);
  const lembretesHoje = useMemo(
    () => todasMensagens(dados, agora, origem()).filter((m) => m.situacao === 'agendada' && isSameDay(m.em, agora)).length,
    [dados, agora],
  );
  const hoje = dados.agendamentos
    .filter((a) => isSameDay(new Date(a.inicio), agora) && a.status !== 'cancelado')
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const proximos = hoje.filter((a) => new Date(a.fim) > agora);

  return (
    <div>
      <Titulo titulo="Início" sub={`${maiuscula(diaCurto(agora))} · resumo do mês até agora`} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Numero
          rotulo="Faturamento do mês"
          valor={dinheiroCurto(resumo.faturamento)}
          detalhe={
            resumo.variacao !== null && (
              <span className={`inline-flex items-center gap-0.5 ${resumo.variacao >= 0 ? 'text-[#137a3d]' : 'text-perigo'}`}>
                {resumo.variacao >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {pct(Math.abs(resumo.variacao))} vs. mesmo período do mês passado
              </span>
            )
          }
        />
        <Numero rotulo="Atendimentos no mês" valor={String(resumo.atendimentos)} detalhe={`${pct(resumo.online)} marcados online`} />
        <Numero rotulo="Ticket médio" valor={dinheiro(resumo.ticketMedio)} detalhe="por atendimento" />
        <Numero rotulo="Faltas (30 dias)" valor={pct(resumo.taxaFaltas)} detalhe="os lembretes ajudam a baixar" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Cartao className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Faturamento por dia</h2>
            <span className="text-xs text-apagado">últimos 30 dias</span>
          </div>
          <Grafico pontos={porDia} />
        </Cartao>

        <Cartao className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Hoje</h2>
            <Link to="/painel/agenda" className="text-sm font-medium text-latao">
              Ver agenda
            </Link>
          </div>
          <p className="mt-1 text-sm text-apagado">
            {hoje.length} atendimentos · {proximos.length} ainda por vir
          </p>
          <ul className="mt-4 space-y-2.5">
            {proximos.slice(0, 6).map((a) => {
              const p = dados.profissionais.find((x) => x.id === a.profissionalId)!;
              const c = dados.clientes.find((x) => x.id === a.clienteId)!;
              const s = dados.servicos.find((x) => x.id === a.servicoId)!;
              return (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="w-11 font-semibold tabular-nums">{hora(new Date(a.inicio))}</span>
                  <Avatar nome={p.nome} cor={p.cor} tamanho="size-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.nome}</span>
                    <span className="block truncate text-xs text-apagado">{s.nome}</span>
                  </span>
                </li>
              );
            })}
            {proximos.length === 0 && <li className="text-sm text-apagado">Nenhum atendimento por vir hoje.</li>}
          </ul>
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Cartao className="p-5 lg:col-span-2">
          <h2 className="font-semibold">Serviços que mais faturam no mês</h2>
          <ul className="mt-4 space-y-3">
            {top.map(({ servico, quantidade, valor }) => (
              <li key={servico.id} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{servico.nome}</span>
                  <span className="tabular-nums text-apagado">
                    {quantidade}× · <span className="font-semibold text-tinta">{dinheiroCurto(valor)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-tinta/5">
                  <div className="h-2 rounded-full bg-latao" style={{ width: `${(valor / top[0].valor) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Cartao>

        <div className="space-y-3">
          <Atalho para="/painel/clientes?filtro=sumidos" icone={<UserRoundX size={18} />} titulo={`${sumidos} clientes sumidos`} texto="Não vêm há mais de 30 dias. Chame de volta com um toque." />
          <Atalho para="/painel/whatsapp" icone={<BellRing size={18} />} titulo={`${lembretesHoje} lembretes saem hoje`} texto="Confirmações e lembretes vão sozinhos pelo WhatsApp." />
        </div>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: React.ReactNode }) {
  return (
    <Cartao className="p-4 sm:p-5">
      <div className="text-xs font-medium text-apagado sm:text-sm">{rotulo}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{valor}</div>
      {detalhe && <div className="mt-1 text-xs text-apagado">{detalhe}</div>}
    </Cartao>
  );
}

function Atalho({ para, icone, titulo, texto }: { para: string; icone: React.ReactNode; titulo: string; texto: string }) {
  return (
    <Link to={para} className="group flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-linha transition hover:ring-tinta/30">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-latao-claro text-[#7a5414]">{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between font-semibold">
          {titulo} <ArrowRight size={16} className="text-apagado transition group-hover:translate-x-0.5" />
        </span>
        <span className="mt-0.5 block text-sm text-apagado">{texto}</span>
      </span>
    </Link>
  );
}

function Grafico({ pontos }: { pontos: { dia: Date; valor: number }[] }) {
  const [foco, setFoco] = useState<number | null>(null);
  const maximo = Math.max(...pontos.map((p) => p.valor), 1);
  const ponto = foco !== null ? pontos[foco] : null;
  return (
    <div className="mt-4">
      <div className="h-5 text-sm">
        {ponto ? (
          <span>
            <span className="font-semibold tabular-nums">{dinheiro(ponto.valor)}</span>
            <span className="text-apagado"> · {diaCurto(ponto.dia)}</span>
          </span>
        ) : (
          <span className="text-apagado">Passe o dedo ou o mouse nas barras</span>
        )}
      </div>
      <div className="mt-2 flex h-44 items-end gap-[3px]" onMouseLeave={() => setFoco(null)}>
        {pontos.map((p, i) => (
          <button
            key={p.dia.toISOString()}
            type="button"
            aria-label={`${diaCurto(p.dia)}: ${dinheiro(p.valor)}`}
            onMouseEnter={() => setFoco(i)}
            onFocus={() => setFoco(i)}
            onClick={() => setFoco(i)}
            className="flex h-full flex-1 items-end"
          >
            <span
              className={`block w-full rounded-t-[4px] transition-colors ${p.valor === 0 ? 'bg-tinta/10' : foco === i ? 'bg-latao' : 'bg-tinta'}`}
              style={{ height: p.valor === 0 ? 3 : `${Math.max(4, (p.valor / maximo) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-apagado">
        <span>{diaCurto(pontos[0].dia)}</span>
        <span>
          <Selo tom="cinza">dias sem barra: fechado</Selo>
        </span>
        <span>hoje</span>
      </div>
    </div>
  );
}
