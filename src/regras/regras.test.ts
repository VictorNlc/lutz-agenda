import { addMinutes, isSameDay } from 'date-fns';
import { describe, expect, test } from 'vitest';
import { gerarDados } from '../dados/semente';
import type { Agendamento, Dados } from '../dados/tipos';
import { normalizarWhatsApp, telefone } from './formato';
import { escolherProfissional, horariosLivres, minutosDoDia, paraMinutos } from './horarios';
import { fichaDoCliente, resumoDoMes } from './indicadores';
import { mensagensDoAgendamento, preencher, todasMensagens } from './mensagens';

// Quarta-feira, 28/10/2026, 10:00 (horário local)
const AGORA = new Date(2026, 9, 28, 10, 0);
const QUINTA = new Date(2026, 9, 29);

function dadosVazios(): Dados {
  return { ...gerarDados(AGORA), agendamentos: [], avulsas: [] };
}

function agendamento(dados: Dados, mudancas: Omit<Partial<Agendamento>, 'inicio'> & { inicio: Date; minutos?: number }): Agendamento {
  const { inicio, minutos = 40, ...resto } = mudancas;
  return {
    id: `t${dados.agendamentos.length + 1}`,
    clienteId: 'c1',
    servicoId: 'corte',
    profissionalId: 'rafael',
    preco: 45,
    status: 'confirmado',
    origem: 'online',
    criadoEm: addMinutes(AGORA, -60).toISOString(),
    ...resto,
    inicio: inicio.toISOString(),
    fim: addMinutes(inicio, minutos).toISOString(),
  };
}

const servico = (dados: Dados, id: string) => dados.servicos.find((s) => s.id === id)!;
const horas = (lista: { inicio: Date }[]) => lista.map((h) => `${String(h.inicio.getHours()).padStart(2, '0')}:${String(h.inicio.getMinutes()).padStart(2, '0')}`);

describe('horários livres', () => {
  test('dia inteiro livre: de 30 em 30 min, sem o almoço e sem passar do fechamento', () => {
    const dados = dadosVazios();
    const livres = horariosLivres(dados, { dia: QUINTA, servico: servico(dados, 'corte'), profissionalId: 'rafael', agora: AGORA });
    const lista = horas(livres);
    expect(lista[0]).toBe('09:00');
    expect(lista).toContain('11:00'); // 11:00–11:40 cabe antes do almoço
    expect(lista).not.toContain('11:30'); // 11:30–12:10 invadiria o almoço
    expect(lista).not.toContain('12:00');
    expect(lista).toContain('13:00');
    expect(lista.at(-1)).toBe('18:00'); // 18:00–18:40; 18:30 passaria das 19:00
  });

  test('não oferece horário que encosta em outro atendimento do mesmo profissional', () => {
    const dados = dadosVazios();
    dados.agendamentos.push(agendamento(dados, { inicio: new Date(2026, 9, 29, 14, 0), minutos: 70 }));
    const lista = horas(horariosLivres(dados, { dia: QUINTA, servico: servico(dados, 'corte'), profissionalId: 'rafael', agora: AGORA }));
    expect(lista).not.toContain('13:30'); // 13:30–14:10 bate no das 14:00
    expect(lista).not.toContain('14:00');
    expect(lista).not.toContain('14:30');
    expect(lista).toContain('15:30'); // o anterior termina 15:10
    expect(lista).not.toContain('15:00');
  });

  test('agendamento cancelado libera o horário', () => {
    const dados = dadosVazios();
    dados.agendamentos.push(agendamento(dados, { inicio: new Date(2026, 9, 29, 14, 0), status: 'cancelado' }));
    const lista = horas(horariosLivres(dados, { dia: QUINTA, servico: servico(dados, 'corte'), profissionalId: 'rafael', agora: AGORA }));
    expect(lista).toContain('14:00');
  });

  test('hoje: só a partir de agora + antecedência mínima (1 h)', () => {
    const dados = dadosVazios();
    const lista = horas(horariosLivres(dados, { dia: AGORA, servico: servico(dados, 'corte'), profissionalId: 'rafael', agora: AGORA }));
    expect(lista[0]).toBe('11:00');
  });

  test('dia fechado e profissional de folga não têm horário', () => {
    const dados = dadosVazios();
    const segunda = new Date(2026, 10, 2);
    expect(horariosLivres(dados, { dia: segunda, servico: servico(dados, 'corte'), agora: AGORA })).toEqual([]);
    const terca = new Date(2026, 10, 3); // Diego não trabalha terça
    expect(horariosLivres(dados, { dia: terca, servico: servico(dados, 'corte'), profissionalId: 'diego', agora: AGORA })).toEqual([]);
  });

  test('só profissionais que fazem o serviço', () => {
    const dados = dadosVazios();
    const livres = horariosLivres(dados, { dia: QUINTA, servico: servico(dados, 'platinado'), agora: AGORA });
    expect(new Set(livres.flatMap((h) => h.profissionais))).toEqual(new Set(['rafael', 'diego']));
  });

  test('"qualquer um": horário segue livre enquanto alguém estiver livre, e vai para quem tem menos trabalho', () => {
    const dados = dadosVazios();
    dados.agendamentos.push(agendamento(dados, { inicio: new Date(2026, 9, 29, 9, 0), profissionalId: 'rafael' }));
    dados.agendamentos.push(agendamento(dados, { inicio: new Date(2026, 9, 29, 9, 0), profissionalId: 'diego' }));
    const das9 = horariosLivres(dados, { dia: QUINTA, servico: servico(dados, 'corte'), agora: AGORA }).find((h) => h.inicio.getHours() === 9 && h.inicio.getMinutes() === 0)!;
    expect(das9.profissionais).toEqual(['lucas']);
    expect(escolherProfissional(dados, ['rafael', 'lucas'], QUINTA)).toBe('lucas');
  });

  test('ao remarcar, o próprio horário não conta como ocupado', () => {
    const dados = dadosVazios();
    const meu = agendamento(dados, { inicio: new Date(2026, 9, 29, 14, 0) });
    dados.agendamentos.push(meu);
    const lista = horas(horariosLivres(dados, { dia: QUINTA, servico: servico(dados, 'corte'), profissionalId: 'rafael', agora: AGORA, ignorarId: meu.id }));
    expect(lista).toContain('14:00');
  });
});

