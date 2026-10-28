import { addHours, addMinutes } from 'date-fns';
import type { Agendamento, Dados, TipoMensagem } from '../dados/tipos';
import { diaCurto, hora, primeiroNome } from './formato';

export const NOMES_MENSAGEM: Record<TipoMensagem, string> = {
  confirmacao: 'Confirmação',
  lembrete24: 'Lembrete 24 h antes',
  lembrete2: 'Lembrete 2 h antes',
  pos: 'Pós-atendimento',
  reativacao: 'Chamar de volta',
};

export const QUANDO_MENSAGEM: Record<TipoMensagem, string> = {
  confirmacao: 'Na hora em que o cliente agenda',
  lembrete24: '24 horas antes do horário',
  lembrete2: '2 horas antes do horário',
  pos: '2 horas depois do atendimento concluído',
  reativacao: 'Quando você clica em "Chamar de volta"',
};

export const VARIAVEIS = ['{nome}', '{servico}', '{profissional}', '{data}', '{hora}', '{negocio}', '{link}'];

export type Situacao = 'enviada' | 'agendada' | 'cancelada';

export interface Mensagem {
  id: string;
  tipo: TipoMensagem;
  clienteId: string;
  agendamentoId?: string;
  texto: string;
  em: Date;
  situacao: Situacao;
}

export function preencher(texto: string, valores: Record<string, string>) {
  return texto.replace(/\{(\w+)\}/g, (inteiro, chave) => valores[chave] ?? inteiro);
}

export function linkDoHorario(origem: string, agendamentoId: string) {
  return `${origem}/meu-horario/${agendamentoId}`;
}

function valoresDoAgendamento(dados: Dados, ag: Agendamento, origem: string) {
  const cliente = dados.clientes.find((c) => c.id === ag.clienteId);
  const servico = dados.servicos.find((s) => s.id === ag.servicoId);
  const profissional = dados.profissionais.find((p) => p.id === ag.profissionalId);
  const inicio = new Date(ag.inicio);
  return {
    nome: cliente ? primeiroNome(cliente.nome) : '',
    servico: servico?.nome.toLowerCase() ?? '',
    profissional: profissional?.nome ?? '',
    data: diaCurto(inicio),
    hora: hora(inicio),
    negocio: dados.config.negocio,
    link: linkDoHorario(origem, ag.id),
  };
}

/** Quando cada mensagem automática sai para um agendamento (null = não sai). */
function momento(tipo: TipoMensagem, ag: Agendamento): Date | null {
  const criado = new Date(ag.criadoEm);
  const inicio = new Date(ag.inicio);
  switch (tipo) {
    case 'confirmacao':
      return criado;
    case 'lembrete24': {
      const em = addHours(inicio, -24);
      return em > criado ? em : null;
    }
    case 'lembrete2': {
      const em = addHours(inicio, -2);
      return em > criado ? em : null;
    }
    case 'pos':
      return ag.status === 'concluido' ? addMinutes(new Date(ag.fim), 120) : null;
    default:
      return null;
  }
}

export function mensagensDoAgendamento(dados: Dados, ag: Agendamento, agora: Date, origem: string): Mensagem[] {
  const valores = valoresDoAgendamento(dados, ag, origem);
  const cancelado = ag.status === 'cancelado' ? new Date(ag.canceladoEm ?? ag.criadoEm) : null;
  const lista: Mensagem[] = [];

  for (const modelo of dados.modelos) {
    if (!modelo.ativo || modelo.tipo === 'reativacao') continue;
    const em = momento(modelo.tipo, ag);
    if (!em) continue;
    let situacao: Situacao = em <= agora ? 'enviada' : 'agendada';
    if (cancelado && em > cancelado) situacao = 'cancelada';
    // Depois do atendimento o link serve para marcar o próximo, não para ver o que passou
    const link = modelo.tipo === 'pos' ? origem : valores.link;
    lista.push({
      id: `${ag.id}:${modelo.tipo}`,
      tipo: modelo.tipo,
      clienteId: ag.clienteId,
      agendamentoId: ag.id,
      texto: preencher(modelo.texto, { ...valores, link }),
      em,
      situacao,
    });
  }
  return lista;
}

/** Caixa de saída inteira: automáticas dos agendamentos + as avulsas, da mais nova para a mais antiga. */
export function todasMensagens(dados: Dados, agora: Date, origem: string): Mensagem[] {
  const automaticas = dados.agendamentos.flatMap((ag) => mensagensDoAgendamento(dados, ag, agora, origem));
  const avulsas: Mensagem[] = dados.avulsas.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    clienteId: m.clienteId,
    texto: m.texto,
    em: new Date(m.em),
    situacao: 'enviada',
  }));
  return [...automaticas, ...avulsas].sort((a, b) => b.em.getTime() - a.em.getTime());
}

export function textoReativacao(dados: Dados, clienteId: string, origem: string) {
  const modelo = dados.modelos.find((m) => m.tipo === 'reativacao');
  const cliente = dados.clientes.find((c) => c.id === clienteId);
  return preencher(modelo?.texto ?? '', {
    nome: cliente ? primeiroNome(cliente.nome) : '',
    negocio: dados.config.negocio,
    link: origem,
  });
}
