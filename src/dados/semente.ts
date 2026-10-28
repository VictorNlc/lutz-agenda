import { addDays, addMinutes, startOfDay } from 'date-fns';
import { paraMinutos } from '../regras/horarios';
import type { Agendamento, Cliente, Config, Dados, Modelo, Profissional, Servico } from './tipos';

export const VERSAO = 1;

const CONFIG: Config = {
  negocio: 'Barbearia Modelo',
  endereco: 'Rua Exemplo, 100 · Centro',
  horarios: [
    null,
    null,
    { abre: '09:00', fecha: '19:00' },
    { abre: '09:00', fecha: '19:00' },
    { abre: '09:00', fecha: '19:00' },
    { abre: '09:00', fecha: '20:00' },
    { abre: '08:00', fecha: '17:00' },
  ],
  almoco: { abre: '12:00', fecha: '13:00' },
  antecedenciaMin: 60,
  intervalo: 30,
};

const SERVICOS: Servico[] = [
  { id: 'corte', nome: 'Corte de cabelo', descricao: 'Máquina e tesoura, com lavagem e finalização.', duracao: 40, preco: 45, ativo: true },
  { id: 'corte-barba', nome: 'Corte + barba', descricao: 'O combo completo, com toalha quente na barba.', duracao: 70, preco: 75, ativo: true },
  { id: 'barba', nome: 'Barba completa', descricao: 'Navalha, toalha quente e hidratação.', duracao: 30, preco: 35, ativo: true },
  { id: 'infantil', nome: 'Corte infantil', descricao: 'Até 12 anos.', duracao: 30, preco: 40, ativo: true },
  { id: 'pezinho', nome: 'Pezinho e acabamento', descricao: 'Para manter o corte em dia entre uma visita e outra.', duracao: 15, preco: 15, ativo: true },
  { id: 'sobrancelha', nome: 'Sobrancelha', descricao: 'Na navalha ou na pinça.', duracao: 15, preco: 15, ativo: true },
  { id: 'platinado', nome: 'Platinado', descricao: 'Descoloração completa com matização.', duracao: 120, preco: 160, ativo: true },
];

const PROFISSIONAIS: Profissional[] = [
  { id: 'rafael', nome: 'Rafael', cor: '#c2410c', servicos: SERVICOS.map((s) => s.id), dias: [2, 3, 4, 5, 6], ativo: true },
  { id: 'diego', nome: 'Diego', cor: '#0f766e', servicos: SERVICOS.map((s) => s.id), dias: [3, 4, 5, 6], ativo: true },
  { id: 'lucas', nome: 'Lucas', cor: '#6d28d9', servicos: ['corte', 'corte-barba', 'barba', 'infantil', 'pezinho', 'sobrancelha'], dias: [2, 3, 4, 5, 6], ativo: true },
];

export const MODELOS_PADRAO: Modelo[] = [
  {
    tipo: 'confirmacao',
    ativo: true,
    texto: 'Oi, {nome}! Seu horário na {negocio} está confirmado:\n\n{servico} com {profissional}\n{data} às {hora}\n\nPrecisa remarcar ou cancelar? É só tocar aqui: {link}',
  },
  {
    tipo: 'lembrete24',
    ativo: true,
    texto: 'Oi, {nome}! Passando para lembrar do seu horário amanhã ({data}) às {hora} com {profissional}. Até lá!\n\nSe não puder vir: {link}',
  },
  {
    tipo: 'lembrete2',
    ativo: true,
    texto: '{nome}, te esperamos hoje às {hora} para {servico}. Qualquer imprevisto, avisa por aqui: {link}',
  },
  {
    tipo: 'pos',
    ativo: true,
    texto: 'Valeu pela visita, {nome}! Curtiu o resultado? Sua opinião ajuda muito a {negocio}. Quando quiser voltar, seu próximo horário está a um toque: {link}',
  },
  {
    tipo: 'reativacao',
    ativo: true,
    texto: 'Oi, {nome}! Faz um tempo que você não aparece por aqui na {negocio}. Que tal deixar o visual em dia? Escolha seu horário: {link}',
  },
];

const NOMES = [
  'João Pereira', 'Lucas Oliveira', 'Gabriel Santos', 'Pedro Almeida', 'Matheus Costa', 'Gustavo Rodrigues',
  'Felipe Souza', 'Bruno Lima', 'Rodrigo Carvalho', 'André Martins', 'Thiago Ribeiro', 'Eduardo Gomes',
  'Leonardo Fernandes', 'Vinícius Barbosa', 'Daniel Rocha', 'Marcelo Dias', 'Ricardo Teixeira', 'Fernando Moreira',
  'Henrique Cardoso', 'Igor Mendes', 'Caio Nunes', 'Renan Freitas', 'Diogo Araújo', 'Murilo Pinto',
  'Otávio Castro', 'Samuel Correia', 'Arthur Vieira', 'Enzo Monteiro', 'Davi Rezende', 'Bernardo Lopes',
  'Miguel Farias', 'Heitor Campos', 'Lorenzo Batista', 'Theo Ramos', 'Benício Duarte', 'Joaquim Pires',
  'Antônio Moura', 'Francisco Cunha', 'Paulo Machado', 'Roberto Siqueira', 'Sérgio Queiroz', 'Alexandre Brito',
  'Fábio Antunes', 'Jorge Viana', 'Márcio Andrade', 'Wagner Peixoto', 'César Tavares', 'Luiz Fonseca',
  'Raul Bezerra', 'Vitor Paiva', 'Alan Xavier', 'Wesley Prado', 'Kevin Sales', 'Nicolas Aguiar',
  'Emanuel Cavalcanti', 'Augusto Leal', 'Ivan Medeiros', 'Júlio Rangel', 'Mauro Porto', 'Nelson Brandão',
  'Otto Guimarães', 'Pablo Serra', 'Rafael Coelho', 'Silvio Matos', 'Tomás Valente', 'Ulisses Lacerda',
  'Valter Sampaio', 'William Torres', 'Yuri Bastos', 'Zeca Fontes',
];

