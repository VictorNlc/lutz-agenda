import { addDays, isSameDay, startOfDay } from 'date-fns';
import { ArrowRight, CalendarCheck, Check, Clock, LayoutDashboard, MapPin } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CelularWhatsApp } from '../componentes/CelularWhatsApp';
import { SeletorHorario } from '../componentes/SeletorHorario';
import { Avatar, Botao, Cartao, Campo, estiloEntrada, origem, useAgora } from '../componentes/ui';
import { agendar } from '../dados/acoes';
import { useDados } from '../dados/loja';
import type { Agendamento, Dados } from '../dados/tipos';
import { diaLongo, dinheiro, duracao, hora, maiuscula, normalizarWhatsApp } from '../regras/formato';
import { escolherProfissional, expedienteDoDia, horariosLivres, paraMinutos, profissionaisPara, type HorarioLivre } from '../regras/horarios';
import { mensagensDoAgendamento } from '../regras/mensagens';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function Agendar() {
  const dados = useDados();
  const agora = useAgora();
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [profissionalId, setProfissionalId] = useState<string | null>(null);
  const [dia, setDia] = useState<Date | null>(null);
  const [horario, setHorario] = useState<HorarioLivre | null>(null);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tentou, setTentou] = useState(false);
  const [confirmado, setConfirmado] = useState<Agendamento | null>(null);

  const servico = dados.servicos.find((s) => s.id === servicoId) ?? null;
  const profissionais = useMemo(() => {
    if (!servico) return [];
    const ids = new Set(Array.from({ length: 7 }, (_, i) => profissionaisPara(dados, servico.id, addDays(agora, i))).flat().map((p) => p.id));
    return dados.profissionais.filter((p) => ids.has(p.id));
  }, [dados, servico, agora]);

  // Primeiro dia com horário livre, para o cliente não cair num dia vazio
  const diaInicial = useMemo(() => {
    if (!servico) return null;
    for (let i = 0; i < 14; i++) {
      const d = addDays(startOfDay(agora), i);
      if (horariosLivres(dados, { dia: d, servico, profissionalId, agora }).length) return d;
    }
    return startOfDay(agora);
  }, [dados, servico, profissionalId, agora]);
  const diaAtual = dia ?? diaInicial;

  const numero = normalizarWhatsApp(whatsapp);

  function confirmar() {
    setTentou(true);
    if (!servico || !horario || nome.trim().length < 2 || !numero) return;
    const quem = profissionalId ?? escolherProfissional(dados, horario.profissionais, horario.inicio);
    setConfirmado(agendar({ nome, whatsapp: numero, servicoId: servico.id, profissionalId: quem, inicio: horario.inicio, origem: 'online' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function recomecar() {
    setConfirmado(null);
    setServicoId(null);
    setProfissionalId(null);
    setDia(null);
    setHorario(null);
    setTentou(false);
  }

  const expedienteHoje = expedienteDoDia(dados, agora);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const abertoAgora =
    !!expedienteHoje && minutosAgora >= paraMinutos(expedienteHoje.abre) && minutosAgora < paraMinutos(expedienteHoje.fecha);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-latao">Agende online em 1 minuto</p>
          <h1 className="font-titulo text-4xl font-semibold tracking-tight sm:text-5xl">{dados.config.negocio}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-apagado">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} /> {dados.config.endereco}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} />
              {abertoAgora ? <span className="font-medium text-[#137a3d]">Aberto agora</span> : 'Fechado agora'}
              {expedienteHoje && ` · hoje ${expedienteHoje.abre}–${expedienteHoje.fecha}`}
            </span>
          </p>
        </div>
        <Link
          to="/painel"
          className="hidden items-center gap-2 rounded-xl bg-latao-claro px-4 py-2.5 text-sm font-semibold text-[#5c3f0f] hover:brightness-95 sm:inline-flex"
        >
          <LayoutDashboard size={16} /> Ver o painel do dono
        </Link>
      </header>

      {confirmado ? (
        <Confirmado agendamento={confirmado} aoRecomecar={recomecar} />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-8">
            <Passo numero={1} titulo="Escolha o serviço">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {dados.servicos
                  .filter((s) => s.ativo)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServicoId(s.id);
                        setProfissionalId(null);
                        setDia(null);
                        setHorario(null);
                      }}
                      className={`flex flex-col rounded-2xl p-4 text-left transition ${
                        s.id === servicoId ? 'bg-tinta text-papel' : 'bg-white ring-1 ring-linha hover:ring-tinta/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold">{s.nome}</span>
                        <span className="font-semibold tabular-nums">{dinheiro(s.preco)}</span>
                      </div>
                      <p className={`mt-1 text-sm ${s.id === servicoId ? 'text-papel/75' : 'text-apagado'}`}>{s.descricao}</p>
                      <p className={`mt-2 text-xs ${s.id === servicoId ? 'text-latao-claro' : 'text-apagado'}`}>{duracao(s.duracao)}</p>
                    </button>
                  ))}
              </div>
            </Passo>

            {servico && (
              <Passo numero={2} titulo="Com quem?">
                <div className="flex flex-wrap gap-2">
                  {[{ id: null, nome: 'Tanto faz', cor: '#c8902e' }, ...profissionais].map((p) => (
                    <button
                      key={p.id ?? 'qualquer'}
                      type="button"
                      onClick={() => {
                        setProfissionalId(p.id);
                        setDia(null);
                        setHorario(null);
                      }}
                      className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium transition ${
                        p.id === profissionalId ? 'bg-tinta text-papel' : 'bg-white ring-1 ring-linha hover:ring-tinta/40'
                      }`}
                    >
                      <Avatar nome={p.id ? p.nome : '?'} cor={p.cor} tamanho="size-7" />
                      {p.nome}
                    </button>
                  ))}
                </div>
              </Passo>
            )}

            {servico && diaAtual && (
              <Passo numero={3} titulo="Dia e horário">
                <SeletorHorario
                  dados={dados}
                  servico={servico}
                  profissionalId={profissionalId}
                  agora={agora}
                  dia={diaAtual}
                  aoEscolherDia={(d) => {
                    setDia(d);
                    setHorario(null);
                  }}
                  escolhido={horario}
                  aoEscolher={setHorario}
                />
              </Passo>
            )}

            {horario && (
              <Passo numero={4} titulo="Seus dados">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Seu nome">
                    <input className={estiloEntrada} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder="Como te chamamos?" />
                    {tentou && nome.trim().length < 2 && <span className="mt-1 block text-xs text-perigo">Escreva seu nome.</span>}
                  </Campo>
                  <Campo rotulo="WhatsApp" dica="A confirmação e os lembretes chegam aqui.">
                    <input
                      className={estiloEntrada}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(51) 99999-9999"
                    />
                    {tentou && !numero && <span className="mt-1 block text-xs text-perigo">Confira o número, com DDD.</span>}
                  </Campo>
                </div>
              </Passo>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Cartao className="p-5">
              <h2 className="font-semibold">Seu agendamento</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Linha rotulo="Serviço" valor={servico ? `${servico.nome} · ${duracao(servico.duracao)}` : null} />
                <Linha
                  rotulo="Profissional"
                  valor={servico ? (profissionalId ? dados.profissionais.find((p) => p.id === profissionalId)?.nome : 'Quem estiver livre') : null}
                />
                <Linha rotulo="Quando" valor={horario ? `${maiuscula(diaLongo(horario.inicio))}, ${hora(horario.inicio)}` : null} />
                <div className="flex justify-between border-t border-linha pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{servico ? dinheiro(servico.preco) : '–'}</span>
                </div>
              </dl>
              <Botao className="mt-5 w-full" disabled={!horario} onClick={confirmar}>
                <CalendarCheck size={17} /> Confirmar agendamento
              </Botao>
              <p className="mt-3 text-center text-xs text-apagado">Pagamento no local. Você recebe a confirmação no WhatsApp.</p>
            </Cartao>
            <HorarioDaSemana dados={dados} agora={agora} />
          </aside>
        </div>
      )}

      <Link
        to="/painel"
        className="fixed right-4 bottom-4 z-10 flex items-center gap-2 rounded-full bg-latao-claro px-4 py-2.5 text-sm font-semibold text-[#5c3f0f] shadow-lg ring-1 ring-[#e8cf9f] sm:hidden"
      >
        <LayoutDashboard size={16} /> Painel do dono
      </Link>
    </div>
  );
}

