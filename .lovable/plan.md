# Equipe por supervisor + exclusão de funcionário + alertas de carga horária

## O que muda para você

1. **Excluir funcionário volta a funcionar**
   - Hoje a exclusão só apaga o cartão na tela e volta assim que a página recarrega, porque a lista da equipe não é guardada.
   - A equipe passa a ser guardada de verdade no aplicativo, então criar, editar e excluir ficam salvos.
   - Antes de excluir, aparece uma confirmação mostrando quantos dias de escala do mês serão afetados.

2. **Cada supervisor vê só a sua equipe**
   - Todo funcionário fica vinculado a um supervisor (mostrado no cartão e escolhido no formulário).
   - Ao entrar como supervisor, as telas de Equipe, Escalas, Solicitações e Metas mostram somente os funcionários dele.
   - Ao entrar como funcionário, continua vendo apenas os próprios dados.

3. **A escala continua funcionando após mudanças na equipe**
   - Ao excluir alguém (ou ao tirar alguém da equipe) a escala não quebra: os dias que ficaram sem gente são detectados na hora.
   - O supervisor recebe um aviso claro listando dia e horário descobertos, e escolhe entre:
     - **Manter assim mesmo** (registra a autorização do supervisor e mantém a escala publicada), ou
     - **Redistribuir agora** (recalcula os dias afetados entre os funcionários restantes).
   - Se a redistribuição fizer alguém passar da carga horária normal do mês, o supervisor vê quanto ficou acima e quem foi afetado, e o funcionário recebe uma notificação avisando do aumento de carga.

## Detalhes técnicos

- Novo `src/hooks/useEmployees.ts` no mesmo padrão de `useShiftTemplates` (estado + `localStorage`, semente `mockUsers`), com `create/update/remove` e leitura filtrada por `supervisorId`.
- Substituir os usos diretos de `mockUsers` por esse hook em `FuncionariosPage`, `EscalasPage`, `escalas/ScheduleTab`, `SolicitacoesPage`, `MetasPage`. `AuthContext` continua usando `mockUsers` para login, mas mescla com a lista salva.
- Escopo: `visibleEmployees = employees.filter(e => e.role === 'employee' && e.supervisorId === user.id)` para supervisor; `e.id === user.id` para funcionário. Formulário de funcionário ganha campo de supervisor (padrão: supervisor logado).
- Exclusão: `remove(id)` + limpeza das entradas de escala do funcionário no mês corrente; em seguida `validateCoverage` roda automaticamente e alimenta um diálogo de decisão (`Manter` / `Redistribuir`).
- Override de cobertura: entrada `shiftmanager_coverage_override_<ano>-<mês>` guardando datas autorizadas + id do supervisor, para que salvar não seja bloqueado nesses dias.
- Alerta de carga: comparar `totalMonthMinutes` de cada funcionário com a média/limite do mês; acima do limite gera item no relatório do supervisor e uma notificação (`type: 'schedule'`) para o funcionário via lista de notificações.
- Sem alterações no algoritmo de rodízio/folgas já implementado em `scheduleGenerator.ts`, apenas reuso de `generateSchedule`/`validateCoverage` com a equipe filtrada.
