import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BarraDemo } from './componentes/BarraDemo';
import './estilo.css';
import { Agendar } from './paginas/Agendar';
import { MeuHorario } from './paginas/MeuHorario';
import { Agenda } from './paginas/painel/Agenda';
import { Ajustes } from './paginas/painel/Ajustes';
import { Clientes } from './paginas/painel/Clientes';
import { Inicio } from './paginas/painel/Inicio';
import { Moldura } from './paginas/painel/Moldura';
import { Servicos } from './paginas/painel/Servicos';
import { WhatsApp } from './paginas/painel/WhatsApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BarraDemo />
      <Routes>
        <Route path="/" element={<Agendar />} />
        <Route path="/meu-horario/:id" element={<MeuHorario />} />
        <Route path="/painel" element={<Moldura />}>
          <Route index element={<Inicio />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="whatsapp" element={<WhatsApp />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="*" element={<Agendar />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
