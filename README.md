# financas-api

API REST para gestão de finanças pessoais — categorias, transações e orçamentos, com autenticação por utilizador.

Projeto construído para aprender e demonstrar design de uma API do zero: autenticação (JWT), modelação de dados relacional, validação de input, isolamento de dados por utilizador e lógica de negócio além de CRUD simples (resumos agregados, estado de orçamento).

**Em produção:** https://financas-api-production-8f73.up.railway.app ([`/health`](https://financas-api-production-8f73.up.railway.app/health), [`/docs`](https://financas-api-production-8f73.up.railway.app/docs))

## Stack

- Node.js + Express
- PostgreSQL + Prisma (ORM)
- JWT (jsonwebtoken) + bcrypt para autenticação
- Zod para validação
- Vitest + Supertest para testes
- Swagger UI (OpenAPI) para documentação interativa
- Docker Compose para Postgres local

## Modelo de dados

- **User** — conta do utilizador
- **Category** — categorias de receita/despesa, por utilizador
- **Transaction** — movimentos (receita ou despesa), associados a uma categoria
- **Budget** — limite de gasto por categoria e período (ex: `2026-10`)

Ver [`prisma/schema.prisma`](./prisma/schema.prisma) para o esquema completo.

## Endpoints

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Iniciar sessão |
| GET | `/auth/me` | Dados do utilizador autenticado |

### Categories (autenticado)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/categories` | Listar |
| POST | `/categories` | Criar |
| PUT | `/categories/:id` | Atualizar |
| DELETE | `/categories/:id` | Remover |

### Transactions (autenticado)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/transactions` | Listar (filtros: `from`, `to`, `categoryId`, `type`; paginação: `page`, `pageSize`) |
| GET | `/transactions/summary` | Totais agregados por categoria/tipo |
| GET | `/transactions/:id` | Detalhe |
| POST | `/transactions` | Criar |
| PUT | `/transactions/:id` | Atualizar |
| DELETE | `/transactions/:id` | Remover |

### Budgets (autenticado)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/budgets` | Listar |
| POST | `/budgets` | Criar |
| DELETE | `/budgets/:id` | Remover |
| GET | `/budgets/:id/status` | Gasto atual vs. limite no período |

Todas as rotas autenticadas esperam `Authorization: Bearer <token>`.

Documentação interativa (Swagger UI) disponível em `GET /docs` com o servidor a correr — ver [`openapi.yaml`](./openapi.yaml) para a especificação completa.

## Setup local

1. Subir uma base de dados Postgres local:
   ```
   docker compose up -d
   ```
2. Copiar `.env.example` para `.env` (já vem pré-configurado para o Postgres do docker-compose).
3. Instalar dependências:
   ```
   npm install
   ```
4. Criar as tabelas na base de dados:
   ```
   npm run prisma:migrate
   ```
5. Correr em modo dev:
   ```
   npm run dev
   ```

API disponível em `http://localhost:3001`. Endpoint de verificação: `GET /health`. Documentação: `GET /docs`.

## Testes

Os testes de integração correm contra uma base de dados Postgres real e separada (`financas_api_test`), limpa antes de cada teste.

1. Criar a base de dados de teste (uma vez):
   ```
   docker compose exec db psql -U financas -d postgres -c "CREATE DATABASE financas_api_test;"
   ```
2. Aplicar as migrações a essa base de dados:
   ```
   npm run prisma:migrate:test
   ```
3. Correr os testes:
   ```
   npm test
   ```

## Próximos passos

- Refresh tokens
- Rate limiting
- Deploy (Railway/Render) + CI no GitHub Actions
