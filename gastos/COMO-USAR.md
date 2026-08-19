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

## Instalar como aplicativo

O Gastos é um **PWA**: um site que o celular instala e trata como aplicativo de
verdade. Instalado, ele abre em tela cheia (sem barra de navegador), tem ícone
próprio e **funciona sem internet**.

- **Android (Chrome):** vá em *Ajustes → Instalar no aparelho* e toque em
  **Instalar app**. Se o botão não aparecer, use o menu dos três pontinhos →
  *Instalar aplicativo*.
- **iPhone / iPad:** precisa ser pelo **Safari**. Botão de compartilhar (o
  quadrado com a seta para cima) → *Adicionar à Tela de Início* → *Adicionar*.
  No Chrome do iPhone essa opção não existe.
- **Computador:** o ícone de instalar no canto direito da barra de endereço.

### Funciona no avião

Depois da primeira visita, o app inteiro fica guardado no aparelho. Dá para
lançar gastos no metrô, no avião ou no meio do nada — nada aqui depende de
internet, porque os dados nunca saem do seu aparelho de qualquer forma.

### Atalhos do ícone

Segure o ícone do app na tela de início: aparecem atalhos para **Novo gasto**,
**Importar fatura** e **Parcelas futuras**, que já abrem na tela certa.

### Como ele se atualiza

Quando eu publicar uma versão nova, ela **não entra sozinha no meio do seu uso**.
Aparece uma faixa embaixo dizendo *"Uma versão nova do app está pronta"* com um
botão **Atualizar** — você troca na hora que quiser. Se ignorar, continua na
versão atual e o aviso volta depois.

Nenhuma atualização mexe nos seus dados.

---

## As seis abas

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

### Eventos
Um agrupador que atravessa categorias: uma viagem, uma reforma, uma festa.
Explicado abaixo.

### Parcelas
Quanto das próximas faturas já está comprometido antes de você gastar qualquer
coisa nova, mês a mês, e a lista das compras parceladas em andamento (quantas
já foram, quantas faltam, até quando).

### Importar
Para não digitar 60 linhas na mão. Explicado abaixo.

### Ajustes
Backup, cartões, categorias, o que o app aprendeu e o tema (claro/escuro).

---

## Eventos

Categoria responde "em que tipo de coisa eu gasto". Evento responde **"quanto
me custou aquilo"** — e "aquilo" quase sempre está espalhado por várias
categorias e vários meses.

A viagem ao Chile tem passagem (Viagem), jantar (Restaurante), passeio (Lazer) e
presentes (Presentes), em três faturas diferentes por causa do parcelamento.
Como evento, tudo isso vira **um número só**.

### Criar

Aba **Eventos → + Novo evento**. Peça: ícone, nome, data de início e fim
(opcionais) e um orçamento (opcional).

As datas fazem o trabalho pesado: **todo gasto lançado dentro daquele período já
vem marcado com o evento**, sem você precisar lembrar. Se não quiser, é só
trocar para "Nenhum" no formulário.

O orçamento vira uma barrinha mostrando quanto do previsto já foi. Quando passa
de 90% ela avisa, e quando estoura mostra em quanto estourou.

### Vincular gastos que já existem

Dentro do evento, **📎 Vincular gastos existentes**. Se o evento tem datas, ele
já abre com tudo daquele período marcado — você só desmarca o que não for.
Também dá para buscar por nome e marcar manualmente.

### O que o evento mostra

- **Custo total** — o valor cheio das compras, incluindo as parcelas que ainda
  vão cair. É quanto aquilo custou, não quanto entrou numa fatura.
- **Já pago** e **ainda a pagar** — a divisão entre o que passou e o que vem.
- **Em que foi gasto** — as categorias dentro do evento.
- **Como se espalha pelas faturas** — em que meses aquilo cai.

### Onde mais o evento aparece

- Na **lista do mês**, cada gasto vinculado leva um selinho com o nome do evento.
- Em **Relatórios**, o filtro *Evento* faz tudo em cima responder por ele. Tem
  também a opção *Fora de eventos*, útil para ver o gasto "normal" do mês sem a
  reforma distorcendo a média.
- Na **importação**, dá para vincular a fatura inteira a um evento de uma vez —
  ou deixar em "detectar pela data", que usa o período do evento.

**Apagar um evento não apaga gasto nenhum.** Os lançamentos continuam lá, apenas
deixam de estar vinculados.

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
- **Evento** — se a data da compra cair dentro do período de um evento, ele já
  vem escolhido. Dá para trocar ou deixar sem evento.
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
3. **Analisar**. O app monta uma lista com data, descrição, valor, parcela,
   evento e um palpite de categoria para cada linha. Se a fatura inteira for de
   uma viagem, escolha o evento no seletor de cima e vale para todas.
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

Categoria é "que tipo de gasto" (mercado, transporte); evento é "de que
acontecimento faz parte" (a viagem, a reforma). Todo gasto tem uma categoria e,
opcionalmente, um evento.

Vêm 16 prontas. Em *Ajustes → Categorias* você renomeia, troca o ícone, cria
novas e apaga as que não usa (os gastos da categoria apagada vão para "Outros",
nada se perde).

---

## Para quem for mexer no código

Site estático, sem build e sem dependências: `index.html`, `app.css`, `app.js`,
mais `sw.js`, `manifest.webmanifest` e `icons/`.
Basta abrir o `index.html` no navegador para testar — o service worker só entra
em contexto seguro (`https`, `localhost` ou `127.0.0.1`), então abrir do disco
não registra nada e não atrapalha o desenvolvimento. Para testar o PWA:
`python3 -m http.server 8765` e abrir `http://127.0.0.1:8765/gastos/`.

**Ao publicar mudança, bump o `VERSAO` no topo do `sw.js`.** É isso que troca o
nome do cache, limpa o antigo e dispara o aviso de atualização. Os dados ficam no
`localStorage`, na chave `gastos.v1`.

Valores são guardados **em centavos, como número inteiro**, para não sofrer com
arredondamento de ponto flutuante. Cada compra é um registro só — as parcelas
são calculadas na hora (`parcelasDe`), o que mantém editar e apagar simples.

Categoria e evento são dimensões independentes do mesmo lançamento
(`l.cat` e `l.evento`). Relatórios de fatura somam **ocorrências** (parcelas que
caem num mês); relatórios de evento somam o **valor cheio** da compra — são
perguntas diferentes, então são contas diferentes.
