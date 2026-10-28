import { isSameDay } from 'date-fns';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CelularWhatsApp } from '../../componentes/CelularWhatsApp';
import { Cartao, Chave, Selo, estiloEntrada, origem, useAgora } from '../../componentes/ui';
import { salvarModelo } from '../../dados/acoes';
import { useDados } from '../../dados/loja';
import type { Modelo } from '../../dados/tipos';
import { diaCurto, hora } from '../../regras/formato';
import { NOMES_MENSAGEM, QUANDO_MENSAGEM, VARIAVEIS, preencher, todasMensagens, type Mensagem } from '../../regras/mensagens';
import { Titulo } from './Moldura';

type Aba = 'proximas' | 'enviadas' | 'modelos';
const POR_PAGINA = 60;

export function WhatsApp() {
  const dados = useDados();
  const agora = useAgora();
  const [aba, setAba] = useState<Aba>('proximas');
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const todas = useMemo(() => todasMensagens(dados, agora, origem()), [dados, agora]);
  const proximas = useMemo(() => todas.filter((m) => m.situacao === 'agendada').reverse(), [todas]);
  const enviadas = useMemo(() => todas.filter((m) => m.situacao === 'enviada'), [todas]);
  const hoje = enviadas.filter((m) => isSameDay(m.em, agora)).length;
  const lista = (aba === 'proximas' ? proximas : enviadas).slice(0, POR_PAGINA);
  const atual = lista.find((m) => m.id === selecionada) ?? lista[0];

  return (
    <div>
      <Titulo titulo="WhatsApp" sub={`${hoje} mensagens enviadas hoje · ${proximas.length} programadas`} />

      <div className="mb-5 flex items-start gap-2 rounded-xl bg-white px-4 py-3 text-sm text-apagado ring-1 ring-linha">
        <Info size={16} className="mt-0.5 shrink-0 text-latao" />
        <span>
          Na demonstração as mensagens aparecem aqui. No sistema de verdade elas saem sozinhas pelo número da barbearia, pela API oficial do WhatsApp ou pela Evolution API.
        </span>
      </div>

      <div className="mb-5 flex w-fit gap-1 rounded-xl bg-white p-1 ring-1 ring-linha">
        {(
          [
            ['proximas', `Vão sair (${proximas.length})`],
            ['enviadas', 'Enviadas'],
            ['modelos', 'Mensagens automáticas'],
          ] as [Aba, string][]
        ).map(([id, nome]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setAba(id);
              setSelecionada(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${aba === id ? 'bg-tinta text-papel' : 'text-tinta/70 hover:bg-tinta/5'}`}
          >
            {nome}
          </button>
        ))}
      </div>

      {aba === 'modelos' ? (
        <Modelos />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Cartao className="divide-y divide-linha overflow-hidden">
            {lista.map((m) => (
              <Linha
                key={m.id}
                m={m}
                cliente={dados.clientes.find((c) => c.id === m.clienteId)?.nome ?? ''}
                agora={agora}
                ativa={m.id === atual?.id}
                aoClicar={() => setSelecionada(m.id)}
              />
            ))}
            {lista.length === 0 && <p className="px-4 py-10 text-center text-sm text-apagado">Nada por aqui.</p>}
          </Cartao>
          <div className="lg:sticky lg:top-6 lg:self-start">
            {atual && <CelularWhatsApp negocio={dados.config.negocio} mensagens={[{ texto: atual.texto, em: atual.em, entregue: atual.situacao === 'enviada' }]} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({ m, cliente, agora, ativa, aoClicar }: { m: Mensagem; cliente: string; agora: Date; ativa: boolean; aoClicar: () => void }) {
  return (
      <button type="button" onClick={aoClicar} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${ativa ? 'bg-latao-claro/40' : 'hover:bg-papel/60'}`}>
        <div className="w-20 shrink-0 text-xs text-apagado">
          <div className="font-medium text-tinta">{hora(m.em)}</div>
          {isSameDay(m.em, agora) ? 'hoje' : diaCurto(m.em)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{cliente}</span>
            <Selo tom={m.tipo === 'reativacao' ? 'latao' : 'cinza'}>{NOMES_MENSAGEM[m.tipo]}</Selo>
          </div>
          <p className="mt-0.5 truncate text-sm text-apagado">{m.texto.replace(/\n+/g, ' ')}</p>
        </div>
      </button>
  );
}

const EXEMPLO = {
  nome: 'João',
  servico: 'corte + barba',
  profissional: 'Rafael',
  data: 'qui, 30/10',
  hora: '14:00',
  link: 'https://agenda.exemplo/meu-horario/123',
};

function Modelos() {
  const dados = useDados();
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {dados.modelos.map((m) => (
        <EditorModelo key={m.tipo} modelo={m} negocio={dados.config.negocio} />
      ))}
    </div>
  );
}

function EditorModelo({ modelo, negocio }: { modelo: Modelo; negocio: string }) {
  const [texto, setTexto] = useState(modelo.texto);
  const mudou = texto !== modelo.texto;
  return (
    <Cartao className={`p-5 ${modelo.ativo ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{NOMES_MENSAGEM[modelo.tipo]}</h3>
          <p className="text-sm text-apagado">{QUANDO_MENSAGEM[modelo.tipo]}</p>
        </div>
        <Chave ligado={modelo.ativo} rotulo={`Enviar ${NOMES_MENSAGEM[modelo.tipo]}`} aoMudar={(ativo) => salvarModelo({ ...modelo, ativo })} />
      </div>
      <textarea
        className={`${estiloEntrada} mt-4 min-h-28 resize-y font-sans text-sm leading-relaxed`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => mudou && salvarModelo({ ...modelo, texto })}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {VARIAVEIS.map((v) => (
          <button key={v} type="button" onClick={() => setTexto((t) => `${t}${v}`)} className="rounded-md bg-tinta/5 px-1.5 py-0.5 font-mono text-[11px] text-apagado hover:bg-tinta/10">
            {v}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-zap-fundo p-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-apagado">Como chega</div>
        <p className="rounded-lg bg-white px-3 py-2 text-[13px] leading-snug whitespace-pre-line shadow-sm">{preencher(texto, { ...EXEMPLO, negocio })}</p>
      </div>
      {mudou && <p className="mt-2 text-xs text-apagado">Salva quando você clica fora do texto.</p>}
    </Cartao>
  );
}
