# Bruna Gomes — Portfólio / Currículo

Site pessoal de **Bruna Gomes**, Senior Product Manager (E-commerce, Checkout & Pagamentos · LatAm).

🔗 **https://brunagomes12.github.io/**

## O que é

Página única, impact-first, bilíngue (PT/EN), sem build e sem dependências.
Todo o conteúdo e a lógica vivem em um arquivo: [`index.html`](index.html).

- **Toggle PT/EN** (a escolha persiste no `localStorage`)
- **Responsivo** (mobile-first) e **acessível** (contraste AA, navegável por teclado, respeita `prefers-reduced-motion`)
- **Print-safe**: `Cmd/Ctrl + P` gera um PDF limpo
- Tipografia Fraunces + Inter · paleta papel quente + vinho `#9A2B4F`

## Como editar

1. Abra `index.html` e edite o objeto `I18N` (textos PT e EN num só lugar).
2. Teste localmente abrindo o arquivo no navegador (duplo clique).
3. Publique:
   ```bash
   git commit -am "atualiza conteúdo"
   git push
   ```
   O GitHub Pages republica sozinho em ~1 min.

## Também neste repositório

`gastos/` — app pessoal para categorizar os gastos do cartão de crédito, com
relatórios mensais, eventos (viagem, reforma) e projeção de parcelas futuras.
PWA instalável e offline-first, estático e sem build; os dados ficam no
`localStorage` do navegador (nada trafega). Não é linkado do
portfólio e está fora dos buscadores (`noindex` + `robots.txt`).
Guia de uso: [`gastos/COMO-USAR.md`](gastos/COMO-USAR.md).

## Stack

HTML + CSS + JS puro. Fontes via Google Fonts. Hospedado no GitHub Pages.

Spec do design: [`docs/superpowers/specs/2026-06-20-resume-portfolio-design.md`](docs/superpowers/specs/2026-06-20-resume-portfolio-design.md).
