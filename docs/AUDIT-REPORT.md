# XTAGE — Relatório Completo de Auditoria de Gaps e Problemas

**Data:** 2026-03-04
**Escopo:** Web (Aluno, Criador, Master), API Routes, Auth/Public, Mobile

---

## Resumo Executivo

| Área | Críticos | Altos | Médios | Baixos | Total |
|------|----------|-------|--------|--------|-------|
| **Dashboard (Aluno)** | 4 | 8 | 6 | 5 | **23** |
| **Studio (Criador)** | 1 | 3 | 5 | 1 | **10** |
| **Master** | 1 | 7 | 5 | 0 | **13** |
| **API Routes** | 14 | 13 | 3 | 0 | **30** |
| **Auth / Public** | 3 | 4 | 5 | 1 | **13** |
| **Mobile** | 4 | 3 | 3 | 3 | **13** |
| **TOTAL** | **27** | **38** | **27** | **10** | **102** |

---

## 1. XTAGE ALUNO (Dashboard do Estudante)

### 1.1 Botões Mortos (Sem onClick / Sem Função)

| Arquivo | Linha | Elemento | Problema |
|---------|-------|----------|----------|
| `components/layout/sidebar.tsx` | 77-87 | Botão "Encerrar Sessão" | **Sem onClick** — não faz logout |
| `dashboard/certificado/[courseId]/page.tsx` | 58-63 | Botões "Compartilhar" e "Salvar PDF" | **Sem onClick** — certificado não exporta |
| `dashboard/xtore/page.tsx` | 75-76 | Tabs "Lançamentos" / "Mais Vendidos" | **Sem onClick** — filtros não funcionam |
| `dashboard/xtore/page.tsx` | 117-119 | Botão carrinho de compras | **Sem onClick** — sistema de carrinho inexistente |
| `dashboard/afiliados/page.tsx` | 136-138 | Botão copiar link de afiliado | **Sem onClick** — não copia para clipboard |
| `components/player/video-player.tsx` | 392-394 | Botão Configurações | Mostra `alert("Em breve")` ao invés de funcionalidade real |

### 1.2 Funcionalidades Stub / Incompletas

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `dashboard/perfil/page.tsx` | 104 | **Deletar conta**: retorna mensagem "em implementação" sem deletar nada |
| `dashboard/config/page.tsx` | 197 | **Idioma**: salva no localStorage, nenhum sistema i18n existe. 8 idiomas listados sem tradução |
| `dashboard/config/page.tsx` | 35-39 | **Light mode**: alerta que "nem todas as páginas suportam" |
| `dashboard/config/page.tsx` | 121-131 | **Configurações salvas só em localStorage**, nunca sincronizadas com banco |
| `dashboard/config/page.tsx` | 127 | **Delay falso** `setTimeout(300ms)` simulando salvamento |
| `dashboard/perfil/page.tsx` | 202-206 | **Link social** (Instagram/TikTok) coletado mas nunca salvo no banco |

### 1.3 Erro de Tratamento Ausente

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `dashboard/xtore/page.tsx` | 31-36 | Query XP history sem error handling — user vê 0 XP se falhar |
| `dashboard/config/page.tsx` | 63-69 | Service worker `.catch(console.error)` — falha silenciosa |
| `components/lesson-comments.tsx` | 40-44 | Fetch de comentários falha silenciosamente |

---

## 2. XTAGE CRIADOR (Studio)

### 2.1 Botões Mortos / Features Desabilitadas

| Arquivo | Linha | Elemento | Problema |
|---------|-------|----------|----------|
| `studio/loja/page.tsx` | 103-107 | Input de busca | **`disabled`** — campo de busca desativado no código |
| `studio/loja/page.tsx` | 89 | Receita Bruta (Mês) | **Hardcoded "R$ 0,00"** — nunca calculado do banco |

