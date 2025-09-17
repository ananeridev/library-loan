# Estrutura de Testes

Este diretório contém todos os testes do projeto organizados por tipo e responsabilidade.

## Estrutura de Pastas

```
test/
├── unit/                    # Testes unitários
│   ├── jest.config.js      # Configuração Jest para testes unitários
│   └── README.md           # Documentação dos testes unitários
├── integration/            # Testes de integração
│   ├── jest.config.js      # Configuração Jest para testes de integração
│   ├── catalog.integration.spec.ts
│   ├── loans.integration.spec.ts
│   └── README.md           # Documentação dos testes de integração
├── e2e/                    # Testes end-to-end
│   ├── jest.config.js      # Configuração Jest para testes e2e
│   ├── jest-e2e.json       # Configuração adicional para e2e
│   ├── setup.ts            # Setup global para testes e2e
│   ├── app.e2e-spec.ts     # Testes e2e da aplicação
│   ├── catalog.e2e-spec.ts # Testes e2e do catálogo
│   ├── loans.e2e-spec.ts   # Testes e2e dos empréstimos
│   └── README.md           # Documentação dos testes e2e
└── README.md               # Este arquivo
```

## Tipos de Teste

### Testes Unitários (`src/` e `test/unit/`)
- **Localização**: `src/**/*.spec.ts` e `test/unit/**/*.spec.ts`
- **Propósito**: Testam unidades individuais de código (classes, métodos, funções)
- **Características**: 
  - Isolados e rápidos
  - Usam mocks para dependências externas
  - Focam em lógica de negócio específica

### Testes de Integração (`test/integration/`)
- **Localização**: `test/integration/**/*.integration.spec.ts`
- **Propósito**: Testam a integração entre diferentes componentes
- **Características**:
  - Testam interações entre serviços e repositórios
  - Usam mocks para dependências externas (banco de dados, APIs)
  - Verificam fluxos de dados entre componentes

### Testes End-to-End (`test/e2e/`)
- **Localização**: `test/e2e/**/*.e2e-spec.ts`
- **Propósito**: Testam a aplicação completa do ponto de vista do usuário
- **Características**:
  - Testam APIs completas
  - Usam banco de dados real (ou containerizado)
  - Simulam cenários reais de uso

## Comandos de Teste

### Testes Unitários
```bash
# Executar todos os testes unitários
npm run test:unit

# Executar em modo watch
npm run test:unit:watch

# Executar com cobertura
npm run test:unit:cov
```

### Testes de Integração
```bash
# Executar todos os testes de integração
npm run test:integration

# Executar em modo watch
npm run test:integration:watch

# Executar com cobertura
npm run test:integration:cov
```

### Testes E2E
```bash
# Executar todos os testes e2e
npm run test:e2e

# Executar em modo watch
npm run test:e2e:watch

# Executar com cobertura
npm run test:e2e:cov
```

### Todos os Testes
```bash
# Executar todos os tipos de teste
npm run test:all

# Executar todos com cobertura
npm run test:all:cov
```

## Convenções de Nomenclatura

- **Testes Unitários**: `*.spec.ts`
- **Testes de Integração**: `*.integration.spec.ts`
- **Testes E2E**: `*.e2e-spec.ts`

## Configuração

Cada tipo de teste tem sua própria configuração Jest:
- `test/unit/jest.config.js` - Configuração para testes unitários
- `test/integration/jest.config.js` - Configuração para testes de integração
- `test/e2e/jest.config.js` - Configuração para testes e2e

## Cobertura de Código

Os relatórios de cobertura são gerados em:
- `coverage/unit/` - Cobertura dos testes unitários
- `coverage/integration/` - Cobertura dos testes de integração
- `coverage/e2e/` - Cobertura dos testes e2e

## Foco no Catálogo

Os testes do catálogo incluem:

### Testes Unitários
- `src/catalog/catalog.service.spec.ts` - Testes do serviço de catálogo
- `src/catalog/catalog.controller.spec.ts` - Testes do controller de catálogo

### Testes de Integração
- `test/integration/catalog.integration.spec.ts` - Testes de integração do catálogo

### Testes E2E
- `test/e2e/catalog.e2e-spec.ts` - Testes end-to-end do catálogo

Estes testes cobrem:
- Cálculo de disponibilidade de livros
- Filtragem de empréstimos ativos
- Integração com o banco de dados
- APIs de catálogo
- Cenários de empréstimo e devolução
