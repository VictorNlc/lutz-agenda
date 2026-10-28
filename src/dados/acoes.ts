import { addMinutes } from 'date-fns';
import { textoReativacao } from '../regras/mensagens';
import { alterar, lerDados } from './loja';
import type { Agendamento, Config, Modelo, Profissional, Servico, Status } from './tipos';

const novoId = (prefixo: string) => `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function agendar(pedido: {
  nome: string;
  whatsapp: string;
  servicoId: string;
  profissionalId: string;
  inicio: Date;
  origem: Agendamento['origem'];
}): Agendamento {
  const dados = lerDados();
  const servico = dados.servicos.find((s) => s.id === pedido.servicoId)!;
  const agora = new Date().toISOString();
  let cliente = dados.clientes.find((c) => c.whatsapp === pedido.whatsapp);
  const clienteNovo = !cliente;
  if (!cliente) cliente = { id: novoId('c'), nome: pedido.nome.trim(), whatsapp: pedido.whatsapp, criadoEm: agora };

  const agendamento: Agendamento = {
    id: novoId('a'),
    clienteId: cliente.id,
    servicoId: servico.id,
    profissionalId: pedido.profissionalId,
    inicio: pedido.inicio.toISOString(),
    fim: addMinutes(pedido.inicio, servico.duracao).toISOString(),
    preco: servico.preco,
    status: 'confirmado',
    origem: pedido.origem,
    criadoEm: agora,
  };
  const novoCliente = cliente;
  alterar((d) => ({
    ...d,
    clientes: clienteNovo ? [...d.clientes, novoCliente] : d.clientes,
    agendamentos: [...d.agendamentos, agendamento],
  }));
  return agendamento;
}

export function mudarStatus(id: string, status: Status) {
  alterar((d) => ({
    ...d,
    agendamentos: d.agendamentos.map((a) =>
      a.id === id ? { ...a, status, canceladoEm: status === 'cancelado' ? new Date().toISOString() : undefined } : a,
    ),
  }));
}

/** Novo horário: a confirmação sai de novo, e os lembretes passam a valer para o novo horário. */
export function remarcar(id: string, inicio: Date, profissionalId: string) {
  alterar((d) => ({
    ...d,
    agendamentos: d.agendamentos.map((a) => {
      if (a.id !== id) return a;
      const minutos = (new Date(a.fim).getTime() - new Date(a.inicio).getTime()) / 60_000;
      return {
        ...a,
        profissionalId,
        inicio: inicio.toISOString(),
        fim: addMinutes(inicio, minutos).toISOString(),
        criadoEm: new Date().toISOString(),
      };
    }),
  }));
}

export function chamarDeVolta(clienteId: string, origem: string) {
  const texto = textoReativacao(lerDados(), clienteId, origem);
  alterar((d) => ({
    ...d,
    avulsas: [...d.avulsas, { id: novoId('m'), clienteId, tipo: 'reativacao', texto, em: new Date().toISOString() }],
  }));
}

export function salvarModelo(modelo: Modelo) {
  alterar((d) => ({ ...d, modelos: d.modelos.map((m) => (m.tipo === modelo.tipo ? modelo : m)) }));
}

export function salvarServico(servico: Servico) {
  alterar((d) => ({
    ...d,
    servicos: d.servicos.some((s) => s.id === servico.id)
      ? d.servicos.map((s) => (s.id === servico.id ? servico : s))
      : [...d.servicos, servico],
  }));
}

export function novoServico(): Servico {
  return { id: novoId('s'), nome: '', descricao: '', duracao: 30, preco: 0, ativo: true };
}

export function salvarProfissional(profissional: Profissional) {
  alterar((d) => ({ ...d, profissionais: d.profissionais.map((p) => (p.id === profissional.id ? profissional : p)) }));
}

export function salvarConfig(config: Config) {
  alterar((d) => ({ ...d, config }));
}