// Telefones de mentira: o prefixo 90000 não é usado por nenhuma operadora
const fone = (i: number) => `5551900000${String(i + 1).padStart(3, '0')}`;

/** Gerador pseudoaleatório com semente fixa: a demonstração nasce sempre igual. */
function sorteador(semente: number) {
  let a = semente;
  const proximo = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: proximo,
    entre: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
    pesado: <T,>(itens: [T, number][]) => {
      const total = itens.reduce((t, [, p]) => t + p, 0);
      let r = proximo() * total;
      for (const [item, peso] of itens) if ((r -= peso) < 0) return item;
      return itens[itens.length - 1][0];
    },
  };
}

const POPULARIDADE: Record<string, number> = {
  corte: 35, 'corte-barba': 28, barba: 12, infantil: 8, pezinho: 8, sobrancelha: 5, platinado: 4,
};

const DIAS_PASSADOS = 75;
const DIAS_FUTUROS = 14;
const REGULARES = 25; // aparecem mais vezes
const SUMIDOS = 15; // os últimos da lista: só vieram há mais de 40 dias

export function gerarDados(agora: Date): Dados {
  const s = sorteador(20261028);
  const hoje = startOfDay(agora);

  const clientes: Cliente[] = NOMES.map((nome, i) => ({
    id: `c${i + 1}`,
    nome,
    whatsapp: fone(i),
    criadoEm: addDays(hoje, -DIAS_PASSADOS - s.entre(0, 200)).toISOString(),
  }));
  const ativos = clientes.slice(0, clientes.length - SUMIDOS);
  const sumidos = clientes.slice(clientes.length - SUMIDOS);

  const agendamentos: Agendamento[] = [];
  const clienteNoDia = new Set<string>();
  const almoco = CONFIG.almoco!;

  for (let d = -DIAS_PASSADOS; d <= DIAS_FUTUROS; d++) {
    const dia = addDays(hoje, d);
    const expediente = CONFIG.horarios[dia.getDay()];
    if (!expediente) continue;
    const ocupacao = d < 0 ? 0.8 : d === 0 ? 0.72 : Math.max(0.1, 0.55 - d * 0.05);
    const fecha = paraMinutos(expediente.fecha);

    for (const prof of PROFISSIONAIS) {
      if (!prof.dias.includes(dia.getDay())) continue;
      let t = paraMinutos(expediente.abre) + s.pesado([[0, 3], [15, 1], [30, 1]]);

      while (t < fecha) {
        const sorteado = s.pesado(prof.servicos.map((id) => [id, POPULARIDADE[id]] as [string, number]));
        const servico = SERVICOS.find((sv) => sv.id === sorteado)!;
        const fim = t + servico.duracao;
        if (fim > fecha) break;
        if (t < paraMinutos(almoco.fecha) && fim > paraMinutos(almoco.abre)) {
          t = paraMinutos(almoco.fecha);
          continue;
        }
        if (s.numero() > ocupacao) {
          t += CONFIG.intervalo;
          continue;
        }

        const grupo = d < -40 && s.numero() < 0.25 ? sumidos : ativos;
        let cliente = grupo[0];
        for (let tentativa = 0; tentativa < 6; tentativa++) {
          const regular = grupo === ativos && s.numero() < 0.55;
          cliente = regular ? ativos[s.entre(0, REGULARES - 1)] : grupo[s.entre(0, grupo.length - 1)];
          if (!clienteNoDia.has(`${cliente.id}:${d}`)) break;
        }
        clienteNoDia.add(`${cliente.id}:${d}`);

        const inicio = addMinutes(dia, t);
        const termino = addMinutes(dia, fim);
        let criado = addMinutes(inicio, -s.entre(3 * 60, 7 * 24 * 60));
        if (criado > agora) criado = addMinutes(agora, -s.entre(5, 600));

        let status: Agendamento['status'] = 'confirmado';
        let canceladoEm: string | undefined;
        if (termino <= agora) {
          status = s.pesado([['concluido', 86], ['faltou', 7], ['cancelado', 7]]);
        } else if (inicio > agora && s.numero() < 0.06) {
          status = 'cancelado';
        }
        if (status === 'cancelado') {
          const limite = Math.min(inicio.getTime(), agora.getTime());
          canceladoEm = new Date(criado.getTime() + s.numero() * (limite - criado.getTime())).toISOString();
        }

        agendamentos.push({
          id: `a${agendamentos.length + 1}`,
          clienteId: cliente.id,
          servicoId: servico.id,
          profissionalId: prof.id,
          inicio: inicio.toISOString(),
          fim: termino.toISOString(),
          preco: servico.preco,
          status,
          origem: s.numero() < 0.72 ? 'online' : 'painel',
          criadoEm: criado.toISOString(),
          canceladoEm,
        });
        t = Math.ceil(fim / 15) * 15 + s.pesado([[0, 4], [15, 1]]);
      }
    }
  }

  return {
    versao: VERSAO,
    geradoEm: agora.toISOString(),
    config: structuredClone(CONFIG),
    servicos: structuredClone(SERVICOS),
    profissionais: structuredClone(PROFISSIONAIS),
    clientes,
    agendamentos,
    modelos: structuredClone(MODELOS_PADRAO),
    avulsas: [],
  };
}
