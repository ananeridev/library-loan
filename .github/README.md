# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD para o projeto Library Loans.

## 📋 Workflows Disponíveis

### 1. **test.yml** - Suite de Testes
Executa todos os tipos de teste:
- ✅ **Testes Unitários**: Testes isolados de componentes individuais
- ✅ **Testes de Integração**: Testes com banco de dados real
- ✅ **Testes E2E**: Testes end-to-end completos
- ✅ **Build**: Compilação da aplicação

**Triggers:**
- Push para `main` ou `develop`
- Pull Requests para `main` ou `develop`

### 2. **deploy.yml** - Deploy
Gerencia o deploy da aplicação:
- 🚀 **Staging**: Deploy automático quando push para `develop`
- 🚀 **Produção**: Deploy manual quando push para `main`

### 3. **security.yml** - Segurança e Qualidade
Análises de segurança e qualidade de código:
- 🔒 **Security Audit**: Verificação de vulnerabilidades
- 📊 **Code Quality**: ESLint, Prettier, TypeScript
- 🔍 **Dependency Review**: Análise de dependências

### 4. **coverage.yml** - Cobertura de Código
Gera relatórios de cobertura:
- 📈 **Code Coverage**: Relatórios detalhados de cobertura
- 📊 **Codecov Integration**: Upload automático para Codecov

## 🚀 Como Usar

### Executar Testes Localmente
```bash
# Todos os testes
npm run test:all

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Apenas testes E2E
npm run test:e2e
```

### Verificar Status dos Workflows
1. Acesse a aba **Actions** no GitHub
2. Visualize o status de cada workflow
3. Clique em um job para ver logs detalhados

### Deploy Manual
1. Faça push para a branch `main`
2. Acesse a aba **Actions**
3. Execute o workflow "Deploy to Production" manualmente

## 🔧 Configuração

### Variáveis de Ambiente Necessárias
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/library_loans_test
NODE_VERSION=18
```

### Secrets do GitHub (se necessário)
Configure os seguintes secrets no repositório:
- `DATABASE_URL_PROD`: URL do banco de produção
- `DEPLOY_TOKEN`: Token para deploy
- `SLACK_WEBHOOK`: Webhook para notificações

## 📊 Relatórios

### Cobertura de Código
- **Unit Tests**: `coverage/unit/`
- **Integration Tests**: `coverage/integration/`
- **E2E Tests**: `coverage/e2e/`

### Artifacts
Os workflows geram os seguintes artifacts:
- Build artifacts (1 dia de retenção)
- Coverage reports (7 dias de retenção)
- Test results (7 dias de retenção)

## 🐛 Troubleshooting

### Testes Falhando
1. Verifique os logs na aba Actions
2. Execute os testes localmente
3. Verifique se o banco de dados está configurado corretamente

### Deploy Falhando
1. Verifique se todos os testes passaram
2. Confirme se as variáveis de ambiente estão configuradas
3. Verifique os logs de deploy

### Problemas de Performance
1. Os testes E2E são executados sequencialmente para evitar conflitos
2. Use cache do npm para acelerar builds
3. Considere usar runners self-hosted para projetos grandes

## 📝 Notas Importantes

- **Testes E2E**: Executados sequencialmente (`maxWorkers: 1`) para evitar conflitos de dados
- **Banco de Dados**: PostgreSQL 13 é usado para todos os testes
- **Node.js**: Versão 18 é usada em todos os workflows
- **Cache**: Dependências do npm são cacheadas para melhor performance
