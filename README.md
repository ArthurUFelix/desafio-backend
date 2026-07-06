# Desafio Backend - Sistema de Pedidos

API para cadastro de usuários e produtos, e emissão de ordens de compra.

## Stack

- **NestJS** (Node.js)
- **GraphQL**
- **PostgreSQL**
- **Prisma**
- **Docker / Docker Compose**
- **Jest**

---

## Instruções de execução

Pré-requisitos: Docker e Docker Compose instalados.

```bash
git clone <repo>
cd <repo>
docker compose up -d
```

Isso sobe o Postgres, builda a imagem da aplicação, aplica as migrations e inicia a API em `http://localhost:3000/graphql`.

Para acompanhar os logs:

```bash
docker compose logs -f app
```

Para derrubar tudo (incluindo o volume do banco):

```bash
docker compose down -v
```

### Rodando os testes docker (recomendado)

```bash
docker compose exec app sh
npm run test
npm run test:e2e
```

### Rodando os testes local

```bash
npm install
npx prisma generate
cp .env.example .env
npm run test
npm run test:e2e
```

### Exemplo de uso (GraphQL)

```graphql
mutation {
  createUser(input: { name: "Arthur", email: "arthur@teste.com" }) {
    id
  }
}

mutation {
  createProduct(input: { name: "Mouse", price: 99.90, stock: 10 }) {
    id
  }
}

mutation {
  createOrder(input: {
    userId: 1,
    items: [{ productId: 1, quantity: 2 }]
  }) {
    id
    total
    items { quantity price product { name } }
  }
}
```

---

## Decisões técnicas

- **Prisma como ORM.** Escolhido pelo setup simples, migration declarativas e para experimentar no lugar do TypeORM também.

- **GraphQL code-first.** Os resolvers e entities são definidos em TypeScript com decorators, e o `schema.gql` é gerado automaticamente. Escolhido em vez de schema-first porque evita duplicação entre `.graphql` e tipos TS.

- **Controle de concorrência com `SELECT ... FOR UPDATE`.** A emissão de pedidos roda dentro de uma transação Prisma (`$transaction`) que trava explicitamente a linha do produto (`FOR UPDATE`) antes de validar e decrementar o estoque.

- **Dataloader.** Adicionado dataloader em resolvers para evitar clássico problema de N+1 em consultas aninhadas do graphql.

- **Testes apenas em pontos relevantes.** Para manter esse projeto mais enxuto optei por adicionar testes apenas aos fluxos mais importantes, deixando de lado CRUDs básicos, em ocasiões de produção também deveriam ser cobertos.

---

## Trade-offs

- **GraphQL code-first em vez de schema-first.** O schema é gerado automaticamente a partir dos decorators nas classes TypeScript, evitando duplicação entre tipos e schema. O trade-off é que o contrato da API não existe como artefato independente para revisão manual, o que funciona bem num projeto pequeno como este, mas pode fazer falta em projetos e times maiores onde ter o `.graphql` como documento revisável isoladamente (schema-first) tende a ter mais valor.

- **`FOR UPDATE` trava a linha inteira do produto.** Isso garante correção, porém sob alta concorrência em um único item muito popular, isso pode virar um gargalo. Este lock pessimista é a opção mais simples de ser implementada, mas em escalas maiores valeria apena avaliar um controle de lock otimista com retry ou algum esquema de filas.

- **Sem autenticação/autorização.** O desafio não pediu explicitamente, então não implementei. Qualquer client pode chamar qualquer mutation, incluindo criar pedidos em nome de qualquer `userId`.

---

## O que eu faria diferente com mais tempo

- **Autenticação (JWT) e autorização**, restringindo `createOrder` ao próprio usuário autenticado e protegendo mutations administrativas (ex.: `createProduct`) por role.
- **Paginação e filtros** nas queries `users`, `products` e `orders`, hoje retornando a lista inteira sem limite.
- **Logs estruturados** (usando `nestjs-pino`, por exemplo), incluindo correlação de request ID através da stack, e métricas básicas (latência de mutations, taxa de rejeição por falta de estoque).
- **GitHub Actions** rodando lint, testes unitários e e2e (contra um Postgres de serviço) em cada PR.
- **Rate limiting** nas mutations públicas, como proteção básica de abuso.
- **Cache** nas queries padrões (utilizando Redis por exemplo), com invalidação conforme necessário em mutations ou apenas com TTL.
- **Idempotency key** em mutations para evitar duplicidades indesejadas.

---

## Estrutura do projeto

```
src/
  app.module.ts
  main.ts
  dataloader/
  prisma/
  users/
  products/
  orders/
prisma/
  schema.prisma
test/
  orders.concurrency.e2e-spec.ts
  dataloader-performance.e2e-spec.ts
Dockerfile
docker-compose.yml
```
