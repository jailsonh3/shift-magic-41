# Shift Master Pro

🧠 SUPER PROMPT — GERADOR DE SISTEMA SHIFT MANAGER (FULLSTACK)

🎯 CONTEXTO

Você é uma IA especialista em engenharia de software fullstack.
Sua tarefa é gerar um sistema completo, pronto para produção, altamente modular, escalável e seguindo boas práticas.

🚀 OBJETIVO DO SISTEMA

Criar um sistema chamado ShiftManager, um gerenciador inteligente de escalas de trabalho com:

Turnos dinâmicos

Gestão de funcionários e supervisores

Regras trabalhistas complexas

Banco de horas

Sistema de metas com prioridade

Troca de turnos

Gestão de ausências

Integração com Google Calendar (somente sincronização)

Geração automática de escala

🧱 STACK OBRIGATÓRIA

Next.js (App Router)

React

TypeScript (100%)

Prisma ORM

PostgreSQL

TailwindCSS

NextAuth (Credentials ONLY)

🔐 REGRAS CRÍTICAS DE AUTENTICAÇÃO

❌ NÃO implementar login com Google

✅ Usuários criados SOMENTE por supervisores

✅ Funcionário acessa com email/senha

✅ Google Calendar usado APENAS para sincronização (OAuth interno após login)

🧑‍💼 MULTI-TENANT

Cada supervisor possui seus próprios funcionários

Funcionários não podem acessar dados de outros supervisores

Todo acesso deve ser filtrado por supervisorId

🗄️ BANCO DE DADOS (PRISMA)

Você DEVE criar modelos para:

User (com supervisorId)

ShiftTemplate (turnos dinâmicos)

Schedule (escala diária)

WeeklyDayOff (folga fixa semanal)

BreakRule (pausas configuráveis)

Request (solicitações)

ShiftChangeRequest (trocas)

Absence (atestados/licenças)

TimeBank (banco de horas)

Overtime (horas extras)

GoalType, GoalAchievement, GoalReward

TimeOffRequest

GoogleIntegration

PublicViewToken

🕒 SISTEMA DE TURNOS

Turnos são totalmente dinâmicos

Criados pelo supervisor

Horários livres (ex: 05:50 até 22:00+)

Tipos:

OPENING

MID

CLOSING

⏱️ SISTEMA DE PAUSAS

2 pausas de 10 minutos

1 pausa de 20 minutos

Configurável pelo supervisor

Geradas automaticamente com base no turno

📅 FOLGAS

Implementar:

Folga fixa semanal (obrigatória)

Folga automática

Folga por meta

Folga por banco de horas

Férias

Licença médica

🏥 GESTÃO DE AUSÊNCIAS

Upload de atestado (arquivo)

Bloqueio automático da escala

Reorganização automática

Sistema deve:

Detectar turnos vazios

Sugerir substitutos

Permitir auto redistribuição

🔁 TROCA DE TURNOS

Tipos obrigatórios:

Entre funcionários

Solicitação ao supervisor

Registro informal

Fluxo:

Solicitação → Aceite → Aprovação → Atualização

🎯 SISTEMA DE METAS

Supervisor define metas

Funcionários acumulam pontuação

Ranking por desempenho

Recompensa:

Escolha de folga

Regras:

Prioridade por ranking

Prazo para escolha

Expiração se não usada

⏱️ BANCO DE HORAS

Supervisor adiciona horas extras

Armazenado em minutos

Conversão:

≥ 6h20 = direito a 1 folga

Regras:

Solicitação com 3 dias de antecedência

Não permitir saldo negativo

🔗 GOOGLE CALENDAR (SINCRONIZAÇÃO)

Funcionário conecta manualmente após login

Criar calendário próprio

Eventos:

Criar ao gerar escala

Atualizar ao modificar

Remover ao excluir

📅 VISUALIZAÇÃO

Dashboard interno:

Calendário interativo

Escalas

Link público:

/schedule/public/{token}

Somente leitura

⚙️ MOTOR INTELIGENTE

Você DEVE implementar lógica para:

Geração automática de escala

Respeitar:

Pausas

Folgas

Banco de horas

Metas

Ausências

Prioridades

⚠️ VALIDAÇÕES OBRIGATÓRIAS

Máx 6 dias consecutivos

Mín 5 folgas no período

Descanso mínimo entre turnos

Sem sobreposição

Respeitar pausas

Banco de horas ≥ 0

🔔 NOTIFICAÇÕES

Implementar sistema para:

Trocas

Aprovações

Metas

Alterações de escala

Ausências

📊 DASHBOARD SUPERVISOR

CRUD funcionários

Editor de escala

Gestão de metas

Banco de horas

Ausências

Trocas

Alertas

📱 DASHBOARD FUNCIONÁRIO

Visualizar escala

Ver pausas

Banco de horas

Metas

Solicitações

Integração Google

🧪 QUALIDADE

Código limpo (Clean Code)

Arquitetura modular

Separação de responsabilidades

Tipagem forte (TypeScript)

Validação com Zod

🚀 ENTREGA ESPERADA

Você deve gerar:

Estrutura completa do projeto

Schema Prisma completo

APIs (REST ou handlers)

Serviços (regras de negócio)

Frontend funcional

Integração com Google Calendar

Scripts de inicialização

❗ REGRAS FINAIS

NÃO simplificar regras

NÃO ignorar validações

NÃO remover funcionalidades

IMPLEMENTAR tudo de forma funcional

🧠 INSTRUÇÃO FINAL

Gere o sistema completo, pronto para rodar localmente, com:

Código organizado

Comentários explicativos

Estrutura escalável

Boas práticas de mercado

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/86b6eeba-c4cc-45ac-ad5e-86e8a2be0e52).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
