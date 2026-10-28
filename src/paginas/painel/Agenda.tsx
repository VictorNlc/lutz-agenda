import { addDays, isSameDay, startOfDay } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, MessageCircle, Plus, RotateCcw, UserX, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SeletorHorario } from '../../componentes/SeletorHorario';
import { Avatar, Botao, Campo, Modal, Selo, estiloEntrada, origem, useAgora } from '../../componentes/ui';
import { agendar, mudarStatus } from '../../dados/acoes';
import { useDados } from '../../dados/loja';
import type { Agendamento, Dados, Status } from '../../dados/tipos';
import { diaCurto, diaLongo, dinheiro, duracao, hora, maiuscula, normalizarWhatsApp, telefone } from '../../regras/formato';
import { escolherProfissional, minutosDoDia, paraMinutos, type HorarioLivre } from '../../regras/horarios';
import { NOMES_MENSAGEM, mensagensDoAgendamento } from '../../regras/mensagens';
import { Titulo } from './Moldura';

const PX_POR_MIN = 1.3;

export const STATUS: Record<Status, { nome: string; tom: 'verde' | 'vermelho' | 'latao' | 'cinza' }> = {
  confirmado: { nome: 'Confirmado', tom: 'latao' },
  concluido: { nome: 'Atendido', tom: 'verde' },
  faltou: { nome: 'Faltou', tom: 'vermelho' },
  cancelado: { nome: 'Cancelado', tom: 'cinza' },
};

