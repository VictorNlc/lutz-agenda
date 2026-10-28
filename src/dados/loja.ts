import { isSameDay } from 'date-fns';
import { useSyncExternalStore } from 'react';
import { gerarDados, VERSAO } from './semente';
import type { Dados } from './tipos';

/**
 * Os dados da demonstração moram no navegador de quem visita: cada pessoa
 * mexe à vontade sem afetar as outras. Num cliente de verdade, esta camada
 * é trocada por um banco (Supabase/Postgres) sem mexer nas telas.
 */
const CHAVE = 'lutz-agenda:dados';

function ler(): Dados | null {
  try {
    const texto = localStorage.getItem(CHAVE);
    return texto ? (JSON.parse(texto) as Dados) : null;
  } catch {
    return null;
  }
}

function gravar(dados: Dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Navegador sem armazenamento (aba anônima, por exemplo): segue só na memória
  }
}

function inicial(): Dados {
  const agora = new Date();
  const salvos = ler();
  // De um dia para o outro a demonstração renasce, para "hoje" sempre ter movimento
  if (salvos && salvos.versao === VERSAO && isSameDay(new Date(salvos.geradoEm), agora)) return salvos;
  const novos = gerarDados(agora);
  gravar(novos);
  return novos;
}

let atual: Dados = inicial();
const ouvintes = new Set<() => void>();

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

export function lerDados() {
  return atual;
}

export function alterar(mudanca: (dados: Dados) => Dados) {
  atual = mudanca(atual);
  gravar(atual);
  avisar();
}

export function restaurar() {
  atual = gerarDados(new Date());
  gravar(atual);
  avisar();
}

export function useDados(): Dados {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    () => atual,
  );
}
