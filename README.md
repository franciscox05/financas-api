# financas-api

API REST para gestão de finanças pessoais — categorias, transações e orçamentos, com autenticação por utilizador.

Projeto construído para aprender e demonstrar design de uma API do zero: autenticação (JWT), modelação de dados relacional, validação de input, isolamento de dados por utilizador e lógica de negócio além de CRUD simples (resumos agregados, estado de orçamento).

## Stack

- Node.js + Express
- PostgreSQL + Prisma (ORM)
- JWT (jsonwebtoken) + bcrypt para autenticação
- Zod para validação
- Vitest + Supertest para testes

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

## Setup local

1. Copiar `.env.example` para `.env` e preencher `DATABASE_URL` (Postgres) e `JWT_SECRET`.
2. Instalar dependências:
   ```
   npm install
   ```
3. Criar as tabelas na base de dados:
   ```
   npm run prisma:migrate
   ```
4. Correr em modo dev:
   ```
   npm run dev
   ```

API disponível em `http://localhost:3000`. Endpoint de verificação: `GET /health`.

## Testes

```
npm test
```

## Próximos passos

- Documentação OpenAPI/Swagger
- Refresh tokens
- Rate limiting
- Deploy (Railway/Render) + CI no GitHub Actions
