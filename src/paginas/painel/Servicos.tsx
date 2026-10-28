import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Botao, Cartao, Chave, estiloEntrada } from '../../componentes/ui';
import { novoServico, salvarProfissional, salvarServico } from '../../dados/acoes';
import { useDados } from '../../dados/loja';
import type { Profissional, Servico } from '../../dados/tipos';
import { duracao } from '../../regras/formato';
import { Titulo } from './Moldura';

const DURACOES = [15, 30, 40, 45, 60, 70, 90, 120, 150, 180];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Servicos() {
  const dados = useDados();
  const [rascunho, setRascunho] = useState<Servico | null>(null);

  return (
    <div>
      <Titulo titulo="Serviços e equipe" sub="O que muda aqui aparece na hora na página de agendamento." />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Serviços</h2>
          <Botao variante="secundario" onClick={() => setRascunho(novoServico())} disabled={!!rascunho}>
            <Plus size={16} /> Novo serviço
          </Botao>
        </div>
        <Cartao className="divide-y divide-linha">
          {[...dados.servicos, ...(rascunho ? [rascunho] : [])].map((s) => (
            <LinhaServico
              key={s.id}
              servico={s}
              novo={s.id === rascunho?.id}
              aoSalvar={(sv) => {
                salvarServico(sv);
                if (sv.id === rascunho?.id) setRascunho(null);
              }}
              aoDescartar={() => setRascunho(null)}
            />
          ))}
        </Cartao>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Equipe</h2>
        <div className="grid gap-4 xl:grid-cols-3">
          {dados.profissionais.map((p) => (
            <CartaoProfissional key={p.id} profissional={p} servicos={dados.servicos} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LinhaServico({ servico, novo, aoSalvar, aoDescartar }: { servico: Servico; novo: boolean; aoSalvar: (s: Servico) => void; aoDescartar: () => void }) {
  const [s, setS] = useState(servico);
  const mudou = JSON.stringify(s) !== JSON.stringify(servico);
  const valido = s.nome.trim().length > 1 && s.preco >= 0;
  return (
    <div className={`grid items-center gap-3 p-4 sm:grid-cols-[1fr_130px_120px_auto] ${s.ativo ? '' : 'opacity-60'}`}>
      <div>
        <input className={`${estiloEntrada} font-medium`} value={s.nome} placeholder="Nome do serviço" onChange={(e) => setS({ ...s, nome: e.target.value })} />
        <input className={`${estiloEntrada} mt-2 text-sm`} value={s.descricao} placeholder="Descrição curta (aparece para o cliente)" onChange={(e) => setS({ ...s, descricao: e.target.value })} />
      </div>
      <select className={estiloEntrada} value={s.duracao} aria-label="Duração" onChange={(e) => setS({ ...s, duracao: Number(e.target.value) })}>
        {[...new Set([...DURACOES, s.duracao])].sort((a, b) => a - b).map((d) => (
          <option key={d} value={d}>
            {duracao(d)}
          </option>
        ))}
      </select>
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-apagado">R$</span>
        <input
          className={`${estiloEntrada} pl-9 tabular-nums`}
          type="number"
          min={0}
          step={5}
          aria-label="Preço"
          value={s.preco}
          onChange={(e) => setS({ ...s, preco: Number(e.target.value) })}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        {!novo && (
          <Chave
            ligado={s.ativo}
            rotulo="Serviço ativo"
            aoMudar={(ativo) => {
              aoSalvar({ ...servico, ativo });
              setS({ ...s, ativo });
            }}
          />
        )}
        {(mudou || novo) && (
          <>
            <Botao className="min-h-9" disabled={!valido} onClick={() => aoSalvar(s)}>
              Salvar
            </Botao>
            <Botao variante="fantasma" className="min-h-9" onClick={() => (novo ? aoDescartar() : setS(servico))}>
              Desfazer
            </Botao>
          </>
        )}
      </div>
    </div>
  );
}

function CartaoProfissional({ profissional: p, servicos }: { profissional: Profissional; servicos: Servico[] }) {
  const alternar = <T,>(lista: T[], item: T) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]);
  return (
    <Cartao className={`p-5 ${p.ativo ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3">
          <Avatar nome={p.nome} cor={p.cor} />
          <span className="font-semibold">{p.nome}</span>
        </span>
        <Chave ligado={p.ativo} rotulo={`${p.nome} atendendo`} aoMudar={(ativo) => salvarProfissional({ ...p, ativo })} />
      </div>
      <div className="mt-4 text-xs font-medium text-apagado">Dias de trabalho</div>
      <div className="mt-1.5 flex gap-1">
        {DIAS.map((nome, d) => (
          <button
            key={d}
            type="button"
            onClick={() => salvarProfissional({ ...p, dias: alternar(p.dias, d).sort() })}
            className={`h-8 flex-1 rounded-lg text-xs font-medium transition ${p.dias.includes(d) ? 'bg-tinta text-papel' : 'bg-tinta/5 text-apagado hover:bg-tinta/10'}`}
          >
            {nome}
          </button>
        ))}
      </div>
      <div className="mt-4 text-xs font-medium text-apagado">Serviços que faz</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {servicos.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => salvarProfissional({ ...p, servicos: alternar(p.servicos, s.id) })}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${p.servicos.includes(s.id) ? 'bg-latao-claro text-[#7a5414]' : 'bg-tinta/5 text-apagado line-through hover:bg-tinta/10'}`}
          >
            {s.nome}
          </button>
        ))}
      </div>
    </Cartao>
  );
}
