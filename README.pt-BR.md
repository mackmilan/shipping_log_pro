<p align="center">
  <a href="README.md">🇺🇸 English</a> &nbsp;|&nbsp;
  <a href="README.pt-BR.md"><b>🇧🇷 Português</b></a>
</p>

# 🚚 ShippingLog PRO - Controle de Janela de Descarga de Caminhões

Sistema completo para gestão e controle de janelas de tempo de descarga de caminhões em centros de distribuição e armazéns logísticos. Desenvolvido com **NestJS**, **TypeORM**, **SQLite**, **Vue 3**, **TypeScript** e **Tailwind CSS**.

---

## 📋 Sumário
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Perfis de Acesso (RBAC Local)](#-perfis-de-acesso-rbac-local)
- [Etapas e Rastreamento de Tempos](#-etapas-e-rastreamento-de-tempos)
- [Instalação e Execução](#-instalação-e-execução)
- [Credenciais Padrão para Testes](#-credenciais-padrão-para-testes)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)

---

## 🏗 Arquitetura do Projeto

```
shipping_log_pro/
├── backend/                  # API NestJS + TypeORM + SQLite
│   ├── src/
│   │   ├── common/           # Enums (Roles, Stages, Docks), Guards e Decorators
│   │   ├── entities/         # TypeORM Entities (User, Truck, Dock, Schedule, StageLog)
│   │   ├── modules/
│   │   │   ├── auth/         # Autenticação local JWT + Bcrypt
│   │   │   ├── users/        # Gestão de usuários e permissões (Apenas Admin)
│   │   │   ├── docks/        # Gestão de docas e ocupação
│   │   │   ├── trucks/       # Cadastro de caminhões, frotas e motoristas
│   │   │   ├── schedules/    # Janelas de descarga, cálculo de tempos e KPIs
│   │   │   └── seed/         # Inicialização automática de dados de teste
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── database.sqlite       # Banco de dados local SQLite
│
├── frontend/                 # SPA Vue 3 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Badges, Layout, Modais de Etapa e Linha do Tempo, LanguageSelector
│   │   ├── i18n/             # Motor reativo de i18n e dicionários tipados (pt-BR, en)
│   │   ├── router/           # Vue Router com Route Guards por perfil
│   │   ├── services/         # Axios com interceptores de autenticação JWT
│   │   ├── stores/           # Pinia stores (auth, schedules, docks, trucks)
│   │   ├── types/            # Interfaces e Enums TypeScript
│   │   └── views/            # Dashboard, Janelas (Lista & Kanban), Docas, Caminhões, Usuários
│   └── vite.config.ts
│
├── e2e/                      # Suíte de testes E2E com Playwright
│   ├── auth-and-navigation.spec.ts
│   ├── i18n-language-switch.spec.ts
│   ├── schedules-workflow.spec.ts
│   └── users-management.spec.ts
│
└── package.json              # Scripts orquestrados do monorepo
```

---

## ✨ Funcionalidades Principais

1. **Gestão de Janelas de Descarga (Time Slots)**:
   - Definição de horários de início e fim planejados.
   - Vinculação com caminhões, motoristas e transportadoras.
   - Designação de doca (automática ou manual).
   - Indicador de aderência à janela (no horário ou com cálculo de minutos de atraso).

2. **Rastreamento de Etapas e Tempos de Operação**:
   - Cronometragem automática de cada etapa.
   - Destaque em tempo real para tempo parado com alerta visual.
   - Registro de justificativa/motivo para cada parada (ex: trânsito rodoviário, pneu furado, documentação, descanso regulamentar).
   - Histórico cronológico de cada transição com identificação do operador responsável.

3. **Painel Operacional (Dashboard em Tempo Real)**:
   - Contadores ativos: Caminhões em trânsito, parados, no pátio e em descarga.
   - Indicadores médios: Tempo médio parado, tempo médio de descarga, tempo médio de trânsito e espera no pátio.
   - Visão do status das docas (Livres, Ocupadas com identificação da carga, e Em Manutenção).
   - Tabela de alertas prioritários para veículos parados ou com janela estourada.

4. **Visualização Dupla: Lista e Kanban**:
   - Visualização em tabela com tempos acumulados por etapa.
   - Visualização em quadro com colunas dinâmicas por status.

5. **Internacionalização (i18n) e Troca de Idioma em Tempo Real**:
   - Suporte bilíngue completo: **Português Brasileiro (`pt-BR`)** e **Inglês Internacional (`en`)**.
   - Cobertura em todas as telas (Login, Dashboard, Janelas de Descarga, Docas, Caminhões, Tela do Motorista e Usuários), modais de ação, formulários, tabelas e badges de status/prioridade.
   - Alternador de idioma instantâneo na barra superior e na tela de login (🇧🇷 PT-BR e 🌐 EN).
   - Preferência persistida automaticamente no navegador via `localStorage` (`shipping_log_locale`).
   - Implementação nativa reativa e tipada no Vue 3 via Composition API, sem sobrecarga de dependências externas.

6. **Tela Operacional Simplificada para Motoristas (`/driver`)**:
   - Interface mobile-first ergonômica com botões grandes de toque rápido.
   - Seleção de viagem/carga ativa com detalhes do caminhão, doca, janela e carga.
   - Avanço simplificado de etapas (Iniciar Trânsito, Reportar Parada com motivos predefinidos, Chegada ao Pátio, Encoste na Doca, Início de Descarga e Finalização).
   - Rastreamento e envio de localização GPS do dispositivo em tempo real com link para Google Maps.
   - Envio de fotos e comprovantes para cada etapa (canhoto assinado, foto do lacre, foto da carga, odômetro, avarias) com câmera direta do celular ou arquivo.
   - Galeria de imagens por etapa e visualizador ampliado (lightbox), visível tanto para o motorista quanto para os operadores e administradores na linha do tempo.

---

## 🔒 Perfis de Acesso (RBAC Local)

O sistema possui autenticação local baseada em tokens **JWT** e senhas criptografadas com **Bcrypt**, sem dependência de serviços externos.

| Perfil | Descrição | Permissões |
|---|---|---|
| **Administrador (`ADMIN`)** | Gestão estratégica e administrativa | Acesso irrestrito a todos os módulos, incluindo criação e edição de usuários, exclusão de dados e configurações globais. |
| **Operador (`OPERATOR`)** | Operação de pátio, portaria e docas | Criação de janelas de descarga, alteração de status/etapas dos caminhões, inserção de motivos de paradas, alocação de docas e cadastro de veículos. |
| **Motorista (`DRIVER`)** | Operação simplificada de campo e entrega | Acesso dedicado à tela operacional simplificada (`/driver`), avanço rápido de etapas, captura e envio de localização GPS e upload de imagens/comprovantes de cada etapa. |
| **Usuário (`USER`)** | Visualizador / Consulta | Acompanhamento do dashboard, consulta da fila de janelas e histórico de tempos em modo somente leitura (botões de edição e avanço desabilitados). |

---

## ⏱ Etapas e Rastreamento de Tempos

As seguintes etapas são controladas pelo sistema:

- **`SCHEDULED` (Agendado)**: Viagem criada no planejamento.
- **`IN_TRANSIT` (Em Trânsito)**: Veículo saiu da origem e está em deslocamento rodoviário.
- **`STOPPED` (Parado)**: Veículo precisou parar (ex: engarrafamento, defeito mecânico, fiscalização). Ativa alertas e cronômetro de tempo ocioso.
- **`WAITING_YARD` (No Pátio / Fila)**: Veículo chegou à portaria e aguarda liberação de vaga ou doca.
- **`AT_DOCK` (Na Doca)**: Veículo encostado na baia de descarga.
- **`UNLOADING` (Em Descarga)**: Operação de descarregamento ativa. Marca automaticamente a doca como ocupada.
- **`COMPLETED` (Finalizado)**: Carga descarregada, conferida e veículo liberado. Libera a doca automaticamente como disponível.
- **`CANCELLED` (Cancelado)**: Agendamento cancelado.

---

## 🚀 Instalação e Execução

### Script de Automação e CI (`./ci`)

O projeto inclui um script automatizado chamado `ci` na raiz que realiza todo o setup do ambiente e executa todas as suítes de testes (Backend, Frontend e E2E) com relatórios completos:

```bash
# Executa o pipeline completo: Setup + Builds + Testes Unitários + Testes E2E com Relatórios
./ci
# ou
npm run ci
```

#### Modos e Opções do Script `ci`:
- `./ci --ui` (ou `npm run test:e2e:ui`): Abre a interface gráfica interativa do **Playwright UI Mode** para assistir à execução dos testes ponta a ponta ao vivo com *time-travel debugger*.
- `./ci --report` (ou `npm run test:e2e:report`): Abre o relatório visual interativo em HTML gerado pelo Playwright com capturas de tela e passos executados.
- `./ci --setup-only` (ou `npm run setup`): Realiza apenas a verificação de dependências e builds dos projetos.
- `./ci --no-e2e`: Executa setup e testes unitários (backend e frontend), ignorando a etapa E2E.

---

### Execução Manual e Desenvolvimento

Você pode iniciar ambos os serviços separadamente ou juntos:

**Opção A — Iniciar tudo junto:**
```bash
npm run dev
```

**Opção B — Iniciar em terminais separados:**
```bash
# Terminal 1: Backend NestJS (porta 3000)
npm run dev:backend

# Terminal 2: Frontend Vue 3 + Vite (porta 5173)
npm run dev:frontend
```

O Frontend estará disponível em: **`http://localhost:5173`**  
O Backend estará disponível em: **`http://localhost:3000/api`**  
A documentação Swagger estará disponível em: **`http://localhost:3000/api/docs`**

---

## 🔑 Credenciais Padrão para Testes

O sistema inicializa automaticamente dados demonstrativos e 3 usuários padrão no primeiro boot:

| Perfil | E-mail | Senha |
|---|---|---|
| **Administrador** | `admin@shippinglog.local` | `admin123` |
| **Operador** | `operador@shippinglog.local` | `operador123` |
| **Motorista** | `motorista@shippinglog.local` | `motorista123` |
| **Usuário (Leitura)** | `usuario@shippinglog.local` | `user123` |

> 💡 *Dica:* Na tela de login, há botões de **"Acesso Rápido por Perfil (Demo)"** para entrar com 1 clique em qualquer um dos perfis.

---

## 📚 Documentação da API (Swagger)

A API do NestJS possui documentação interativa OpenAPI/Swagger configurada. Com o backend em execução, acesse:

👉 **`http://localhost:3000/api/docs`**

Principais rotas da API:
- `POST /api/auth/login`: Autenticação e obtenção do JWT.
- `GET /api/schedules`: Listagem de agendamentos com métricas acumuladas de tempos.
- `GET /api/schedules/metrics`: Indicadores de painel (médias de paradas, descarga e aderência).
- `POST /api/schedules`: Criação de nova janela de descarga.
- `POST /api/schedules/:id/stage`: Transição de etapa com encerramento automático do tempo da etapa anterior e registro de justificativa.
- `GET /api/docks`: Gestão das docas de recebimento.
- `GET /api/trucks`: Cadastro de caminhões e transportadoras.
- `GET /api/users`: Gestão de usuários locais (exclusivo para Administrador).

---

## 📄 Licença

Este projeto está licenciado sob os termos da [Apache License 2.0](LICENSE).
