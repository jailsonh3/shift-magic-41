## Objetivo

Transformar `/escalas` em um centro de planejamento com 3 abas, permitindo ao supervisor cadastrar turnos, definir regras gerais e gerar a escala mensal automaticamente de forma equilibrada — mantendo edição manual.

Escopo desta iteração: **frontend + persistência em localStorage**. Integração com banco (Lovable Cloud) fica para uma etapa seguinte para não misturar duas mudanças grandes.

---

## 1. Estrutura de abas na página `/escalas`

Reorganizar `EscalasPage.tsx` com um componente `Tabs` (shadcn):

- **Escala Mensal** (visão atual, melhorada)
- **Configuração de Turnos** (novo)
- **Configurações Gerais** (novo)

Filtros no topo, persistidos entre abas: mês/ano, funcionário. (Unidade/Equipe ficam preparados na UI mas sem lógica, já que ainda não há esse conceito no modelo.)

---

## 2. Aba "Configuração de Turnos"

CRUD completo de turnos cadastrados pelo supervisor.

Campos por turno:
- Nome (ex.: "Manhã 07h")
- Horário de início (HH:MM)
- Horário de término (HH:MM)
- Pausa em minutos (default 20)
- Carga horária total: **calculada automaticamente** (fim − início − pausa, exibida como "6h20")
- Status: Ativo / Inativo (toggle)

UI: tabela com botões Novo/Editar/Excluir + modal de formulário com validação Zod (fim > início, pausa ≥ 0).

Somente turnos **ativos** entram na geração automática.

---

## 3. Aba "Configurações Gerais"

Formulário único com:
- Folgas por funcionário no mês (default 5)
- Horário inicial de cobertura (default 07:00)
- Horário final de cobertura (default 22:00)
- Toggle "Permitir edição manual após geração automática" (default ligado)
- Máx. dias consecutivos de trabalho (default 6)

Salva em localStorage sob `shiftmanager_settings`.

---

## 4. Aba "Escala Mensal" (aprimorada)

Reaproveita a grade atual (funcionário × dias), com estas melhorias:

**Coluna do funcionário passa a mostrar:**
- Avatar + Nome
- Cargo (novo campo — adicionar `role`/`position` opcional no tipo `User`, default "Funcionário")
- Total de horas previstas no mês (somatório das cargas dos turnos atribuídos)

**Cada célula do dia mostra:**
- Nome curto do turno + horário de início (ex.: "07:00")
- Folga: badge visual "F" em vermelho
- Tooltip no hover com horário completo, pausa e carga

**Barra de ações no topo da aba:**
- Botão **Gerar Escala Automática** (abre confirmação — sobrescreve o mês)
- Botão **Recalcular Escala** (mantém folgas manuais marcadas, redistribui o resto)
- Botão **Salvar Alterações** (persiste o estado atual)
- Indicador "alterações não salvas"

**Linha resumo por dia** (rodapé da tabela): contagem de funcionários cobrindo o horário de pico, com destaque vermelho se abaixo do mínimo.

---

## 5. Edição manual (célula-a-célula)

Ao clicar em uma célula (dia × funcionário), abre um popover com:
- Select do turno (apenas turnos ativos) ou opção "Folga" ou "Limpar"
- Botão "Aplicar"

Estado local reflete imediatamente; recálculo de totais é reativo. "Salvar Alterações" persiste em localStorage sob `shiftmanager_schedule_<ano>-<mes>`.

Troca entre dois funcionários no mesmo dia: menu de contexto "Trocar com…" que abre lista de colegas escalados naquele dia.

---

## 6. Algoritmo de geração automática

Arquivo novo: `src/lib/scheduleGenerator.ts`.

Entrada: mês/ano, lista de funcionários ativos, turnos ativos, configurações gerais.

Passos:

1. **Alocar folgas por funcionário** (5 por padrão) distribuídas de forma quase uniforme ao longo do mês — evitar 2 folgas do mesmo funcionário em dias consecutivos quando possível; folga preferencial em fim de semana rotativo.
2. **Para cada dia não-folga de cada funcionário**, escolher um turno ativo com estas prioridades:
   - Menor contagem desse turno para esse funcionário no mês (evita repetição)
   - Cobertura da faixa 07:00–22:00 ainda incompleta (prioriza turno cujo horário cobre gap)
   - Balanceamento global (turno menos usado no dia recebe preferência)
3. **Validar cobertura**: para cada hora entre 07:00 e 22:00, contar funcionários ativos naquela hora; se algum bloco ficar vazio, o algoritmo re-tenta ajustando o funcionário com maior folga naquela janela.
4. **Regras rígidas**: máx. dias consecutivos, mínimo de folgas cumprido.

Retorna `ScheduleEntry[]` + `warnings: string[]` (ex.: "Dia 15 sem cobertura das 21h às 22h").

Modal pós-geração mostra as warnings.

---

## 7. Tipos e persistência

Ampliar `src/types/index.ts`:
- `ShiftTemplate`: adicionar `breakMinutes: number`, `active: boolean`, `totalHoursMinutes: number` (derivado)
- `User`: adicionar `position?: string`
- Nova interface `ScheduleSettings { daysOffPerMonth, coverageStart, coverageEnd, allowManualEdit, maxConsecutiveDays }`

Persistência (etapa atual, localStorage):
- `shiftmanager_shift_templates`
- `shiftmanager_settings`
- `shiftmanager_schedule_<YYYY-MM>`

Hook novo `useSchedule(year, month)` centraliza leitura/escrita para a página consumir sem duplicar lógica.

---

## 8. O que fica fora desta iteração

- Migração para Lovable Cloud (banco + APIs) — próximo passo, uma vez que a UI/lógica esteja validada
- Conceito de "Unidade" e "Equipe" (só aparecem como filtros vazios/desativados)
- Sincronização Google Calendar
- Notificações automáticas de alteração de escala

---

## Detalhes técnicos

**Arquivos novos**
- `src/pages/escalas/ScheduleTab.tsx` (grade + edição)
- `src/pages/escalas/ShiftTemplatesTab.tsx` (CRUD turnos)
- `src/pages/escalas/GeneralSettingsTab.tsx` (form settings)
- `src/pages/escalas/ShiftEditPopover.tsx`
- `src/lib/scheduleGenerator.ts`
- `src/lib/timeUtils.ts` (formatação HH:MM ↔ minutos, "6h20")
- `src/hooks/useSchedule.ts`
- `src/hooks/useShiftTemplates.ts`
- `src/hooks/useScheduleSettings.ts`

**Arquivos alterados**
- `src/pages/EscalasPage.tsx` — vira container com `Tabs`
- `src/types/index.ts` — extensões descritas acima
- `src/data/mockData.ts` — adaptar `mockShiftTemplates` ao novo shape (com `breakMinutes`, `active`)

**Validações**
- Zod schemas em cada formulário
- Toast (sonner) em criar/editar/excluir/gerar/salvar