describe('mensagens do WhatsApp', () => {
  test('preenche as variáveis e mantém as desconhecidas', () => {
    expect(preencher('Oi, {nome}! {x}', { nome: 'João' })).toBe('Oi, João! {x}');
  });

  test('agendado com antecedência: confirmação, lembrete de 24 h e de 2 h, na ordem certa', () => {
    const dados = dadosVazios();
    const ag = agendamento(dados, { inicio: new Date(2026, 9, 30, 15, 0), criadoEm: AGORA.toISOString() });
    const msgs = mensagensDoAgendamento(dados, ag, AGORA, 'https://demo');
    expect(msgs.map((m) => m.tipo)).toEqual(['confirmacao', 'lembrete24', 'lembrete2']);
    expect(msgs.map((m) => m.situacao)).toEqual(['enviada', 'agendada', 'agendada']);
    expect(msgs[1].em).toEqual(new Date(2026, 9, 29, 15, 0));
    expect(msgs[2].em).toEqual(new Date(2026, 9, 30, 13, 0));
    expect(msgs[0].texto).toContain('Oi, João!');
    expect(msgs[0].texto).toContain('corte de cabelo com Rafael');
    expect(msgs[0].texto).toContain('https://demo/meu-horario/');
  });

  test('marcado para daqui a 3 h: não manda lembrete de 24 h atrasado', () => {
    const dados = dadosVazios();
    const ag = agendamento(dados, { inicio: addMinutes(AGORA, 180), criadoEm: AGORA.toISOString() });
    expect(mensagensDoAgendamento(dados, ag, AGORA, '').map((m) => m.tipo)).toEqual(['confirmacao', 'lembrete2']);
  });

  test('cancelado: lembretes que ainda não saíram ficam cancelados', () => {
    const dados = dadosVazios();
    const ag = agendamento(dados, {
      inicio: new Date(2026, 9, 30, 15, 0),
      criadoEm: new Date(2026, 9, 20).toISOString(),
      status: 'cancelado',
      canceladoEm: AGORA.toISOString(),
    });
    const msgs = mensagensDoAgendamento(dados, ag, AGORA, '');
    expect(msgs.find((m) => m.tipo === 'lembrete24')!.situacao).toBe('cancelada');
    expect(msgs.find((m) => m.tipo === 'confirmacao')!.situacao).toBe('enviada');
  });

  test('pós-atendimento só para quem foi atendido; modelo desligado não sai', () => {
    const dados = dadosVazios();
    const feito = agendamento(dados, { inicio: new Date(2026, 9, 27, 9, 0), criadoEm: new Date(2026, 9, 20).toISOString(), status: 'concluido' });
    const faltou = { ...feito, status: 'faltou' as const };
    const pos = mensagensDoAgendamento(dados, feito, AGORA, 'https://demo').find((m) => m.tipo === 'pos')!;
    expect(pos.texto).toMatch(/https:\/\/demo$/); // link para marcar o próximo, não para o horário que passou
    expect(mensagensDoAgendamento(dados, faltou, AGORA, '').some((m) => m.tipo === 'pos')).toBe(false);
    dados.modelos = dados.modelos.map((m) => (m.tipo === 'pos' ? { ...m, ativo: false } : m));
    expect(mensagensDoAgendamento(dados, feito, AGORA, '').some((m) => m.tipo === 'pos')).toBe(false);
  });
});

