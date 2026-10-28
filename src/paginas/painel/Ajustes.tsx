import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Botao, Campo, Cartao, Chave, estiloEntrada } from '../../componentes/ui';
import { salvarConfig } from '../../dados/acoes';
import { lerDados, restaurar, useDados } from '../../dados/loja';
import type { Config } from '../../dados/tipos';
import { Titulo } from './Moldura';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function Ajustes() {
  const dados = useDados();
  const [c, setC] = useState<Config>(dados.config);
  const [salvo, setSalvo] = useState(false);
  const mudou = JSON.stringify(c) !== JSON.stringify(dados.config);
  const horarioInvalido = [...c.horarios, c.almoco].some((h) => h && h.abre >= h.fecha);

  function mudar(novo: Config) {
    setC(novo);
    setSalvo(false);
  }

  return (
    <div className="max-w-3xl">
      <Titulo titulo="Ajustes">
        {mudou && (
          <Botao
            disabled={horarioInvalido}
            onClick={() => {
              salvarConfig(c);
              setSalvo(true);
            }}
          >
            Salvar alterações
          </Botao>
        )}
        {salvo && !mudou && <span className="text-sm font-medium text-[#137a3d]">Salvo</span>}
      </Titulo>

      <Cartao className="p-5">
        <h2 className="font-semibold">Seu negócio</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome">
            <input className={estiloEntrada} value={c.negocio} onChange={(e) => mudar({ ...c, negocio: e.target.value })} />
          </Campo>
          <Campo rotulo="Endereço">
            <input className={estiloEntrada} value={c.endereco} onChange={(e) => mudar({ ...c, endereco: e.target.value })} />
          </Campo>
        </div>
      </Cartao>

      <Cartao className="mt-5 p-5">
        <h2 className="font-semibold">Horário de funcionamento</h2>
        <div className="mt-4 divide-y divide-linha">
          {DIAS.map((nome, d) => {
            const h = c.horarios[d];
            return (
              <div key={d} className="flex flex-wrap items-center gap-3 py-2.5">
                <Chave
                  ligado={!!h}
                  rotulo={`Abre ${nome}`}
                  aoMudar={(abre) => mudar({ ...c, horarios: c.horarios.map((x, i) => (i === d ? (abre ? { abre: '09:00', fecha: '18:00' } : null) : x)) })}
                />
                <span className="w-24 text-sm font-medium">{nome}</span>
                {h ? (
                  <Horas
                    valor={h}
                    aoMudar={(novo) => mudar({ ...c, horarios: c.horarios.map((x, i) => (i === d ? novo : x)) })}
                  />
                ) : (
                  <span className="text-sm text-apagado">Fechado</span>
                )}
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-3 py-2.5">
            <Chave ligado={!!c.almoco} rotulo="Pausa para almoço" aoMudar={(sim) => mudar({ ...c, almoco: sim ? { abre: '12:00', fecha: '13:00' } : null })} />
            <span className="w-24 text-sm font-medium">Almoço</span>
            {c.almoco ? <Horas valor={c.almoco} aoMudar={(almoco) => mudar({ ...c, almoco })} /> : <span className="text-sm text-apagado">Sem pausa</span>}
          </div>
        </div>
        {horarioInvalido && <p className="mt-2 text-sm text-perigo">Algum horário fecha antes de abrir. Confira.</p>}
      </Cartao>

      <Cartao className="mt-5 p-5">
        <h2 className="font-semibold">Regras do agendamento online</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Antecedência mínima" dica="O cliente não consegue marcar em cima da hora.">
            <select className={estiloEntrada} value={c.antecedenciaMin} onChange={(e) => mudar({ ...c, antecedenciaMin: Number(e.target.value) })}>
              <option value={0}>Sem antecedência</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={120}>2 horas</option>
              <option value={1440}>1 dia</option>
            </select>
          </Campo>
          <Campo rotulo="Horários oferecidos de" dica="De quanto em quanto tempo aparecem os horários.">
            <select className={estiloEntrada} value={c.intervalo} onChange={(e) => mudar({ ...c, intervalo: Number(e.target.value) })}>
              <option value={15}>15 em 15 minutos</option>
              <option value={30}>30 em 30 minutos</option>
              <option value={60}>1 em 1 hora</option>
            </select>
          </Campo>
        </div>
      </Cartao>

      <Cartao className="mt-5 p-5">
        <h2 className="font-semibold">Demonstração</h2>
        <p className="mt-1 text-sm text-apagado">Volta a barbearia fictícia ao estado inicial, com os horários de hoje. O que você mudou se perde.</p>
        <Botao
          variante="secundario"
          className="mt-4"
          onClick={() => {
            restaurar();
            setC(lerDados().config);
            setSalvo(false);
          }}
        >
          <RotateCcw size={15} /> Restaurar dados da demonstração
        </Botao>
      </Cartao>
    </div>
  );
}

function Horas({ valor, aoMudar }: { valor: { abre: string; fecha: string }; aoMudar: (v: { abre: string; fecha: string }) => void }) {
  const estilo = `${estiloEntrada} w-[110px] py-1.5 tabular-nums`;
  return (
    <span className="flex items-center gap-2 text-sm">
      <input type="time" step={900} className={estilo} value={valor.abre} aria-label="Abre" onChange={(e) => aoMudar({ ...valor, abre: e.target.value })} />
      até
      <input type="time" step={900} className={estilo} value={valor.fecha} aria-label="Fecha" onChange={(e) => aoMudar({ ...valor, fecha: e.target.value })} />
    </span>
  );
}
