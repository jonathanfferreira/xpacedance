# 🚀 Relatório de Avaliação Estratégica e Técnica (v2.0) - XTAGE

**Data:** 04/03/2026
**Objetivo:** Avaliação arquitetural, de segurança, performance e UX para garantir o lançamento do MVP ("Netflix/Hotmart da dança") até o final de março.

---

## 📌 1. Visão Geral do Projeto

A XTAGE apresenta uma arquitetura robusta e alinhada com as melhores práticas de mercado:
- **Monorepo:** Facilita a gestão de dependências e integrações.
- **Web (Next.js 14 App Router):** Excelente para SEO, SSR e performance. A estilização em Tailwind CSS v4 confere um visual brutalista/cyberpunk incrível.
- **Mobile (React Native + Expo):** Permite iterar rápido. O uso de NativeWind mantém consistência visual com a web.
- **Backend (Supabase):** PostgreSQL com Row Level Security (RLS) garante segurança nativa por _tenant_ (escolas/professores).
- **Integrações de Valor:** Pagamentos Asaas, CDN Bunny.net (vídeos), Resend (emails transacionais) e Meta CAPI (ads).

No entanto, existem **gaps críticos** que precisam ser resolvidos antes do lançamento. O aplicativo atual possui muitas telas mockadas (com dados falsos) e fluxos financeiros que não processam pagamentos reais se a chave de produção não estiver presente, ou aceitam "compras" sem validação rigorosa.

---

## 🛡️ 2. Segurança e Fluxos Financeiros (Core Business)

A funcionalidade mais importante da XTAGE é processar pagamentos, dividir a receita (90% Professor / 10% Plataforma) e liberar o acesso.

### Problemas Críticos Encontrados:
1. **Mock Mode Silencioso no Checkout:** A rota `/api/checkout/route.ts` aceita pagamentos e libera cursos sem cobrar de verdade se a chave `ASAAS_API_KEY` estiver ausente. Isso é um risco enorme para produção.
2. **Matrículas em Cursos Avulsos (API/Enroll):** Conforme relatado na auditoria anterior, o endpoint de matrículas pagas não possui integração real, impedindo a compra de cursos avulsos de forma autônoma.
3. **Falhas no Webhook do Asaas:**
    - A rota `/api/webhooks/asaas/route.ts` usa o Supabase Admin (bypassa RLS), o que é correto para servidor, mas não lida com possíveis falhas na criação de alunos de forma resiliente.
    - Se a função RPC `create_notification` falhar, o fluxo inteiro pode não registrar corretamente o webhook de pagamento.
4. **Verificação Incompleta do Afiliado:** O comissionamento de afiliados (na rota checkout) divide o valor, mas não garante que o afiliado esteja ativo ou autorizado.

### Recomendação Imediata:
- **Desativar Mock Mode no Checkout em Produção.** Implementar validação estrita (Zod) e garantir que a criação de *Transactions* ocorra de forma transacional com a API do Asaas.
- Refinar a trilha de auditoria na tabela `split_audit` para não haver divergência de centavos na taxa de 10%.

---

## ⚡ 3. Arquitetura e Code Quality

### Web (Next.js)
- **Formulários Vazios:** O formulário público "Seja Parceiro" (`/seja-parceiro/page.tsx`) simula um tempo de rede e exibe sucesso sem salvar nada no banco. Isso gera perda de *leads*.
- **Tailwind Quebrado:** Classes CSS com espaçamentos incorretos no checkout (ex: `flex - 1` ao invés de `flex-1`) quebram a responsividade no mobile web.
- **Erros Silenciosos:** Vários `try/catch` vazios ou que apenas imprimem erro no console, ocultando falhas de conexão dos usuários (ex: upload de vídeos e atualizações de perfil no Dashboard/Master).

### Mobile (React Native)
- **Telas 100% Mockadas:** Telas vitais como `ClassScreen` e `LibraryScreen` utilizam URLs de vídeo estáticas (`test-streams.mux.dev`) e textos fixos ("Jonathan Ferreira", "Módulo 02", "Bounces & Grooves Essenciais").
- **Ausência de Tratamento de Erro:** No `AuthContext.js`, a função `fetchProfile` não possui `try/catch`. Se houver falha de rede, a variável `profile` fica nula, quebrando telas que dependem dela.
- **Botões Mortos:** Ícones de Curtir, Avaliar, Compartilhar e Seguir não possuem função `onPress`.

### Recomendação Imediata:
- Conectar o App Mobile à API Real e ao banco do Supabase, substituindo os dados estáticos por queries reais.
- Implementar as ações (endpoints de API ou Supabase Functions) para os formulários de *leads* e salvar os dados.

---

## 🎨 4. Performance e UX

- **Proteção Anti-Pirataria:** Ótima iniciativa no Mobile usando `expo-screen-capture` (`usePreventScreenCapture`). Precisa ser estendido para DRM no web via HLS do Bunny.net.
- **Loading States:** No checkout, o componente de botão fica "Processando..." o que é ótimo, mas se o Asaas demorar mais que o normal, o usuário não tem feedback claro. É necessário gerenciar tempos de espera mais longos (Timeout).
- **Gamificação e XP:** A barra de energia e cálculos de XP só existem no UI e não persistem corretamente no backend.

---

## 🚀 5. Plano de Ação para o Lançamento (Até final de Março)

Para garantirmos o prazo, dividimos as correções em 2 estágios. Focaremos no Estágio 1 imediatamente.

### Estágio 1 (MVP - Bloqueadores de Lançamento)
1. **Refatorar API de Checkout:** Finalizar integração Asaas, garantir o split de pagamentos (90/10) de forma precisa e lidar com erros.
2. **Corrigir Webhooks do Asaas:** Garantir que o aluno só receba acesso após a confirmação (`PAYMENT_RECEIVED`).
3. **Consertar Mobile App (Player e Library):** Conectar a lista de cursos comprados e o player de vídeo do Bunny.net com dados reais da conta do aluno.
4. **Formulário de Leads:** Salvar as submissões de parceiros no banco de dados.
5. **Corrigir Layouts Críticos:** Ajustar as classes Tailwind quebradas no Checkout e remover botões/páginas que não funcionam.

### Estágio 2 (V2 - Melhorias Pós-Lançamento)
- Implementar o painel da Xtore (Marketplace físico).
- Integração de cálculo de frete real (Melhor Envio).
- Sistema de Certificados automáticos (Geração de PDF).
- Funcionalidades completas do App Master (gestão administrativa avançada).

---

## 🏁 Próximos Passos

O relatório confirma e estende as necessidades do `AUDIT-REPORT`. A base está excelente, mas precisamos "ligar os fios" das partes cruciais (Pagamento e Consumo de Vídeo).

Se aprovado, o plano de ação é iniciar imediatamente pelas correções do **Estágio 1**.
