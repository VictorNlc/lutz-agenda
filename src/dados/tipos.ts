/** Horário no formato "09:00". */
export interface Expediente {
  abre: string;
  fecha: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracao: number; // minutos
  preco: number;
  ativo: boolean;
}

export interface Profissional {
  id: string;
  nome: string;
  cor: string;
  servicos: string[];
  dias: number[]; // 0 = domingo
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string; // só dígitos, com 55
  criadoEm: string;
}

export type Status = 'confirmado' | 'concluido' | 'faltou' | 'cancelado';

export interface Agendamento {
  id: string;
  clienteId: string;
  servicoId: string;
  profissionalId: string;
  inicio: string; // ISO
  fim: string; // ISO
  preco: number;
  status: Status;
  origem: 'online' | 'painel';
  criadoEm: string;
  canceladoEm?: string;
}

export type TipoMensagem = 'confirmacao' | 'lembrete24' | 'lembrete2' | 'pos' | 'reativacao';

export interface Modelo {
  tipo: TipoMensagem;
  ativo: boolean;
  texto: string;
}

/** Mensagem disparada à mão pelo painel (as outras saem dos agendamentos). */
export interface MensagemAvulsa {
  id: string;
  clienteId: string;
  tipo: 'reativacao';
  texto: string;
  em: string;
}

export interface Config {
  negocio: string;
  endereco: string;
  horarios: (Expediente | null)[]; // índice = dia da semana
  almoco: Expediente | null;
  antecedenciaMin: number; // minutos
  intervalo: number; // minutos entre horários oferecidos
}

export interface Dados {
  versao: number;
  geradoEm: string;
  config: Config;
  servicos: Servico[];
  profissionais: Profissional[];
  clientes: Cliente[];
  agendamentos: Agendamento[];
  modelos: Modelo[];
  avulsas: MensagemAvulsa[];
}