function HorarioDaSemana({ dados, agora }: { dados: Dados; agora: Date }) {
  return (
      <div className="mt-4 rounded-2xl px-5 py-4 text-sm ring-1 ring-linha">
        <div className="mb-2 font-medium">Horário de funcionamento</div>
        <ul className="space-y-1 text-apagado">
          {[2, 3, 4, 5, 6, 0, 1].map((d) => {
            const e = dados.config.horarios[d];
            return (
              <li key={d} className={`flex justify-between ${d === agora.getDay() ? 'font-medium text-tinta' : ''}`}>
                <span>{DIAS[d]}</span>
                <span className="tabular-nums">{e ? `${e.abre}–${e.fecha}` : 'Fechado'}</span>
              </li>
            );
          })}
        </ul>
      </div>
  );
}

function Passo({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="entrar">
      <h2 className="mb-3 flex items-center gap-2.5 text-lg font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-latao-claro text-sm text-[#7a5414]">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-apagado">{rotulo}</dt>
      <dd className={`text-right ${valor ? 'font-medium' : 'text-apagado/60'}`}>{valor ?? '–'}</dd>
    </div>
  );
}

function Confirmado({ agendamento, aoRecomecar }: { agendamento: Agendamento; aoRecomecar: () => void }) {
  const dados = useDados();
  const agora = useAgora(5000);
  const confirmacao = mensagensDoAgendamento(dados, agendamento, agora, origem()).filter((m) => m.tipo === 'confirmacao');
  const servico = dados.servicos.find((s) => s.id === agendamento.servicoId)!;
  const profissional = dados.profissionais.find((p) => p.id === agendamento.profissionalId)!;
  const inicio = new Date(agendamento.inicio);

  return (
    <div className="entrar mt-8 grid items-center gap-10 lg:grid-cols-2">
      <div>
        <span className="grid size-12 place-items-center rounded-full bg-zap text-white">
          <Check size={26} strokeWidth={3} />
        </span>
        <h2 className="mt-4 font-titulo text-3xl font-semibold">Horário confirmado!</h2>
        <p className="mt-2 text-apagado">
          {servico.nome} com {profissional.nome}, {diaLongo(inicio)}
          {isSameDay(inicio, agora) ? ' (hoje)' : ''} às {hora(inicio)}.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-4 text-sm ring-1 ring-linha">
          <p className="font-medium">O que acontece agora</p>
          <ul className="mt-2 space-y-1.5 text-apagado">
            <li>• A confirmação chega no seu WhatsApp, como no celular ao lado.</li>
            <li>• Você recebe lembretes 24 horas e 2 horas antes.</li>
            <li>• O horário já aparece na agenda do {profissional.nome} no painel.</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/meu-horario/${agendamento.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-tinta px-4 text-sm font-semibold text-papel hover:bg-tinta-2">
            Ver ou remarcar meu horário
          </Link>
          <Link to="/painel/agenda" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-latao-claro px-4 text-sm font-semibold text-[#5c3f0f]">
            Ver na agenda do dono <ArrowRight size={16} />
          </Link>
          <Botao variante="fantasma" onClick={aoRecomecar}>
            Agendar outro
          </Botao>
        </div>
      </div>
      <CelularWhatsApp negocio={dados.config.negocio} mensagens={confirmacao.map((m) => ({ texto: m.texto, em: m.em }))} />
    </div>
  );
}
