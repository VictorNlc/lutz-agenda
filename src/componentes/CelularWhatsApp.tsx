import { CheckCheck, Clock3 } from 'lucide-react';
import { hora } from '../regras/formato';

export interface Balao {
  texto: string;
  em: Date;
  entregue?: boolean;
}

/** Como a mensagem aparece no celular do cliente. */
export function CelularWhatsApp({ negocio, mensagens, className = '' }: { negocio: string; mensagens: Balao[]; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[320px] rounded-[2.2rem] bg-tinta p-2.5 shadow-xl ${className}`}>
      <div className="overflow-hidden rounded-[1.7rem] bg-zap-fundo">
        <div className="flex items-center gap-2.5 bg-[#075e54] px-3.5 py-3 text-white">
          <span className="grid size-8 place-items-center rounded-full bg-white/20 text-sm font-semibold">{negocio.charAt(0)}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{negocio}</div>
            <div className="text-[11px] opacity-80">conta comercial</div>
          </div>
        </div>
        <div className="flex min-h-56 flex-col gap-2 px-3 py-4">
          {mensagens.map((m, i) => (
            <div key={i} className="entrar max-w-[88%] self-start rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug shadow-sm">
              <p className="whitespace-pre-line break-words">
                {m.texto.split(/(https?:\/\/\S+)/).map((parte, j) =>
                  /^https?:\/\//.test(parte) ? (
                    <span key={j} className="break-all text-[#027eb5] underline">
                      {parte}
                    </span>
                  ) : (
                    parte
                  ),
                )}
              </p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-apagado">
                {hora(m.em)}
                {m.entregue === false ? <Clock3 size={11} /> : <CheckCheck size={13} className="text-[#53bdeb]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