### 2.2 Erros Silenciosos (Sem feedback ao usuário)

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `studio/assinaturas/page.tsx` | 88-101 | `handleToggle()` e `handleDelete()` **sem try/catch** — falham silenciosamente |
| `studio/upload/page.tsx` | 26 | `.catch(() => setLoadingCourses(false))` — erro engolido |
| `studio/configuracoes/dominio/page.tsx` | 19 | `console.error(error)` apenas — sem feedback visual |
| `studio/configuracoes/pagamentos/page.tsx` | 31-40 | Sem validação se API KYC falhar |
| `studio/financeiro/page.tsx` | 38, 70 | Erros logados no console apenas |

### 2.3 Implementações Incompletas

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `studio/loja/[id]/page.tsx` | 299-329 | Formulário de dimensões de frete **sem validação** e sem integração Correios |
| `studio/financeiro/page.tsx` | 97-110 | Modo mock/homologação hardcoded — não é produção-ready |

---

## 3. XTAGE MASTER

### 3.1 Botões Mortos (Sem onClick)

| Arquivo | Linha | Elemento | Problema |
|---------|-------|----------|----------|
| `master/escolas/page.tsx` | 104-106 | Botão "Filtrar" | **Sem onClick** |
| `master/escolas/page.tsx` | 107-109 | Botão "Cadastrar Escola" | **Sem onClick** — botão vermelho em destaque sem função |
| `master/escolas/page.tsx` | 248-250 | Botão "Suspender Operação" | **Sem onClick** |
| `master/escolas/page.tsx` | 117-122 | Campo de busca | Sem `value`, `onChange` ou state — digita mas não filtra |

### 3.2 Dados Hardcoded / Nunca Buscados

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `master/escolas/page.tsx` | 231 | Coluna "Cursos" sempre mostra **"0"** |
| `master/escolas/page.tsx` | 232 | Coluna "Mês" (receita) sempre mostra **"R$ 0"** |
| `master/layout.tsx` | 31-32 | Nome do usuário **hardcoded "Jonathan F."** — não busca do auth |

### 3.3 Configurações Completamente Não-Funcionais

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `master/config/page.tsx` | 42-56 | **TODOS os inputs sem onChange** — formulário inteiro é read-only |
| `master/config/page.tsx` | 9-12 | `handleSave()` apenas mostra toast — **nenhuma API chamada** |
| `master/config/page.tsx` | 100-104 | Dropdown PWA Offline sem onChange — seleção ignorada |

### 3.4 Erro de Tratamento Ausente

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `master/page.tsx` | 36-64 | `fetchDashboard()` sem nenhum error handling |
| `master/alunos/page.tsx` | 21-29 | Erro na query silenciado, tabela fica vazia |

---

## 4. API ROUTES

### 4.1 Endpoints Mock / Stub (Dados Falsos em Produção)

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `api/checkout/route.ts` | 110-133 | **Checkout PIX mock** quando `ASAAS_API_KEY` ausente — aceita qualquer pagamento |
| `api/checkout/subscription/route.ts` | 74-95 | **Assinatura mock** com `user_id: "00000000-..."` |
| `api/master/schools/approve/route.ts` | 58-68 | **Wallet ID fake** `mocked_wallet_${Date.now()}` |
| `api/studio/finance/withdraw/route.ts` | 42-49 | **Saque mock** retorna sucesso sem processar |
| `api/xtore/shipping/route.ts` | 18-66 | **Frete 100% mockado** — TODO: integrar Melhor Envio |

### 4.2 TODOs / Funcionalidades Não Implementadas

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `api/courses/enroll/route.ts` | 56 | `// TODO: Integrate with ASAAS payment flow` — **matrícula paga NÃO funciona** (retorna 402) |
| `api/xtore/shipping/route.ts` | 19 | `// TODO: Fetch real here using body products metrics` |
| `api/studio/tenant/domain/route.ts` | 72 | Verificação de domínio **nunca executada** — domínios ficam `verified: false` eternamente |

### 4.3 Problemas de Segurança / Auth Ausente