export function Agenda() {
  const dados = useDados();
  const agora = useAgora();
  const [dia, setDia] = useState(() => startOfDay(new Date()));
  const [aberto, setAberto] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  const expediente = dados.config.horarios[dia.getDay()];
  const doDia = useMemo(
    () => dados.agendamentos.filter((a) => isSameDay(new Date(a.inicio), dia)).sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [dados, dia],
  );
  const equipe = dados.profissionais.filter((p) => p.ativo && (p.dias.includes(dia.getDay()) || doDia.some((a) => a.profissionalId === p.id)));

  const abre = expediente ? paraMinutos(expediente.abre) : 9 * 60;
  const fecha = expediente ? paraMinutos(expediente.fecha) : 18 * 60;
  const altura = (fecha - abre) * PX_POR_MIN;
  const horas = Array.from({ length: Math.floor((fecha - abre) / 60) + 1 }, (_, i) => abre + i * 60).filter((m) => m <= fecha);
  const validos = doDia.filter((a) => a.status !== 'cancelado');
  const previsto = validos.reduce((t, a) => t + a.preco, 0);
  const selecionado = dados.agendamentos.find((a) => a.id === aberto) ?? null;

  return (
    <div>
      <Titulo titulo="Agenda" sub={expediente ? `${validos.length} atendimentos · ${dinheiro(previsto)} previstos` : 'Fechado neste dia'}>
        <Botao onClick={() => setNovo(true)} disabled={!expediente}>
          <Plus size={16} /> Encaixar horário
        </Botao>
      </Titulo>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Botao variante="secundario" className="px-2.5" aria-label="Dia anterior" onClick={() => setDia((d) => addDays(d, -1))}>
          <ChevronLeft size={18} />
        </Botao>
        <Botao variante="secundario" onClick={() => setDia(startOfDay(new Date()))}>
          Hoje
        </Botao>
        <Botao variante="secundario" className="px-2.5" aria-label="Próximo dia" onClick={() => setDia((d) => addDays(d, 1))}>
          <ChevronRight size={18} />
        </Botao>
        <span className="ml-2 text-lg font-semibold">
          {maiuscula(diaLongo(dia))}
          {isSameDay(dia, agora) && <span className="ml-2 text-sm font-medium text-latao">hoje</span>}
        </span>
      </div>

      {!expediente ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center text-apagado ring-1 ring-linha">A barbearia não abre neste dia.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-linha">
          <div className="min-w-[640px]">
            <div className="sticky top-0 z-10 grid border-b border-linha bg-white" style={{ gridTemplateColumns: `56px repeat(${equipe.length}, 1fr)` }}>
              <span />
              {equipe.map((p) => {
                const n = validos.filter((a) => a.profissionalId === p.id).length;
                return (
                  <div key={p.id} className="flex items-center gap-2 border-l border-linha px-3 py-3">
                    <Avatar nome={p.nome} cor={p.cor} tamanho="size-8" />
                    <div>
                      <div className="text-sm font-semibold">{p.nome}</div>
                      <div className="text-xs text-apagado">{p.dias.includes(dia.getDay()) ? `${n} atendimentos` : 'folga'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${equipe.length}, 1fr)`, height: altura + 16 }}>
              <div className="relative">
                {horas.map((m) => (
                  <span key={m} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-apagado" style={{ top: (m - abre) * PX_POR_MIN + 8 }}>
                    {String(Math.floor(m / 60)).padStart(2, '0')}:00
                  </span>
                ))}
              </div>

              {equipe.map((p) => (
                <div key={p.id} className={`relative border-l border-linha ${p.dias.includes(dia.getDay()) ? '' : 'listras'}`}>
                  {horas.map((m) => (
                    <div key={m} className="absolute inset-x-0 border-t border-linha/70" style={{ top: (m - abre) * PX_POR_MIN + 8 }} />
                  ))}
                  {dados.config.almoco && (
                    <div
                      className="listras absolute inset-x-0 flex items-center justify-center text-[11px] text-apagado"
                      style={{
                        top: (paraMinutos(dados.config.almoco.abre) - abre) * PX_POR_MIN + 8,
                        height: (paraMinutos(dados.config.almoco.fecha) - paraMinutos(dados.config.almoco.abre)) * PX_POR_MIN,
                      }}
                    >
                      almoço
                    </div>
                  )}
                  {doDia
                    .filter((a) => a.profissionalId === p.id)
                    .map((a) => (
                      <Bloco key={a.id} dados={dados} ag={a} abre={abre} cor={p.cor} aoAbrir={() => setAberto(a.id)} />
                    ))}
                </div>
              ))}

              {isSameDay(dia, agora) && minutosDoDia(agora) >= abre && minutosDoDia(agora) <= fecha && (
                <div className="pointer-events-none absolute right-0 left-[56px] z-[5] border-t-2 border-perigo" style={{ top: (minutosDoDia(agora) - abre) * PX_POR_MIN + 8 }}>
                  <span className="absolute -top-[5px] -left-[5px] size-2 rounded-full bg-perigo" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selecionado && <Detalhe dados={dados} ag={selecionado} agora={agora} aoFechar={() => setAberto(null)} />}
      {novo && <NovoHorario dados={dados} dia={dia} agora={agora} aoFechar={() => setNovo(false)} />}
    </div>
  );
}

function Bloco({ dados, ag, abre, cor, aoAbrir }: { dados: Dados; ag: Agendamento; abre: number; cor: string; aoAbrir: () => void }) {
  const inicio = new Date(ag.inicio);
  const minutos = (new Date(ag.fim).getTime() - inicio.getTime()) / 60_000;
  const cliente = dados.clientes.find((c) => c.id === ag.clienteId);
  const servico = dados.servicos.find((s) => s.id === ag.servicoId);
  const curto = minutos < 30;
  const estilo =
    ag.status === 'cancelado'
      ? 'bg-white text-apagado line-through opacity-60 ring-1 ring-dashed ring-linha'
      : ag.status === 'faltou'
        ? 'bg-perigo/8 text-perigo ring-1 ring-perigo/30'
        : ag.status === 'concluido'
          ? 'bg-tinta/[0.04] text-tinta/70'
          : 'text-tinta';
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className={`absolute inset-x-1 overflow-hidden rounded-lg border-l-[3px] px-2 text-left text-xs transition hover:z-10 hover:shadow-md ${estilo} ${
        ag.status === 'cancelado' ? 'z-0' : 'z-[1]'
      }`}
      style={{
        top: (minutosDoDia(inicio) - abre) * PX_POR_MIN + 9,
        height: minutos * PX_POR_MIN - 2,
        borderLeftColor: cor,
        background: ag.status === 'confirmado' ? `${cor}1f` : undefined,
      }}
    >
      <div className={`flex items-center gap-1 ${curto ? '' : 'pt-1'}`}>
        <span className="font-semibold tabular-nums">{hora(inicio)}</span>
        <span className="truncate font-medium">{cliente?.nome}</span>
        {ag.status === 'concluido' && <Check size={12} className="ml-auto shrink-0 text-[#137a3d]" />}
        {ag.status === 'faltou' && <UserX size={12} className="ml-auto shrink-0" />}
      </div>
      {!curto && <div className="truncate opacity-80">{servico?.nome}</div>}
    </button>
  );
}

function Detalhe({ dados, ag, agora, aoFechar }: { dados: Dados; ag: Agendamento; agora: Date; aoFechar: () => void }) {
  const cliente = dados.clientes.find((c) => c.id === ag.clienteId)!;
  const servico = dados.servicos.find((s) => s.id === ag.servicoId)!;
  const profissional = dados.profissionais.find((p) => p.id === ag.profissionalId)!;
  const inicio = new Date(ag.inicio);
  const mensagens = mensagensDoAgendamento(dados, ag, agora, origem());
  const comecou = inicio <= agora;

  return (
    <Modal titulo={`${hora(inicio)} · ${cliente.nome}`} aoFechar={aoFechar}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{servico.nome}</div>
          <div className="text-sm text-apagado">
            {maiuscula(diaCurto(inicio))}, {hora(inicio)} · {duracao(servico.duracao)} · com {profissional.nome}
          </div>
        </div>
        <Selo tom={STATUS[ag.status].tom}>{STATUS[ag.status].nome}</Selo>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-papel p-3 text-sm">
        <div>
          <dt className="text-xs text-apagado">WhatsApp</dt>
          <dd className="font-medium">{telefone(cliente.whatsapp)}</dd>
        </div>
        <div>
          <dt className="text-xs text-apagado">Valor</dt>
          <dd className="font-medium">{dinheiro(ag.preco)}</dd>
        </div>
        <div>
          <dt className="text-xs text-apagado">Marcado</dt>
          <dd className="font-medium">{ag.origem === 'online' ? 'pelo cliente, online' : 'pelo painel'}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {ag.status === 'confirmado' && (
          <>
            <Botao variante="zap" disabled={!comecou} title={comecou ? undefined : 'Libera quando o horário começar'} onClick={() => mudarStatus(ag.id, 'concluido')}>
              <Check size={16} /> Atendido
            </Botao>
            <Botao variante="secundario" disabled={!comecou} onClick={() => mudarStatus(ag.id, 'faltou')}>
              <UserX size={16} /> Faltou
            </Botao>
            <Botao variante="perigo" onClick={() => mudarStatus(ag.id, 'cancelado')}>
              <X size={16} /> Cancelar
            </Botao>
          </>
        )}
        {ag.status !== 'confirmado' && (
          <Botao variante="secundario" onClick={() => mudarStatus(ag.id, 'confirmado')}>
            <RotateCcw size={15} /> Voltar para confirmado
          </Botao>
        )}
      </div>

      <h3 className="mt-6 mb-2 flex items-center gap-2 text-sm font-semibold">
        <MessageCircle size={16} className="text-zap" /> Mensagens deste horário
      </h3>
      <ul className="space-y-2">
        {mensagens.map((m) => (
          <li key={m.id} className="rounded-xl bg-zap-fundo p-3 text-sm">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold">{NOMES_MENSAGEM[m.tipo]}</span>
              <span className="text-apagado">
                {m.situacao === 'enviada' ? 'enviada' : m.situacao === 'agendada' ? 'sai' : 'não vai sair'} {diaCurto(m.em)} {hora(m.em)}
              </span>
            </div>
            <p className={`whitespace-pre-line ${m.situacao === 'cancelada' ? 'text-apagado line-through' : ''}`}>{m.texto}</p>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function NovoHorario({ dados, dia, agora, aoFechar }: { dados: Dados; dia: Date; agora: Date; aoFechar: () => void }) {
  // No painel o dono encaixa sem a antecedência mínima que vale para o cliente
  const dadosDoDono = useMemo(() => ({ ...dados, config: { ...dados.config, antecedenciaMin: 0 } }), [dados]);
  const [servicoId, setServicoId] = useState(dados.servicos.find((s) => s.ativo)!.id);
  const [profissionalId, setProfissionalId] = useState<string | null>(null);
  const [diaEscolhido, setDiaEscolhido] = useState(dia);
  const [horario, setHorario] = useState<HorarioLivre | null>(null);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const servico = dados.servicos.find((s) => s.id === servicoId)!;
  const numero = normalizarWhatsApp(whatsapp);
  const conhecido = numero ? dados.clientes.find((c) => c.whatsapp === numero) : undefined;

  function salvar() {
    if (!horario || !numero || (!conhecido && nome.trim().length < 2)) return;
    agendar({
      nome: conhecido?.nome ?? nome,
      whatsapp: numero,
      servicoId,
      profissionalId: profissionalId ?? escolherProfissional(dados, horario.profissionais, horario.inicio),
      inicio: horario.inicio,
      origem: 'painel',
    });
    aoFechar();
  }

  return (
    <Modal titulo="Encaixar horário" aoFechar={aoFechar} largura="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="WhatsApp do cliente" dica={conhecido ? `Cliente já cadastrado: ${conhecido.nome}` : 'Se já for cliente, o nome aparece sozinho.'}>
          <input className={estiloEntrada} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" placeholder="(51) 90000-0001" />
        </Campo>
        <Campo rotulo="Nome">
          <input className={estiloEntrada} value={conhecido?.nome ?? nome} disabled={!!conhecido} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" />
        </Campo>
        <Campo rotulo="Serviço">
          <select
            className={estiloEntrada}
            value={servicoId}
            onChange={(e) => {
              setServicoId(e.target.value);
              setHorario(null);
            }}
          >
            {dados.servicos
              .filter((s) => s.ativo)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} · {duracao(s.duracao)} · {dinheiro(s.preco)}
                </option>
              ))}
          </select>
        </Campo>
        <Campo rotulo="Profissional">
          <select
            className={estiloEntrada}
            value={profissionalId ?? ''}
            onChange={(e) => {
              setProfissionalId(e.target.value || null);
              setHorario(null);
            }}
          >
            <option value="">Quem estiver livre</option>
            {dados.profissionais
              .filter((p) => p.ativo && p.servicos.includes(servicoId))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </select>
        </Campo>
      </div>
      <div className="mt-5">
        <SeletorHorario
          dados={dadosDoDono}
          servico={servico}
          profissionalId={profissionalId}
          agora={agora}
          dia={diaEscolhido}
          aoEscolherDia={(d) => {
            setDiaEscolhido(d);
            setHorario(null);
          }}
          escolhido={horario}
          aoEscolher={setHorario}
          dias={21}
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Botao variante="fantasma" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao disabled={!horario || !numero || (!conhecido && nome.trim().length < 2)} onClick={salvar}>
          Salvar e enviar confirmação
        </Botao>
      </div>
    </Modal>
  );
}
