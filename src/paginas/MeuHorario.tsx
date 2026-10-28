import { startOfDay } from 'date-fns';
import { CalendarClock, CalendarX2, Check } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SeletorHorario } from '../componentes/SeletorHorario';
import { Avatar, Botao, Cartao, Selo, useAgora } from '../componentes/ui';
import { mudarStatus, remarcar } from '../dados/acoes';
import { useDados } from '../dados/loja';
import { diaLongo, dinheiro, duracao, hora, maiuscula, primeiroNome } from '../regras/formato';
import { escolherProfissional, type HorarioLivre } from '../regras/horarios';

/** A página que abre pelo link da mensagem de WhatsApp. */
export function MeuHorario() {
  const { id } = useParams();
  const dados = useDados();
  const agora = useAgora();
  const [modo, setModo] = useState<'ver' | 'cancelar' | 'remarcar'>('ver');
  const [dia, setDia] = useState<Date | null>(null);
  const [novo, setNovo] = useState<HorarioLivre | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ag = dados.agendamentos.find((a) => a.id === id);
  if (!ag) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-titulo text-3xl font-semibold">Horário não encontrado</h1>
        <p className="mt-2 text-apagado">O link pode ser de outra demonstração. Que tal marcar um novo?</p>
        <Link to="/" className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-tinta px-4 text-sm font-semibold text-papel">
          Agendar horário
        </Link>
      </div>
    );
  }

  const cliente = dados.clientes.find((c) => c.id === ag.clienteId)!;
  const servico = dados.servicos.find((s) => s.id === ag.servicoId)!;
  const profissional = dados.profissionais.find((p) => p.id === ag.profissionalId)!;
  const inicio = new Date(ag.inicio);
  const passou = inicio <= agora;
  const podeMexer = ag.status === 'confirmado' && !passou;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <p className="text-sm font-medium text-latao">{dados.config.negocio}</p>
      <h1 className="font-titulo text-3xl font-semibold">Olá, {primeiroNome(cliente.nome)}!</h1>

      {aviso && (
        <div className="entrar mt-4 flex items-center gap-2 rounded-xl bg-zap/12 px-4 py-3 text-sm font-medium text-[#137a3d]">
          <Check size={16} /> {aviso}
        </div>
      )}

      <Cartao className="mt-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">{servico.nome}</div>
            <div className="mt-0.5 text-apagado">
              {maiuscula(diaLongo(inicio))} às {hora(inicio)} · {duracao(servico.duracao)}
            </div>
          </div>
          {ag.status === 'cancelado' ? <Selo tom="vermelho">Cancelado</Selo> : passou ? <Selo tom="cinza">Já passou</Selo> : <Selo tom="verde">Confirmado</Selo>}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-linha pt-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <Avatar nome={profissional.nome} cor={profissional.cor} tamanho="size-7" /> com {profissional.nome}
          </span>
          <span className="font-semibold tabular-nums">{dinheiro(ag.preco)}</span>
        </div>
      </Cartao>

      {podeMexer && modo === 'ver' && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Botao onClick={() => setModo('remarcar')}>
            <CalendarClock size={16} /> Remarcar
          </Botao>
          <Botao variante="perigo" onClick={() => setModo('cancelar')}>
            <CalendarX2 size={16} /> Cancelar horário
          </Botao>
        </div>
      )}

      {podeMexer && modo === 'cancelar' && (
        <div className="entrar mt-4 rounded-2xl bg-perigo/5 p-4 ring-1 ring-perigo/20">
          <p className="font-medium">Cancelar este horário?</p>
          <p className="mt-1 text-sm text-apagado">Ele fica livre para outra pessoa, e os lembretes não são enviados.</p>
          <div className="mt-3 flex gap-3">
            <Botao
              variante="perigo"
              onClick={() => {
                mudarStatus(ag.id, 'cancelado');
                setModo('ver');
                setAviso('Horário cancelado. A barbearia já foi avisada.');
              }}
            >
              Sim, cancelar
            </Botao>
            <Botao variante="fantasma" onClick={() => setModo('ver')}>
              Voltar
            </Botao>
          </div>
        </div>
      )}

      {podeMexer && modo === 'remarcar' && (
        <div className="entrar mt-6">
          <h2 className="mb-3 font-semibold">Escolha o novo horário</h2>
          <SeletorHorario
            dados={dados}
            servico={servico}
            profissionalId={profissional.id}
            agora={agora}
            dia={dia ?? startOfDay(inicio)}
            aoEscolherDia={(d) => {
              setDia(d);
              setNovo(null);
            }}
            escolhido={novo}
            aoEscolher={setNovo}
            ignorarId={ag.id}
          />
          <div className="mt-5 flex gap-3">
            <Botao
              disabled={!novo}
              onClick={() => {
                if (!novo) return;
                remarcar(ag.id, novo.inicio, novo.profissionais.includes(profissional.id) ? profissional.id : escolherProfissional(dados, novo.profissionais, novo.inicio));
                setModo('ver');
                setNovo(null);
                setAviso('Pronto, horário remarcado! A nova confirmação foi para o seu WhatsApp.');
              }}
            >
              Confirmar novo horário
            </Botao>
            <Botao variante="fantasma" onClick={() => setModo('ver')}>
              Voltar
            </Botao>
          </div>
        </div>
      )}

      <div className="mt-10 border-t border-linha pt-6 text-sm text-apagado">
        <Link to="/" className="font-medium text-tinta underline underline-offset-4">
          Marcar outro serviço
        </Link>
      </div>
    </div>
  );
}