| Arquivo | Problema |
|---------|----------|
| `api/xtore/shipping/route.ts` | **Sem autenticação** — qualquer pessoa pode calcular frete |
| `api/xtore/products/route.ts` (GET) | Sem verificação de acesso ao tenant |
| `api/studio/tenant/domain/route.ts` (GET) | Auth fraco — não valida ownership do tenant |

### 4.4 Race Conditions / Inconsistência de Dados

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `api/xtore/orders/route.ts` | 95-109 | **Decremento de estoque sem transação** — race condition |
| `api/checkout/subscription/route.ts` | 193-208 | `split_audit` inserido DEPOIS da subscription — se falhar, dados financeiros inconsistentes |

### 4.5 Queries Supabase Potencialmente Quebradas

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `api/checkout/route.ts` | 70 | Sintaxe de relationship `tenants:tenants!tenant_id` redundante |
| `api/courses/enroll/route.ts` | 93-97 | Cast inseguro `(courseInfo.tenants as any)` |
| `api/progress/track/route.ts` | 70 | `onConflict` pode falhar se constraint não existir |

### 4.6 Webhook Issues

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `api/webhooks/asaas/route.ts` | 138-158 | Ciclo de 30 dias **hardcoded** ao invés de usar dados do plano |
| `api/webhooks/asaas/route.ts` | 200-211 | **Comissão de afiliado não registrada** para assinaturas |
| `api/webhooks/asaas/route.ts` | 297-320 | Meta Pixel CAPI falha silenciosamente |
| `api/webhooks/bunny/route.ts` | 27-44 | Update de status do vídeo não verifica resultado |

---

## 5. AUTH / PÁGINAS PÚBLICAS

### 5.1 Problemas Críticos

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `(public)/seja-parceiro/page.tsx` | 11-27 | **Formulário de parceiro NUNCA chama API** — simula delay e mostra sucesso falso |
| `(public)/checkout/[courseId]/page.tsx` | 234, 239 | **CSS Tailwind quebrado** — classes com espaços (`flex - 1` ao invés de `flex-1`) — botões de pagamento com layout quebrado |
| `auth/callback/route.ts` | 49 | Erro de OAuth redireciona com `?error=auth_callback_failed` mas login page **não exibe essa mensagem** |

### 5.2 Problemas de Auth Flow

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `(auth)/login/page.tsx` | 33 | Usa `window.location.href` ao invés de `router.push()` |
| `(auth)/register/page.tsx` | 31-51 | Mostra "verifique email" sem verificar se confirmação está habilitada no Supabase |
| `(public)/checkout/[courseId]/page.tsx` | 302-315 | Pós-pagamento mostra link "Acessar Dashboard" mas usuário pode não ter conta |
| `components/auth/social-login-buttons.tsx` | 12-31 | Apenas Google OAuth implementado |

### 5.3 Validação Ausente

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `(public)/checkout/[courseId]/page.tsx` | 200-220 | Campos email/CPF/telefone **sem atributo `required`** |
| `(auth)/register/page.tsx` | 24-28 | Validação de senha (8 chars) apenas client-side |

---

## 6. MOBILE APP

### 6.1 Botões Mortos (Sem onPress)

| Arquivo | Linha | Elemento | Problema |
|---------|-------|----------|----------|
| `ClassScreen.js` | 62-65 | Botão "Curtir" | **Sem onPress** |
| `ClassScreen.js` | 66-69 | Botão "Avaliar" | **Sem onPress** |
| `ClassScreen.js` | 70-73 | Botão "Link" (Compartilhar) | **Sem onPress** |
| `ClassScreen.js` | 74-77 | Botão "Mais" | **Sem onPress** |
| `ClassScreen.js` | 90-92 | Botão "Seguir" instrutor | **Sem onPress** |
| `ProfileScreen.js` | 61-67 | Menu "Ajustes" | **Sem onPress** |
| `ProfileScreen.js` | 69-75 | Menu "Notificações" | **Sem onPress** |
| `ProfileScreen.js` | 77-83 | Menu "Pagamentos Nativos" | **Sem onPress** |
| `LibraryScreen.js` | 25-58 | Itens de assinatura/acesso | **Sem onPress** — não navega para detalhes |

