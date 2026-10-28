import { addMinutes, isSameDay, startOfDay } from 'date-fns';
import type { Agendamento, Dados, Expediente, Profissional, Servico } from '../dados/tipos';

export function paraMinutos(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutosDoDia(data: Date) {
  return data.getHours() * 60 + data.getMinutes();
}

function sobrepoe(inicioA: number, fimA: number, inicioB: number, fimB: number) {
  return inicioA < fimB && inicioB < fimA;
}

export function expedienteDoDia(dados: Dados, dia: Date): Expediente | null {
  return dados.config.horarios[dia.getDay()] ?? null;
}

/** Profissionais que fazem o serviço e trabalham nesse dia da semana. */
export function profissionaisPara(dados: Dados, servicoId: string, dia: Date): Profissional[] {
  return dados.profissionais.filter(
    (p) => p.ativo && p.servicos.includes(servicoId) && p.dias.includes(dia.getDay()),
  );
}

function ocupacao(agendamentos: Agendamento[], profissionalId: string, dia: Date) {
  return agendamentos
    .filter((a) => a.profissionalId === profissionalId && a.status !== 'cancelado' && isSameDay(new Date(a.inicio), dia))
    .map((a) => [minutosDoDia(new Date(a.inicio)), minutosDoDia(new Date(a.fim))] as const);
}

export interface HorarioLivre {
  inicio: Date;
  profissionais: string[];
}

/**
 * Horários em que o serviço cabe inteiro: dentro do expediente, fora do almoço,
 * respeitando a antecedência mínima e sem encostar em outro atendimento do profissional.
 * Sem profissional escolhido, vale qualquer um que esteja livre.
 */
export function horariosLivres(
  dados: Dados,
  { dia, servico, profissionalId, agora, ignorarId }: { dia: Date; servico: Servico; profissionalId?: string | null; agora: Date; ignorarId?: string },
): HorarioLivre[] {
  const expediente = expedienteDoDia(dados, dia);
  if (!expediente || !servico.ativo) return [];

  const candidatos = profissionaisPara(dados, servico.id, dia).filter((p) => !profissionalId || p.id === profissionalId);
  if (!candidatos.length) return [];

  const agendamentos = ignorarId ? dados.agendamentos.filter((a) => a.id !== ignorarId) : dados.agendamentos;
  const ocupados = new Map(candidatos.map((p) => [p.id, ocupacao(agendamentos, p.id, dia)]));
  const { almoco, intervalo, antecedenciaMin } = dados.config;
  const limite = addMinutes(agora, antecedenciaMin);
  const base = startOfDay(dia);
  const abre = paraMinutos(expediente.abre);
  const fecha = paraMinutos(expediente.fecha);

  const livres: HorarioLivre[] = [];
  for (let t = abre; t + servico.duracao <= fecha; t += intervalo) {
    const fim = t + servico.duracao;
    if (almoco && sobrepoe(t, fim, paraMinutos(almoco.abre), paraMinutos(almoco.fecha))) continue;
    const inicio = addMinutes(base, t);
    if (inicio < limite) continue;
    const quem = candidatos
      .filter((p) => !ocupados.get(p.id)!.some(([i, f]) => sobrepoe(t, fim, i, f)))
      .map((p) => p.id);
    if (quem.length) livres.push({ inicio, profissionais: quem });
  }
  return livres;
}

/** Entre os livres, quem tem menos atendimentos no dia (divide o trabalho). */
export function escolherProfissional(dados: Dados, livres: string[], dia: Date) {
  const carga = (id: string) =>
    dados.agendamentos.filter((a) => a.profissionalId === id && a.status !== 'cancelado' && isSameDay(new Date(a.inicio), dia)).length;
  return [...livres].sort((a, b) => carga(a) - carga(b))[0];
}
