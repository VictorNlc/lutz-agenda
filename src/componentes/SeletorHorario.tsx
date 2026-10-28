import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import type { Dados, Servico } from '../dados/tipos';
import { hora } from '../regras/formato';
import { horariosLivres, type HorarioLivre } from '../regras/horarios';

const PERIODOS = [
  { nome: 'Manhã', ate: 12 },
  { nome: 'Tarde', ate: 18 },
  { nome: 'Noite', ate: 24 },
];

/** Faixa de dias + grade de horários livres. Usada pelo cliente, no remarcar e no encaixe do painel. */
export function SeletorHorario({
  dados,
  servico,
  profissionalId,
  agora,
  dia,
  aoEscolherDia,
  escolhido,
  aoEscolher,
  dias = 14,
  ignorarId,
}: {
  dados: Dados;
  servico: Servico;
  profissionalId: string | null;
  agora: Date;
  dia: Date;
  aoEscolherDia: (dia: Date) => void;
  escolhido: HorarioLivre | null;
  aoEscolher: (h: HorarioLivre) => void;
  dias?: number;
  ignorarId?: string;
}) {
  const faixa = useMemo(
    () =>
      Array.from({ length: dias }, (_, i) => {
        const d = addDays(startOfDay(agora), i);
        return {
          dia: d,
          aberto: !!dados.config.horarios[d.getDay()],
          livres: horariosLivres(dados, { dia: d, servico, profissionalId, agora, ignorarId }),
        };
      }),
    [dados, servico, profissionalId, agora, dias, ignorarId],
  );
  const doDia = faixa.find((f) => isSameDay(f.dia, dia))?.livres ?? [];

  return (
    <div>
      <div className="sem-barra -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {faixa.map(({ dia: d, aberto, livres }) => {
          const ativo = isSameDay(d, dia);
          const vazio = livres.length === 0;
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={vazio}
              onClick={() => aoEscolherDia(d)}
              className={`flex w-[62px] shrink-0 flex-col items-center rounded-xl py-2 text-center transition ${
                ativo ? 'bg-tinta text-papel' : vazio ? 'bg-transparent text-apagado/50 ring-1 ring-linha/60' : 'bg-white ring-1 ring-linha hover:ring-tinta/40'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wide">{isSameDay(d, agora) ? 'hoje' : format(d, 'EEE', { locale: ptBR })}</span>
              <span className="text-lg font-semibold leading-tight">{format(d, 'dd')}</span>
              <span className="text-[11px]">{!aberto ? 'fechado' : vazio ? 'lotado' : format(d, 'MMM', { locale: ptBR })}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-4">
        {doDia.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-apagado ring-1 ring-linha">Nenhum horário livre neste dia. Escolha outro.</p>
        )}
        {PERIODOS.map((periodo, i) => {
          const desde = i === 0 ? 0 : PERIODOS[i - 1].ate;
          const lista = doDia.filter((h) => h.inicio.getHours() >= desde && h.inicio.getHours() < periodo.ate);
          if (!lista.length) return null;
          return (
            <div key={periodo.nome}>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-apagado">{periodo.nome}</div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {lista.map((h) => {
                  const ativo = escolhido?.inicio.getTime() === h.inicio.getTime();
                  return (
                    <button
                      key={h.inicio.toISOString()}
                      type="button"
                      onClick={() => aoEscolher(h)}
                      className={`rounded-lg py-2 text-sm font-medium tabular-nums transition ${ativo ? 'bg-latao text-white' : 'bg-white ring-1 ring-linha hover:ring-latao'}`}
                    >
                      {hora(h.inicio)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