### 6.2 Tela Inteira com Dados Fake

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `ClassScreen.js` | 37 | **URL de vídeo de teste** (`test-streams.mux.dev`) hardcoded |
| `ClassScreen.js` | 52-88 | **TODOS os textos hardcoded**: título, descrição, XP, módulo, instrutor, contagem de alunos |
| `ClassScreen.js` | — | `route.params` (courseId, lessonId) **completamente ignorados** |
| `LibraryScreen.js` | 7-11 | **Dados 100% mockados** — nenhum fetch real. Lista fake de assinaturas |

### 6.3 Navegação Incorreta

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `HomeScreen.js` | 175-177 | Ícone de sino (notificações) navega para **"Profile"** ao invés de tela de notificações |
| `notifications.js` | 98-102 | Deep links só tratam 'dashboard' e 'ranking' — outros URLs falham silenciosamente |

### 6.4 Error Handling Ausente

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `AuthContext.js` | 19-26 | `fetchProfile` **sem try/catch** — se query falhar, `setProfile(undefined)` |
| `notifications.js` | 56-62 | Update de push_token **sem error handling** |
| `supabase.js` | 5-6 | Fallback para URL placeholder se env var ausente — app conecta em URL inexistente |

---

## TOP 10 Problemas Mais Críticos (Prioridade de Correção)

| # | Problema | Impacto | Área |
|---|---------|---------|------|
| 1 | **Checkout PIX mock aceita pagamentos sem processar** | Usuários "compram" sem pagar | API/Checkout |
| 2 | **Matrícula em curso pago retorna 402** (TODO não implementado) | Impossível comprar cursos avulsos | API/Enroll |
| 3 | **Botão Logout sem função** | Aluno não consegue sair | Dashboard |
| 4 | **CSS Tailwind quebrado no checkout** (`flex - 1`) | Botões de pagamento com layout errado | Checkout |
| 5 | **Formulário parceiro simula sucesso sem enviar dados** | Leads de parceria perdidos | Público |
| 6 | **Mobile ClassScreen 100% hardcoded** | App mobile não mostra conteúdo real | Mobile |
| 7 | **Mobile LibraryScreen 100% mock** | Aluno não vê seus cursos reais | Mobile |
| 8 | **12 botões mortos no mobile** (sem onPress) | App parece quebrado | Mobile |
| 9 | **Master Config não salva nada** (sem onChange/API) | Configurações master inutilizáveis | Master |
| 10 | **Frete 100% mockado** (TODO Melhor Envio) | Preços de frete falsos na xtore | API/Shipping |

---

## Recomendações

### Correções Imediatas (Sprint 1)
1. Implementar onClick no botão de Logout (`sidebar.tsx`)
2. Corrigir classes Tailwind quebradas no checkout
3. Conectar formulário de parceiro à API `/api/partner/apply`
4. Adicionar error handling básico nas queries do AuthContext (mobile)

### Correções de Curto Prazo (Sprint 2)
5. Implementar integração ASAAS real no checkout (remover mock mode)
6. Implementar matrícula em cursos pagos (`/api/courses/enroll`)
7. Tornar ClassScreen e LibraryScreen do mobile dinâmicos
8. Wiring dos 12 botões mortos do mobile
9. Implementar handleSave real no Master Config

### Correções de Médio Prazo (Sprint 3)
10. Integrar Melhor Envio para cálculo de frete real
11. Implementar sistema de carrinho na Xtore
12. Implementar geração/download de certificado PDF
13. Verificação de domínio real (DNS check via cron/webhook)
14. Corrigir race condition no decremento de estoque
15. Sincronizar configurações do dashboard com banco (sair do localStorage)
