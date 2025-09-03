# Library Loans API 📚

Sistema de empréstimos de biblioteca desenvolvido com NestJS, Prisma e PostgreSQL.

## 🚀 Funcionalidades

- ✅ **POST /loans** - Criar empréstimo com validações de negócio
- ✅ **PATCH /loans/:id/return** - Devolver livro emprestado
- ✅ **GET /catalog** - Listar catálogo com disponibilidade
- ✅ **Autenticação** via header `x-user-id`
- ✅ **CI/CD** configurado no GitHub Actions
- ✅ **PostgreSQL** como banco de dados

## 📋 Regras de Negócio

### Empréstimos
- Máximo de **2 empréstimos ativos** por usuário
- Bloqueio quando estoque esgotado (cópias em uso ≥ copiesTotal) → **409 Conflict**
- Validação de existência do livro → **404 Not Found**

### Autenticação
- Header obrigatório: `x-user-id`
- Criação automática de usuário se não existir

## 🛠️ Tecnologias

- **NestJS** - Framework Node.js
- **Prisma** - ORM e migrações
- **PostgreSQL** - Banco de dados
- **Swagger** - Documentação da API
- **GitHub Actions** - CI/CD
- **Docker** - Containerização

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- npm ou yarn

### 1. Clone o repositório
\`\`\`bash
git clone <repository-url>
cd library-loans
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configure o banco de dados

#### Opção 1: Usando Docker (Recomendado)
\`\`\`bash
# Iniciar PostgreSQL com Docker
docker-compose -f docker-compose.dev.yml up -d

# Configurar variável de ambiente
export DATABASE_URL="postgresql://postgres:password@localhost:5433/library_loans?schema=public"
\`\`\`

#### Opção 2: PostgreSQL local
\`\`\`bash
# Configure a variável de ambiente
export DATABASE_URL="postgresql://postgres:password@localhost:5432/library_loans?schema=public"
\`\`\`

### 4. Execute as migrações e seed
\`\`\`bash
# Gerar o Prisma Client
npm run prisma:generate

# Aplicar migrações
npm run prisma:db:push

# Popular banco com dados de exemplo
npm run prisma:seed
\`\`\`

### 5. Inicie a aplicação
\`\`\`bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
\`\`\`

## 🐳 Docker

### Desenvolvimento com Docker Compose
\`\`\`bash
# Inicia PostgreSQL e aplicação
docker-compose up -d

# Executar migrações
docker-compose exec app npm run prisma:db:push

# Executar seed
docker-compose exec app npm run prisma:seed
\`\`\`

## 📖 Documentação da API

Após iniciar a aplicação, acesse:
- **Swagger UI**: http://localhost:3000/api
- **API Base**: http://localhost:3000

### Endpoints

#### POST /loans
Cria um novo empréstimo

**Headers:**
\`\`\`
x-user-id: user-123
\`\`\`

**Body:**
\`\`\`json
{
  "sku": "BOOK-001"
}
\`\`\`

**Responses:**
- ✅ **201** - Empréstimo criado
- ❌ **409** - Livro indisponível ou limite de empréstimos
- ❌ **404** - Livro não encontrado

#### PATCH /loans/:id/return
Devolve um livro emprestado

**Headers:**
\`\`\`
x-user-id: user-123
\`\`\`

**Responses:**
- ✅ **200** - Livro devolvido
- ❌ **404** - Empréstimo não encontrado
- ❌ **409** - Empréstimo já devolvido

#### GET /catalog
Lista catálogo de livros com disponibilidade

**Headers:**
\`\`\`
x-user-id: user-123
\`\`\`

**Response:**
\`\`\`json
[
  {
    "id": "clx...",
    "sku": "BOOK-001",
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "copiesTotal": 3,
    "copiesInUse": 1,
    "copiesAvailable": 2,
    "isAvailable": true
  }
]
\`\`\`

## 🧪 Testes

\`\`\`bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:cov

# Testes e2e
npm run test:e2e

# Testes em modo watch
npm run test:watch
\`\`\`

## 📊 Banco de Dados

### Schema

**Users**
- id (CUID)
- userId (string, unique) - vem do header x-user-id
- createdAt, updatedAt

**Books**
- id (CUID)
- sku (string, unique)
- title, author (string)
- copiesTotal (int)
- createdAt, updatedAt

**Loans**
- id (CUID)
- userId, bookId (foreign keys)
- loanDate (DateTime)
- returnDate (DateTime, nullable)
- status (ACTIVE | RETURNED)
- createdAt, updatedAt

### Comandos Prisma

\`\`\`bash
# Visualizar banco
npm run prisma:studio

# Reset do banco
npx prisma migrate reset

# Gerar nova migração
npx prisma migrate dev --name nome-da-migracao
\`\`\`

## 🔧 Scripts Disponíveis

\`\`\`bash
npm run start:dev      # Desenvolvimento com hot-reload
npm run start:prod     # Produção
npm run build          # Build da aplicação
npm run lint           # ESLint
npm run format         # Prettier
npm run prisma:studio  # Interface do banco
npm run prisma:seed    # Popular banco com dados
\`\`\`

## 🚀 CI/CD

O projeto inclui pipeline do GitHub Actions que:

- ✅ Executa testes em Node.js 18 e 20
- ✅ Configura PostgreSQL como serviço
- ✅ Roda linter e testes
- ✅ Faz build da aplicação
- ✅ Executa em PRs e pushes para main/develop

## 📝 Exemplos de Uso

### 1. Criar empréstimo
\`\`\`bash
curl -X POST http://localhost:3000/loans \\
  -H "Content-Type: application/json" \\
  -H "x-user-id: user-123" \\
  -d '{"sku": "BOOK-001"}'
\`\`\`

### 2. Devolver livro
\`\`\`bash
curl -X PATCH http://localhost:3000/loans/clx.../return \\
  -H "x-user-id: user-123"
\`\`\`

### 3. Ver catálogo
\`\`\`bash
curl -X GET http://localhost:3000/catalog \\
  -H "x-user-id: user-123"
\`\`\`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença privada.
# library-loan
