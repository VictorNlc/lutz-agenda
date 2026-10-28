import { addDays, differenceInCalendarDays, isSameDay, isSameMonth, startOfDay, startOfMonth, subMonths } from 'date-fns';
import type { Agendamento, Cliente, Dados } from '../dados/tipos';

export const DIAS_PARA_SUMIDO = 30;

const concluidos = (lista: Agendamento[]) => lista.filter((a) => a.status === 'concluido');
const soma = (lista: Agendamento[]) => lista.reduce((t, a) => t + a.preco, 0);

export function resumoDoMes(dados: Dados, agora: Date) {
  const doMes = dados.agendamentos.filter((a) => isSameMonth(new Date(a.inicio), agora) && new Date(a.inicio) <= agora);
  const feitos = concluidos(doMes);
  const faturamento = soma(feitos);

  // Mesmo pedaço do mês passado, para comparar de forma justa
  const mesPassado = subMonths(agora, 1);
  const inicioPassado = startOfMonth(mesPassado);
  const atePassado = dados.agendamentos.filter((a) => {
    const d = new Date(a.inicio);
    return d >= inicioPassado && d <= mesPassado;
  });
  const faturamentoPassado = soma(concluidos(atePassado));

  const ultimos30 = dados.agendamentos.filter((a) => {
    const d = new Date(a.inicio);
    return d <= agora && d >= addDays(agora, -30);
  });
  const vieram = ultimos30.filter((a) => a.status === 'concluido').length;
  const faltaram = ultimos30.filter((a) => a.status === 'faltou').length;

  return {
    faturamento,
    variacao: faturamentoPassado ? (faturamento - faturamentoPassado) / faturamentoPassado : null,
    atendimentos: feitos.length,
    ticketMedio: feitos.length ? faturamento / feitos.length : 0,
    taxaFaltas: vieram + faltaram ? faltaram / (vieram + faltaram) : 0,
    online: doMes.length ? doMes.filter((a) => a.origem === 'online').length / doMes.length : 0,
  };
}

export function faturamentoPorDia(dados: Dados, agora: Date, dias = 30) {
  const hoje = startOfDay(agora);
  return Array.from({ length: dias }, (_, i) => {
    const dia = addDays(hoje, i - dias + 1);
    const valor = soma(concluidos(dados.agendamentos.filter((a) => isSameDay(new Date(a.inicio), dia))));
    return { dia, valor };
  });
}

export function servicosMaisVendidos(dados: Dados, agora: Date) {
  const doMes = concluidos(dados.agendamentos.filter((a) => isSameMonth(new Date(a.inicio), agora)));
  return dados.servicos
    .map((s) => {
      const deste = doMes.filter((a) => a.servicoId === s.id);
      return { servico: s, quantidade: deste.length, valor: soma(deste) };
    })
    .filter((x) => x.quantidade > 0)
    .sort((a, b) => b.valor - a.valor);
}

export interface FichaCliente {
  cliente: Cliente;
  visitas: number;
  total: number;
  faltas: number;
  ultimaVisita: Date | null;
  proximo: Agendamento | null;
  diasSemVir: number | null;
  sumido: boolean;
}

export function fichaDoCliente(dados: Dados, cliente: Cliente, agora: Date): FichaCliente {
  const dele = dados.agendamentos.filter((a) => a.clienteId === cliente.id);
  const feitos = concluidos(dele).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const ultimaVisita = feitos[0] ? new Date(feitos[0].inicio) : null;
  const proximo =
    dele
      .filter((a) => a.status === 'confirmado' && new Date(a.inicio) > agora)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))[0] ?? null;
  const diasSemVir = ultimaVisita ? differenceInCalendarDays(agora, ultimaVisita) : null;
  return {
    cliente,
    visitas: feitos.length,
    total: soma(feitos),
    faltas: dele.filter((a) => a.status === 'faltou').length,
    ultimaVisita,
    proximo,
    diasSemVir,
    sumido: !proximo && diasSemVir !== null && diasSemVir > DIAS_PARA_SUMIDO,
  };
}

export function fichasDosClientes(dados: Dados, agora: Date) {
  return dados.clientes.map((c) => fichaDoCliente(dados, c, agora));
}
