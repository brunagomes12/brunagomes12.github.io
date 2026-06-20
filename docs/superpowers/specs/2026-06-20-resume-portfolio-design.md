# Portfólio / Currículo Web — Bruna Gomes

**Data:** 2026-06-20 · **Fonte de conteúdo:** Profile.pdf (LinkedIn)

## Objetivo
Página web única (currículo + portfólio) para Bruna Gomes, Senior Product Manager,
impact-first, bilíngue (PT/EN), publicada no GitHub Pages.

## Direção visual
- Impact-first (inspirado em kanesherwell.com): nome grande + stat-callouts flutuantes.
- Toque feminino sofisticado, sênior (não infantil).
- Paleta: fundo ivory/blush `#FBF7F4`; acento berry `#9B2D5E`; rosé `#E8C4C4`;
  gradiente ameixa→coral nos detalhes; tinta `#2A2228`.
- Tipografia: Fraunces (display serif) + Inter (corpo), via Google Fonts.
- Acessível: contraste AA, navegável por teclado, `prefers-reduced-motion`, responsivo mobile-first.

## Estrutura (single page)
1. Hero — nome, cargo, 1 linha de posicionamento, 3 stat-callouts (6 anos · Conversão +2 dígitos · LatAm BR & CO).
2. Sobre — resumo (modernizar legado, jornadas transacionais de alto impacto).
3. Impacto em destaque — 4 cards problema→ação→resultado:
   checkout Flutter + PIX · rollback antifraude Black Friday · correção legado em pedidos · cultura App-First.
4. Experiência — timeline (Dafiti, BEYOND, dti digital, Agência Zetta, UFLA, Comp Júnior, GDG).
5. Skills & Certificações — chips.
6. Contato — email + LinkedIn.
- Toggle PT/EN fixo; textos num objeto JS, troca sem reload; persiste em localStorage.

## Tech
- 1 arquivo `index.html`, CSS+JS inline. Zero dependências, zero build.

## Deploy
- `git init` → repo público via `gh` (conta brunagomes12) → GitHub Pages → link público.

## Fora de escopo (YAGNI)
- CMS, blog, múltiplas páginas, framework, formulário de contato com backend, analytics.