describe('dados da demonstração', () => {
  const dados = gerarDados(AGORA);

  test('são sempre os mesmos para o mesmo dia', () => {
    expect(gerarDados(AGORA).agendamentos).toEqual(dados.agendamentos);
  });

  test('nenhum profissional tem dois atendimentos ao mesmo tempo', () => {
    const validos = dados.agendamentos.filter((a) => a.status !== 'cancelado');
    for (const a of validos) {
      const choque = validos.find(
        (b) => b !== a && b.profissionalId === a.profissionalId && new Date(b.inicio) < new Date(a.fim) && new Date(a.inicio) < new Date(b.fim),
      );
      expect(choque, `${a.id} bate com ${choque?.id}`).toBeUndefined();
    }
  });

  test('tudo dentro do expediente, fora do almoço, em dia de trabalho do profissional', () => {
    for (const a of dados.agendamentos) {
      const inicio = new Date(a.inicio);
      const fim = new Date(a.fim);
      const exp = dados.config.horarios[inicio.getDay()]!;
      expect(exp, a.id).not.toBeNull();
      expect(minutosDoDia(inicio)).toBeGreaterThanOrEqual(paraMinutos(exp.abre));
      expect(minutosDoDia(fim)).toBeLessThanOrEqual(paraMinutos(exp.fecha));
      expect(minutosDoDia(fim) <= 12 * 60 || minutosDoDia(inicio) >= 13 * 60, `${a.id} no almoço`).toBe(true);
      expect(dados.profissionais.find((p) => p.id === a.profissionalId)!.dias).toContain(inicio.getDay());
    }
  });

  test('passado resolvido, futuro em aberto, e hoje tem movimento', () => {
    const passado = dados.agendamentos.filter((a) => new Date(a.fim) <= AGORA);
    const futuro = dados.agendamentos.filter((a) => new Date(a.inicio) > AGORA);
    expect(passado.every((a) => a.status !== 'confirmado')).toBe(true);
    expect(futuro.every((a) => a.status === 'confirmado' || a.status === 'cancelado')).toBe(true);
    expect(dados.agendamentos.every((a) => new Date(a.criadoEm) <= AGORA)).toBe(true);
    expect(dados.agendamentos.filter((a) => isSameDay(new Date(a.inicio), AGORA)).length).toBeGreaterThan(10);
  });

  test('tem clientes sumidos para chamar de volta e números de mentira', () => {
    const sumidos = dados.clientes.map((c) => fichaDoCliente(dados, c, AGORA)).filter((f) => f.sumido);
    expect(sumidos.length).toBeGreaterThan(3);
    expect(dados.clientes.every((c) => c.whatsapp.startsWith('5551900000'))).toBe(true);
  });

  test('indicadores do mês fazem sentido', () => {
    const r = resumoDoMes(dados, AGORA);
    expect(r.faturamento).toBeGreaterThan(5000);
    expect(r.ticketMedio).toBeGreaterThan(30);
    expect(r.taxaFaltas).toBeGreaterThan(0);
    expect(r.taxaFaltas).toBeLessThan(0.2);
  });

  test('caixa de saída mistura enviadas e agendadas, da mais nova para a mais antiga', () => {
    const msgs = todasMensagens(dados, AGORA, '');
    expect(msgs.some((m) => m.situacao === 'agendada')).toBe(true);
    expect(msgs.some((m) => m.situacao === 'enviada')).toBe(true);
    for (let i = 1; i < msgs.length; i++) expect(msgs[i - 1].em >= msgs[i].em).toBe(true);
  });
});

describe('telefone', () => {
  test('aceita o número de vários jeitos e mostra formatado', () => {
    expect(normalizarWhatsApp('(51) 99832-8628')).toBe('5551998328628');
    expect(normalizarWhatsApp('+55 51 99832 8628')).toBe('5551998328628');
    expect(normalizarWhatsApp('9832-8628')).toBeNull();
    expect(telefone('5551900000012')).toBe('(51) 90000-0012');
  });
});
