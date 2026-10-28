import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const realSemCentavos = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const dinheiro = (valor: number) => real.format(valor);
export const dinheiroCurto = (valor: number) => realSemCentavos.format(valor);
export const hora = (data: Date) => format(data, 'HH:mm');
export const diaCurto = (data: Date) => format(data, "EEE, dd/MM", { locale: ptBR });
export const diaLongo = (data: Date) => format(data, "EEEE, d 'de' MMMM", { locale: ptBR });

export function duracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/** "5551900000012" → "(51) 90000-0012" */
export function telefone(digitos: string) {
  const d = digitos.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}

/** Aceita o que a pessoa digitar e guarda com 55 na frente. */
export function normalizarWhatsApp(texto: string) {
  const d = texto.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
}

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

export function maiuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
