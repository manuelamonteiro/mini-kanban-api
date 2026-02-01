# Mini Kanban API

API REST em Node.js + Express + MySQL que oferece quadros no estilo do Trello com autenticação JWT, com regras de autorização por dono do board e operações para manter a ordem de colunas e cartões.

## Visão geral
- Stack: Node.js 18+, Express 5, MySQL 8, mysql2/promise, Joi, JWT (jsonwebtoken), bcrypt, Jest + Supertest, Nodemon.
- Modelo: usuários ➜ boards ➜ columns ➜ cards.
- Segurança: autenticação por bearer token; todas as rotas abaixo de `/api` (exceto `/api/auth/*`) exigem `Authorization: Bearer <accessToken>`.
- Regras de posição: posições são 1-based; mover um cartão é transacional, recalcula posições na origem e destino.
- Convenções de resposta: `{ success, data, error }`; erros de validação retornam status 422 com detalhes normalizados.

## Pré-requisitos
- Node.js 18+
- npm
- MySQL 8+ rodando localmente

Cheque rapidamente:
```bash
node -v         
npm -v
mysql --version 
mysqladmin ping -u root -p  
```

## Variáveis de ambiente
Copie `.env.example` para `.env` e ajuste. Principais chaves:

| Variável             | Padrão      | Observação                                               |
|----------------------|-------------|----------------------------------------------------------|
| PORT                 | 5000        | Porta HTTP da API                                        |
| DB_HOST              | localhost   | Host do MySQL                                            |
| DB_USER              | root        | Usuário do MySQL                                         |
| DB_PASSWORD          | (vazia)     | Senha do MySQL                                           |
| DB_NAME              | mini_kanban | Nome do banco usado pela aplicação                       |
| DB_CONNECTION_LIMIT  | 10          | Tamanho do pool                                          |
| JWT_ACCESS_SECRET    | —           | Segredo para assinar tokens JWT                          |
| JWT_ACCESS_TTL       | 1d          | Expiração do access token (ex.: `12h`, `7d`)             |
| BCRYPT_SALT_ROUNDS   | 10          | Custo do hash de senha                                   |

Para testes você pode criar um `.env.test`; o Jest usa `NODE_OPTIONS=--experimental-vm-modules` e o setup define `JWT_ACCESS_SECRET` se faltar.

## Banco de dados
Crie o schema uma vez:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mini_kanban CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p mini_kanban < db_schema.sql
```
Tabelas e chaves:
- `users (id UUID PK)` ➜ `boards.owner_user_id` (CASCADE delete)
- `boards.id` ➜ `columns.board_id` (CASCADE delete)
- `columns.id` ➜ `cards.column_id` (CASCADE delete)
- `columns` tem `position` único por board; `cards` tem `position` por coluna.

Ao criar um board são geradas 5 colunas padrão: Backlog, To Do, In Progress, Done, Extra.

Comandos úteis de conferência:
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'mini_kanban';"
mysql -u root -p -e "USE mini_kanban; SHOW TABLES;"
mysql -u root -p -e "USE mini_kanban; DESCRIBE users;"
```

## Instalação e execução
```bash
npm install
npm run dev   # nodemon, auto-reload
# ou
npm start     # node puro
```
Base URL local: `http://localhost:5000/api`.

## Scripts npm
- `npm run dev` — inicia com nodemon.
- `npm start` — inicia em modo produção.
- `npm test` — Jest em modo ESM, executa testes unitários e de integração que mockam DB (não requer MySQL rodando).

## Estrutura de pastas
- `src/app.js` configura Express/CORS/JSON e registra rotas.
- `src/routes` agrupa rotas de auth, boards e cards.
- `src/controllers` valida inputs com Joi e monta respostas.
- `src/services` regras de negócio (ownership, transações, movimentação).
- `src/repositories` acesso MySQL usando `mysql2/promise`.
- `src/middlewares` auth JWT e tratador de erros padronizado.
- `src/validators` schemas Joi para body/params.
- `src/utils` helpers (JWT, erros, utilitários de board/card).
- `db_schema.sql` DDL completa.
- `test/` helpers, unit e integration (com mocks de services e middleware).

## Autenticação
Enviar `Authorization: Bearer <accessToken>` em todas as rotas (exceto `/auth`). O `accessToken` é um JWT assinado com `JWT_ACCESS_SECRET`; payload inclui `sub` (user id) e `email`.

## Endpoints (prefixo /api)
### Auth
- `POST /auth/register` — body `{ name, email, password }`; senha min 6; retorna `{ user, accessToken }`.
- `POST /auth/login` — body `{ email, password }`; retorna `{ user, accessToken }`.

### Boards
- `POST /boards` — body `{ name }`; cria board do usuário e 5 colunas padrão; retorna `{ id, name }`.
- `GET /boards` — lista boards do usuário `{ id, name, createdAt }` ordenados por criação desc.
- `GET /boards/:id` — retorna `{ id, name, columns: [{ id, name, position, cards: [...] }] }` com colunas e cartões ordenados por posição.
- `POST /boards/:id/columns` — body `{ name, position? }`; `position` 1-based, se ausente vai para o final; abre espaço deslocando posições existentes; responde `{ id, name, position }`.
- `DELETE /boards/:id` — remove board (e colunas/cartões via cascade); responde `{ deleted: true }`.

### Cards
- `POST /columns/:columnId/cards` — body `{ title, description? }` (description default ''); cria cartão na próxima posição da coluna.
- `PUT /cards/:id` — body `{ title?, description? }`; atualiza campos informados; responde cartão atualizado.
- `DELETE /cards/:id` — responde `{ deleted: true }`.
- `PATCH /cards/:id/move` — body `{ newColumnId, newPosition? }`; regras:
  - posições são 1-based; se `newPosition` faltar ou for inválida, o cartão vai para o final da coluna destino;
  - mover dentro da mesma coluna reordena (remove e insere abrindo espaço);
  - mover para outra coluna puxa quem estava abaixo na origem e abre espaço na coluna destino.
  - operação é transacional; rejeita se card e coluna não forem do mesmo board.

## Formato de resposta e erros
Sucesso:
```json
{ "success": true, "data": { ... }, "error": null }
```
Erro:
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Validation failed",
    "type": "validation",
    "details": [
      { "message": "Title must be at least 1 character long", "path": "title", "joiType": "string.min" }
    ]
  }
}
```
Status mais comuns: 401 (token faltando/ inválido), 403 (não é dono do board), 404 (recurso não encontrado), 409 (email já cadastrado), 422 (falha de validação), 500 (erro interno).

## Testes
Testes não dependem de banco porque os services e o middleware de auth são mockados nos testes de integração.
```bash
npm test
```
