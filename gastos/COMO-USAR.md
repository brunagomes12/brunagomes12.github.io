# Gastos — como usar

App para categorizar os gastos do cartão de crédito, ver quanto foi para cada
categoria mês a mês e enxergar as parcelas que ainda vão cair.

**Endereço:** https://brunagomes12.github.io/gastos/

Não precisa instalar nada nem criar conta. Abre no navegador do celular ou do
computador e já funciona.

---

## O mais importante: onde ficam os seus dados

Os gastos ficam **guardados só no navegador do aparelho em que você usa o app**.
Nada é enviado para nenhum servidor — nem para o GitHub, nem para mim, nem para
ninguém. Isso é bom para a privacidade, mas tem duas consequências práticas:

1. **O celular e o computador não conversam entre si.** Se você lançar no
   celular, não aparece no computador. Escolha um aparelho para ser "o oficial".
2. **Se você limpar os dados do navegador, os gastos somem.** Por isso existe o
   botão **Baixar backup** em *Ajustes*: ele salva um arquivo com tudo. Faça isso
   de vez em quando (uma vez por mês já resolve) e guarde o arquivo no Drive.
   Para voltar, é **Restaurar backup** e escolher o arquivo.

O endereço é público (qualquer pessoa com o link abre a página), mas **os seus
gastos não são** — quem abrir vê o app vazio, porque os dados estão no seu
aparelho, não na página.

---

## Deixar na tela de início do celular

Vale muito a pena, fica com cara de aplicativo:

- **iPhone (Safari):** abra o endereço → botão de compartilhar → *Adicionar à
  Tela de Início*.
- **Android (Chrome):** abra o endereço → menu dos três pontinhos →
  *Adicionar à tela inicial*.

---

## As cinco abas

### Mês
O painel do mês. Mostra o total daquela fatura, quanto subiu ou caiu em relação
ao mês anterior, o gasto por categoria e a lista de tudo que entrou.
Use as setas ‹ › para andar entre os meses.

Toque em qualquer lançamento para editar ou apagar.

### Relatórios
A visão longa: média por mês, evolução mês a mês e o ranking de categorias.
Os dois filtros de cima (período e categoria) valem para tudo que está abaixo
deles. Escolha uma categoria para responder coisas como "quanto eu gasto de
delivery por mês, de verdade?".

### Parcelas futuras
Quanto das próximas faturas já está comprometido antes de você gastar qualquer
coisa nova, mês a mês, e a lista das compras parceladas em andamento (quantas
já foram, quantas faltam, até quando).

### Importar
Para não digitar 60 linhas na mão. Explicado abaixo.

### Ajustes
Backup, cartões, categorias, o que o app aprendeu e o tema (claro/escuro).

---

## Lançar um gasto

Botão **＋ Novo gasto**, sempre visível.

- **O que foi** — escreva do jeito que aparece na fatura. Enquanto você digita,
  o app já sugere a categoria.
- **Valor** — pode digitar `89,90` ou `1.250,00`. Logo abaixo você diz se esse
  valor **é o total** da compra ou **é o de cada parcela**; o app faz a conta.
- **Parcelas** — os botõezinhos (à vista, 2×, 3×, 6×, 10×, 12×) são atalhos.
  Assim que você preenche, aparece uma linha explicando exatamente em quais
  faturas aquilo vai cair.
- **Entra na fatura de** — o app preenche sozinho. Só mexa se o banco jogou a
  compra para outra fatura.

## Como o app adivinha a categoria

Duas fontes, nessa ordem:

1. **O que você já ensinou.** Toda vez que você corrige a categoria de um gasto,
   ele guarda a dica e acerta sozinho na próxima. Dá para ver e apagar essas
   regras em *Ajustes → O que o app aprendeu*.
2. **Uma lista embutida** de estabelecimentos comuns no Brasil (iFood, Uber,
   drogarias, postos, supermercados, streamings, companhias aéreas e por aí).

Se ele errar, é só trocar no seletor — a correção vira aprendizado.

---

## Importar a fatura de uma vez

1. No app ou no site do banco, selecione as linhas da fatura e copie.
2. Aqui, aba **Importar**: escolha o cartão, confirme de que mês é a fatura e
   cole tudo na caixa de texto.
3. **Analisar**. O app monta uma lista com data, descrição, valor, parcela e um
   palpite de categoria para cada linha.
4. Confira, ajuste o que estiver errado, desmarque o que não quiser e
   **Importar**.

Formatos que ele entende (não precisa arrumar nada antes):

```
12/08  IFOOD *RESTAURANTE            45,90
03/08 DROGARIA SAO PAULO         R$ 89,00
21/07;MAGAZINE LUIZA PARC 03/10;129,90
2026-08-05,Netflix.com,55.90
09/08	POSTO IPIRANGA	250,00
```

Detalhes que ele resolve sozinho:

- **Cabeçalhos, totais e "pagamento efetuado" são descartados.**
- **Estornos e créditos** (valores negativos) entram desmarcados — se você
  quiser registrar, é só marcar.
- **Parcelas.** Se a linha diz `03/10`, ele entende que essa compra começou dois
  meses atrás e monta a compra inteira: as parcelas passadas entram no histórico
  e as sete que faltam aparecem em *Parcelas futuras*.
- **Repetição.** Se você importar a mesma fatura duas vezes, ou importar
  fevereiro depois de março, as linhas já registradas aparecem marcadas como
  *já lançado* e vêm desmarcadas. Não dá para duplicar sem querer.

---

## Dia de fechamento do cartão

Em *Ajustes → Cartões* dá para informar o dia em que a sua fatura fecha
(por exemplo, 20). A partir daí, uma compra feita no dia 25 vai automaticamente
para a fatura do mês seguinte, que é como o cartão funciona de verdade.

Se você deixar em branco, cada compra entra na fatura do próprio mês — mais
simples, e suficiente se você não se importa com esse detalhe.

Dá para cadastrar mais de um cartão.

---

## Categorias

Vêm 16 prontas. Em *Ajustes → Categorias* você renomeia, troca o ícone, cria
novas e apaga as que não usa (os gastos da categoria apagada vão para "Outros",
nada se perde).

---

## Para quem for mexer no código

Site estático, sem build e sem dependências: `index.html`, `app.css`, `app.js`.
Basta abrir o `index.html` no navegador para testar. Os dados ficam no
`localStorage`, na chave `gastos.v1`.

Valores são guardados **em centavos, como número inteiro**, para não sofrer com
arredondamento de ponto flutuante. Cada compra é um registro só — as parcelas
são calculadas na hora (`parcelasDe`), o que mantém editar e apagar simples.
