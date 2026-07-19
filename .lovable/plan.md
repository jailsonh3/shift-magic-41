## Plano de implementação

1. **Refatorar o motor de geração de escala**
   - Substituir a atribuição atual por um algoritmo orientado por dia, cobertura e histórico.
   - Usar somente turnos ativos cadastrados pelo supervisor.
   - Calcular quais turnos cobrem o período operacional configurado e validar lacunas antes de aceitar a escala.
   - Rodar tentativas de redistribuição quando houver lacunas, antes de bloquear a geração.

2. **Garantir rodízio real de turnos**
   - Considerar o histórico dos dias anteriores de cada funcionário.
   - Penalizar repetição consecutiva do mesmo turno/horário.
   - Balancear a quantidade de vezes que cada funcionário recebe cada turno.
   - Fazer o botão **Recalcular Escala** gerar uma nova distribuição, evitando repetir a escala anterior quando houver alternativas válidas.

3. **Corrigir distribuição de folgas**
   - Tratar `daysOffPerMonth` como máximo padrão de folgas mensais por funcionário.
   - Distribuir folgas de forma espaçada ao longo do mês, evitando concentração desnecessária.
   - Nunca conceder folga se isso comprometer a cobertura operacional.
   - Reportar quando uma folga solicitada/manual não puder ser mantida por falta de cobertura.

4. **Tratar indisponibilidades e férias**
   - Adicionar suporte no algoritmo para dias indisponíveis por funcionário.
   - Considerar férias/atestados/ausências aprovadas como indisponibilidade total, sem contar como folga comum.
   - Permitir que funcionários ultrapassem o limite de 5 dias sem trabalhar somente quando os dias extras forem férias, afastamentos ou ausência aprovada.
   - Como a estrutura atual de solicitações tem tipo/status, mas não possui período de início/fim integrado à escala, vou preparar a lógica para aceitar indisponibilidades datadas e ligar aos dados disponíveis no app.

5. **Validação final obrigatória**
   - Antes de aplicar ou salvar a escala, validar:
     - cobertura contínua entre início e fim configurados;
     - máximo de folgas padrão por funcionário;
     - rodízio mínimo de turnos quando existirem opções suficientes;
     - respeito a indisponibilidades;
     - máximo de dias consecutivos configurado, salvo quando cobertura exigir exceção reportada.
   - Bloquear a geração/salvamento com relatório claro quando não existir escala válida possível.

6. **Atualizar a tela de Escalas**
   - Ajustar **Gerar Escala Automática** para criar uma escala válida e balanceada.
   - Ajustar **Recalcular Escala** para variar a distribuição usando a escala anterior como referência, mantendo restrições obrigatórias.
   - Melhorar os avisos exibidos no modal para separar erros bloqueantes, exceções de cobertura e justificativas de folgas/ausências.

## Detalhes técnicos

- Arquivos principais a alterar:
  - `src/lib/scheduleGenerator.ts`
  - `src/pages/escalas/ScheduleTab.tsx`
  - `src/types/index.ts`, se necessário para representar motivo de ausência/folga
- O algoritmo será determinístico com variação por recálculo: mesmo mês/configuração gera uma escala estável na primeira geração, e o recálculo usa a escala anterior para evitar repetir a mesma distribuição.
- A cobertura será validada por intervalos reais dos turnos, não apenas por quantidade de funcionários trabalhando no dia.
- A escala só será aplicada no estado da tela quando passar na validação final.