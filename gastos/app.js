/* ============================================================
   Gastos — cartão de crédito
   App estático, sem build e sem servidor. Tudo roda no navegador
   e os dados ficam no localStorage deste dispositivo.
   ============================================================ */
'use strict';

/* ---------------------------------------------------------- *
 * 1. Utilidades
 * ---------------------------------------------------------- */

const $ = (sel, root = document) => root.querySelector(sel);

/** Cria um elemento. Texto sempre via textContent — nunca innerHTML com dado do usuário. */
function h(tag, props, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  append(n, kids);
  return n;
}
const NS = 'http://www.w3.org/2000/svg';
function s(tag, props, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'class') n.setAttribute('class', v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, String(v));
  }
  append(n, kids);
  return n;
}
function append(n, kids) {
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false || kid === '') continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad2 = (n) => String(n).padStart(2, '0');

/* --- dinheiro (sempre em centavos, inteiro) --- */
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmt = (cents) => brl.format((cents || 0) / 100);
const fmtShort = (cents) => {
  const v = (cents || 0) / 100;
  if (Math.abs(v) >= 1000) return brlCompact.format(v);
  return brl.format(v);
};

/** Aceita "R$ 1.234,56", "1234.56", "45,90", "(12,00)", "45,90-". Devolve centavos ou null. */
function parseMoney(input) {
  if (input == null) return null;
  if (typeof input === 'number') return Math.round(input * 100);
  let str = String(input).trim().replace(/R\$/gi, '').replace(/[\s ]/g, '');
  if (!str) return null;
  let neg = false;
  if (/^\(.+\)$/.test(str)) { neg = true; str = str.slice(1, -1); }
  if (str.startsWith('-')) { neg = true; str = str.slice(1); }
  if (str.endsWith('-')) { neg = true; str = str.slice(0, -1); }
  if (!/^[\d.,]+$/.test(str)) return null;
  const last = Math.max(str.lastIndexOf(','), str.lastIndexOf('.'));
  let normalized;
  if (last === -1) {
    normalized = str;
  } else {
    const tail = str.slice(last + 1);
    if (tail.length <= 2) {
      // o último separador é o decimal
      normalized = str.slice(0, last).replace(/[.,]/g, '') + '.' + tail;
    } else {
      // todos os separadores são de milhar
      normalized = str.replace(/[.,]/g, '');
    }
  }
  const v = Number(normalized);
  if (!isFinite(v)) return null;
  return Math.round(v * 100) * (neg ? -1 : 1);
}

/* --- datas e meses ("YYYY-MM") --- */
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const ymOf = (iso) => String(iso).slice(0, 7);
const ymNow = () => ymOf(todayISO());
function ymAdd(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${pad2((t % 12) + 1)}`;
}
function ymDiff(a, b) { // quantos meses de b até a
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (ya * 12 + ma) - (yb * 12 + mb);
}
function ymRange(from, count) {
  return Array.from({ length: count }, (_, i) => ymAdd(from, i));
}
function ymDate(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
}
const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const ymLong = (ym) => ymDate(ym).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const ymShort = (ym) => ymDate(ym).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
const ymShortYear = (ym) => `${ymShort(ym)}/${ym.slice(2, 4)}`;
function dateLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}
function dateFull(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Texto sem acento, minúsculo — base da categorização automática. */
const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/* ---------------------------------------------------------- *
 * 2. Dados
 * ---------------------------------------------------------- */

const DB_KEY = 'gastos.v1';

const CATEGORIAS_PADRAO = [
  { id: 'mercado',    emoji: '🛒', nome: 'Mercado' },
  { id: 'alimentacao',emoji: '🍔', nome: 'Restaurante e delivery' },
  { id: 'transporte', emoji: '🚗', nome: 'Transporte' },
  { id: 'casa',       emoji: '🏠', nome: 'Casa' },
  { id: 'saude',      emoji: '💊', nome: 'Saúde' },
  { id: 'cuidados',   emoji: '💅', nome: 'Cuidados pessoais' },
  { id: 'vestuario',  emoji: '👗', nome: 'Roupas e acessórios' },
  { id: 'lazer',      emoji: '🎬', nome: 'Lazer' },
  { id: 'assinaturas',emoji: '📺', nome: 'Assinaturas' },
  { id: 'educacao',   emoji: '📚', nome: 'Educação' },
  { id: 'viagem',     emoji: '✈️', nome: 'Viagem' },
  { id: 'pets',       emoji: '🐾', nome: 'Pets' },
  { id: 'presentes',  emoji: '🎁', nome: 'Presentes' },
  { id: 'trabalho',   emoji: '💼', nome: 'Trabalho' },
  { id: 'taxas',      emoji: '🧾', nome: 'Taxas e tarifas' },
  { id: 'outros',     emoji: '❓', nome: 'Outros' },
];

/** Palavras que identificam o estabelecimento → categoria. */
const DICIONARIO = {
  mercado: ['supermercado', 'mercado', 'hortifruti', 'sacolao', 'atacadao', 'assai', 'carrefour', 'pao de acucar', 'extra ', 'supermercado dia', 'zona sul', 'oba ', 'st marche', 'mambo', 'natural da terra', 'emporio', 'padaria', 'acougue', 'quitanda', 'minuto', 'tenda atacado', 'sams club', 'makro', 'big box'],
  alimentacao: ['ifood', 'rappi', 'ubereats', 'uber eats', 'restaurante', 'lanchonete', 'pizzaria', 'burger', 'mcdonald', 'bk ', 'burger king', 'subway', 'outback', 'starbucks', 'cafe', 'cafeteria', 'bar ', 'boteco', 'sushi', 'temaki', 'churrascaria', 'espetinho', 'doceria', 'sorveteria', 'acai', 'habib', 'giraffas', 'divino fogao', 'coco bambu', 'madero', 'delivery'],
  transporte: ['uber', '99app', '99 app', '99pop', 'cabify', 'taxi', 'posto ', 'ipiranga', 'shell', 'petrobras', 'br mania', 'combustivel', 'gasolina', 'etanol', 'estacionamento', 'zul ', 'estapar', 'pedagio', 'sem parar', 'conectcar', 'veloe', 'metro', 'cptm', 'bilhete unico', 'onibus', 'rodoviaria', 'localiza', 'movida', 'unidas', 'oficina', 'autopecas', 'pneu', 'lavagem', 'ipva', 'detran'],
  casa: ['magazine luiza', 'magalu', 'casas bahia', 'ponto frio', 'fast shop', 'eletro', 'leroy', 'telhanorte', 'c&c', 'obramax', 'casa e construcao', 'tok stok', 'mobly', 'madeiramadeira', 'camicado', 'havan', 'ikea', 'eletricista', 'encanador', 'faxina', 'diarista', 'condominio', 'aluguel', 'enel', 'cpfl', 'light ', 'sabesp', 'comgas', 'internet', 'vivo ', 'claro ', 'tim ', 'oi fibra', 'net ', 'iptu'],
  saude: ['drogaria', 'farmacia', 'droga raia', 'drogasil', 'pacheco', 'panvel', 'pague menos', 'ultrafarma', 'hospital', 'clinica', 'laboratorio', 'fleury', 'dasa', 'delboni', 'einstein', 'sirio', 'dentista', 'odonto', 'psicolog', 'terapia', 'exame', 'consulta', 'unimed', 'amil', 'bradesco saude', 'sulamerica', 'porto saude', 'oculos', 'otica'],
  cuidados: ['salao', 'cabeleireiro', 'barbearia', 'manicure', 'esteti', 'spa ', 'depilacao', 'sephora', 'boticario', 'natura', 'avon', 'quem disse berenice', 'mac ', 'beleza na web', 'epoca cosmeticos', 'perfumaria'],
  vestuario: ['renner', 'c&a', 'riachuelo', 'zara', 'hering', 'marisa', 'shein', 'shopee', 'aliexpress', 'nike', 'adidas', 'centauro', 'decathlon', 'netshoes', 'dafiti', 'arezzo', 'schutz', 'melissa', 'farm ', 'animale', 'reserva', 'lojas americanas', 'calcados', 'sapataria'],
  lazer: ['cinema', 'cinemark', 'kinoplex', 'uci ', 'teatro', 'ingresso', 'ticketmaster', 'sympla', 'eventim', 'show ', 'parque', 'boliche', 'academia', 'smartfit', 'bluefit', 'bodytech', 'pilates', 'crossfit', 'natacao', 'livraria', 'saraiva', 'cultura', 'steam', 'playstation', 'xbox', 'nintendo', 'jogo'],
  assinaturas: ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'globoplay', 'paramount', 'apple.com', 'apple servi', 'itunes', 'icloud', 'google one', 'youtube premium', 'deezer', 'kindle', 'audible', 'canva', 'adobe', 'microsoft', 'office 365', 'chatgpt', 'openai', 'anthropic', 'claude', 'notion', 'dropbox', 'assinatura', 'mensalidade'],
  educacao: ['faculdade', 'universidade', 'curso', 'escola', 'colegio', 'udemy', 'alura', 'coursera', 'pm3', 'hotmart', 'workshop', 'certificacao', 'material escolar', 'mensalidade escolar'],
  viagem: ['latam', 'gol ', 'azul ', 'smiles', 'decolar', 'booking', 'airbnb', 'hotel', 'pousada', 'hostel', '123milhas', 'maxmilhas', 'cvc', 'aeroporto', 'seguro viagem', 'passagem'],
  pets: ['petz', 'cobasi', 'petlove', 'veterinar', 'pet shop', 'petshop', 'racao', 'banho e tosa'],
  presentes: ['presente', 'floricultura', 'flores', 'cesta'],
  trabalho: ['coworking', 'wework', 'impressao', 'papelaria', 'kalunga'],
  outros: ['mercado livre', 'mercadolivre', 'mercado pago', 'mercadopago', 'mercadolibre', 'paypal', 'picpay', 'pagseguro'],
  taxas: ['anuidade', 'tarifa', 'juros', 'iof', 'multa', 'encargos', 'seguro cartao', 'protecao'],
};

const DB_PADRAO = () => ({
  version: 1,
  cartoes: [{ id: 'principal', nome: 'Meu cartão', fechamento: null }],
  categorias: CATEGORIAS_PADRAO.map((c) => ({ ...c })),
  eventos: [],         // viagem, reforma, festa… um agrupador que atravessa categorias
  lancamentos: [],
  regras: {},          // { termoNormalizado: categoriaId } — aprendizado
  prefs: { tema: 'auto', ultimoBackup: null },
});

let db = carregar();

function carregar() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return DB_PADRAO();
    const parsed = JSON.parse(raw);
    const base = DB_PADRAO();
    return {
      ...base, ...parsed,
      cartoes: Array.isArray(parsed.cartoes) && parsed.cartoes.length ? parsed.cartoes : base.cartoes,
      categorias: Array.isArray(parsed.categorias) && parsed.categorias.length ? parsed.categorias : base.categorias,
      eventos: Array.isArray(parsed.eventos) ? parsed.eventos : [],
      lancamentos: Array.isArray(parsed.lancamentos) ? parsed.lancamentos : [],
      regras: parsed.regras && typeof parsed.regras === 'object' ? parsed.regras : {},
      prefs: { ...base.prefs, ...(parsed.prefs || {}) },
    };
  } catch (e) {
    console.error('Não consegui ler os dados salvos:', e);
    return DB_PADRAO();
  }
}

function salvar() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error(e);
    toast('Não consegui salvar. O armazenamento do navegador pode estar cheio.');
  }
}

const catPorId = (id) => db.categorias.find((c) => c.id === id) || { id: 'outros', emoji: '❓', nome: 'Sem categoria' };
const cartaoPorId = (id) => db.cartoes.find((c) => c.id === id) || db.cartoes[0];
const eventoPorId = (id) => (id ? db.eventos.find((e) => e.id === id) || null : null);

/** Evento cujo período engloba essa data — é o que o app sugere sozinho. */
function eventoNaData(dataISO) {
  return db.eventos.find((e) => e.inicio && e.fim && dataISO >= e.inicio && dataISO <= e.fim) || null;
}

const lancamentosDoEvento = (id) => db.lancamentos.filter((l) => l.evento === id);

/**
 * Um evento é medido pelo valor cheio das compras (o que a viagem custou),
 * e não pelo que caiu numa fatura — mas também mostramos quanto disso já
 * foi pago e quanto ainda vem pela frente em parcelas.
 */
function resumoEvento(ev) {
  const ls = lancamentosDoEvento(ev.id);
  const ocs = ocorrencias(ls);
  const hoje = ymNow();
  const total = ls.reduce((t, l) => t + l.cents, 0);
  const pago = somar(ocs.filter((o) => o.ym <= hoje));
  return {
    ls, ocs, total, pago,
    aPagar: total - pago,
    qtd: ls.length,
    primeiro: ls.length ? ls.reduce((m, l) => (l.data < m ? l.data : m), ls[0].data) : null,
    ultimo: ls.length ? ls.reduce((m, l) => (l.data > m ? l.data : m), ls[0].data) : null,
  };
}

/* ---------------------------------------------------------- *
 * 3. Regras de negócio: fatura, parcelas, ocorrências
 * ---------------------------------------------------------- */

/** Em que fatura cai uma compra, considerando o dia de fechamento do cartão. */
function faturaDe(dataISO, cartao) {
  const ym = ymOf(dataISO);
  const dia = Number(dataISO.slice(8, 10));
  if (cartao && cartao.fechamento && dia > Number(cartao.fechamento)) return ymAdd(ym, 1);
  return ym;
}

/** Divide o total em parcelas; a diferença de centavos vai na primeira (como fazem os bancos). */
function parcelasDe(l) {
  const n = Math.max(1, Number(l.parcelas) || 1);
  const base = Math.floor(l.cents / n);
  const resto = l.cents - base * n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ n: i + 1, de: n, ym: ymAdd(l.fatura, i), cents: base + (i === 0 ? resto : 0) });
  }
  return out;
}

/** Todas as parcelas de todos os lançamentos, achatadas. */
function ocorrencias(lista = db.lancamentos) {
  const out = [];
  for (const l of lista) for (const p of parcelasDe(l)) out.push({ l, ...p });
  return out;
}

const ocorrenciasDoMes = (ym, lista) => ocorrencias(lista).filter((o) => o.ym === ym);
const somar = (arr) => arr.reduce((t, o) => t + o.cents, 0);

/** Agrupa ocorrências por categoria, do maior para o menor. */
function porCategoria(ocs) {
  const mapa = new Map();
  for (const o of ocs) {
    const id = o.l.cat;
    mapa.set(id, (mapa.get(id) || 0) + o.cents);
  }
  return [...mapa.entries()]
    .map(([id, cents]) => ({ cat: catPorId(id), cents }))
    .sort((a, b) => b.cents - a.cents);
}

/** Meses que têm algum lançamento (do mais antigo ao mais novo). */
function mesesComDados() {
  const set = new Set(ocorrencias().map((o) => o.ym));
  return [...set].sort();
}

/* ---------------------------------------------------------- *
 * 4. Categorização automática
 * ---------------------------------------------------------- */

/** Chave de aprendizado: as primeiras palavras significativas da descrição. */
function chaveRegra(desc) {
  const limpo = norm(desc)
    .replace(/[*#]/g, ' ')
    .replace(/\b(parc|parcela|par)\s*\d+\s*\/\s*\d+\b/g, ' ')
    .replace(/\d+\s*\/\s*\d+/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return limpo.split(' ').filter((w) => w.length > 2).slice(0, 2).join(' ') || limpo;
}

/** Sugere uma categoria: primeiro o que ela já ensinou, depois o dicionário. */
function sugerirCategoria(desc) {
  if (!desc || !desc.trim()) return null;
  const t = norm(desc);

  const chave = chaveRegra(desc);
  if (chave && db.regras[chave]) return { catId: db.regras[chave], origem: 'aprendida' };

  for (const [termo, catId] of Object.entries(db.regras)) {
    if (termo.length > 3 && t.includes(termo)) return { catId, origem: 'aprendida' };
  }

  // o espaço no fim de alguns termos ("bar ", "tim ") é fronteira de palavra:
  // por isso comparamos contra o texto com um espaço extra no fim, sem aparar o termo.
  const alvo = t + ' ';
  let melhor = null;
  for (const [catId, termos] of Object.entries(DICIONARIO)) {
    if (!db.categorias.some((c) => c.id === catId)) continue;
    for (const termo of termos) {
      if (alvo.includes(termo) && (!melhor || termo.length > melhor.tamanho)) {
        melhor = { catId, origem: 'dicionario', tamanho: termo.length };
      }
    }
  }
  return melhor ? { catId: melhor.catId, origem: 'dicionario' } : null;
}

/** Guarda o que ela escolheu, para acertar sozinho da próxima vez. */
function aprender(desc, catId) {
  const chave = chaveRegra(desc);
  if (!chave || chave.length < 3) return;
  db.regras[chave] = catId;
}

/* ---------------------------------------------------------- *
 * 5. Peças de interface
 * ---------------------------------------------------------- */

let graficos = [];   // gráficos montados na tela atual (redesenhados no resize)

const tipEl = () => $('#tip');

function mostrarTip(ev, valor, rotulo, deemph) {
  const t = tipEl();
  t.replaceChildren(
    h('div', { class: 'tip-value', text: valor }),
    h('div', { class: 'tip-label' }, h('span', { class: 'key' + (deemph ? ' deemph' : '') }), h('span', { text: rotulo })),
  );
  t.classList.add('on');
  const r = t.getBoundingClientRect();
  const x = Math.min(Math.max(8, ev.clientX - r.width / 2), innerWidth - r.width - 8);
  const y = ev.clientY - r.height - 14 < 8 ? ev.clientY + 18 : ev.clientY - r.height - 14;
  t.style.left = x + 'px';
  t.style.top = y + 'px';
}
const esconderTip = () => tipEl().classList.remove('on');

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2600);
}

/** Cartão de gráfico com o par de acessibilidade: botão "ver tabela". */
function figura({ titulo, sub, acoes, grafico, tabela }) {
  const wrapT = h('div', { class: 'table-wrap', hidden: true }, tabela);
  const btn = h('button', {
    class: 'btn small ghost', type: 'button', 'aria-expanded': 'false',
    onclick: () => {
      const ver = wrapT.hidden;
      wrapT.hidden = !ver;
      btn.textContent = ver ? 'Ocultar tabela' : 'Ver tabela';
      btn.setAttribute('aria-expanded', String(ver));
    },
  }, 'Ver tabela');

  return h('figure', { class: 'card figure' },
    h('div', { class: 'card-head' },
      h('h2', { text: titulo }),
      h('div', { class: 'card-actions' }, acoes || [], tabela ? btn : null)),
    sub ? h('p', { class: 'card-sub', text: sub }) : null,
    grafico,
    wrapT,
  );
}

function tabelaSimples(colunas, linhas) {
  return h('table', { class: 'data' },
    h('thead', {}, h('tr', {}, colunas.map((c) => h('th', { class: c.num ? 'num' : null, text: c.t })))),
    h('tbody', {}, linhas.map((l) => h('tr', {}, l.map((v, i) =>
      h('td', { class: colunas[i].num ? 'num' : null, text: v }))))),
  );
}

function tile(label, valor, nota) {
  return h('div', { class: 'tile' },
    h('div', { class: 't-label', text: label }),
    h('div', { class: 't-value', text: valor }),
    nota ? h('div', { class: 't-note', text: nota }) : null);
}

/** Variação vs. período anterior. Gastar mais é ruim → vermelho. */
function deltaEl(atual, anterior, rotulo) {
  if (!anterior) return h('div', { class: 'delta flat' }, h('small', { text: 'sem base de comparação' }));
  const dif = atual - anterior;
  const pct = Math.round((dif / anterior) * 100);
  const dir = dif > 0 ? 'up' : dif < 0 ? 'down' : 'flat';
  const seta = dif > 0 ? '▲' : dif < 0 ? '▼' : '=';
  return h('div', { class: 'delta ' + dir },
    h('span', { class: 'arrow', text: seta }),
    h('span', { text: `${dif > 0 ? '+' : ''}${pct}%` }),
    h('small', { text: `${fmt(Math.abs(dif))} ${dif >= 0 ? 'a mais' : 'a menos'} que ${rotulo}` }));
}

function vazio(emoji, texto, botao) {
  return h('div', { class: 'empty' }, h('span', { class: 'e-emoji', text: emoji }), h('p', { text: texto }), botao || null);
}

/* ---------------------------------------------------------- *
 * 6. Gráficos
 * ---------------------------------------------------------- */

/**
 * Barras horizontais — uma série só (quanto se gastou), logo uma cor só.
 * Nome à esquerda, valor sempre visível à direita (nunca dentro da barra).
 */
function barrasH({ itens, aoClicar }) {
  const max = Math.max(1, ...itens.map((i) => i.cents));
  const total = itens.reduce((t, i) => t + i.cents, 0) || 1;

  return h('div', { class: 'bars' }, itens.map((it) => {
    const pct = Math.round((it.cents / total) * 100);
    const rotulo = `${it.nome} · ${pct}% do total`;
    const linha = h(aoClicar ? 'button' : 'div', {
      class: 'bar-row',
      type: aoClicar ? 'button' : null,
      onclick: aoClicar ? () => aoClicar(it) : null,
      onpointermove: (e) => mostrarTip(e, fmt(it.cents), rotulo),
      onpointerleave: esconderTip,
      onfocus: (e) => mostrarTip({ clientX: e.target.getBoundingClientRect().left + 60, clientY: e.target.getBoundingClientRect().top }, fmt(it.cents), rotulo),
      onblur: esconderTip,
    },
      h('span', { class: 'bar-name' }, it.emoji ? h('span', { 'aria-hidden': 'true', text: it.emoji }) : null, h('span', { text: it.nome })),
      h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: { width: Math.max(2, (it.cents / max) * 100) + '%' } })),
      h('span', { class: 'bar-value' }, fmt(it.cents), h('span', { class: 'bar-pct', text: pct + '%' })),
    );
    return linha;
  }));
}

function escalaBonita(v) {
  if (v <= 0) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * exp;
}
function eixoMoeda(cents) {
  const v = cents / 100;
  if (v >= 1000) return (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: v % 1000 === 0 ? 0 : 1 }) + ' mil';
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

/**
 * Colunas por mês. Forma "ênfase": o mês em foco na cor de dado,
 * os demais em cinza de de-ênfase (separados por luminosidade,
 * então continua legível em qualquer tipo de daltonismo).
 */
function colunasMes({ pontos, destaque, aoClicar }) {
  const box = h('div', { class: 'chart-host' });

  box.__draw = () => {
    const W = Math.max(280, box.clientWidth || 600);
    const padL = 46, padR = 6, padT = 24, plotH = 170, xBand = 22;
    const H = padT + plotH + xBand;
    const plotW = W - padL - padR;
    const max = escalaBonita(Math.max(...pontos.map((p) => p.cents), 1));
    const y = (c) => padT + plotH - (c / max) * plotH;
    const band = plotW / Math.max(1, pontos.length);
    const bw = Math.min(24, band * 0.6);
    const passo = band < 30 ? 2 : 1;

    const iMax = pontos.reduce((best, p, i) => (p.cents > pontos[best].cents ? i : best), 0);

    const g = s('svg', {
      class: 'chart-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H,
      role: 'img', 'aria-label': 'Gráfico de colunas por mês. Os mesmos valores estão na tabela abaixo.',
    });

    // grade + eixo Y (linhas contínuas, finas, discretas)
    for (const frac of [0, 0.5, 1]) {
      const cy = y(max * frac);
      g.append(s('line', { class: frac === 0 ? 'axis-line' : 'grid-line', x1: padL, x2: W - padR, y1: cy, y2: cy }));
      g.append(s('text', { class: 'tick-text', x: padL - 8, y: cy + 4, 'text-anchor': 'end', text: eixoMoeda(max * frac) }));
    }

    pontos.forEach((p, i) => {
      const cx = padL + band * i + (band - bw) / 2;
      const alt = Math.max(p.cents > 0 ? 2 : 0, (p.cents / max) * plotH);
      const topo = padT + plotH - alt;
      const on = p.ym === destaque;

      // alvo de toque generoso (a coluna fina não precisa ser acertada no pixel)
      const hit = s('rect', {
        class: 'hit', x: padL + band * i, y: padT, width: band, height: plotH,
        tabindex: '0', role: 'button',
        'aria-label': `${cap(ymLong(p.ym))}: ${fmt(p.cents)}`,
        onpointermove: (e) => mostrarTip(e, fmt(p.cents), cap(ymLong(p.ym)), !on),
        onpointerleave: esconderTip,
        onfocus: (e) => {
          const r = e.target.getBoundingClientRect();
          mostrarTip({ clientX: r.left + r.width / 2, clientY: r.top + 20 }, fmt(p.cents), cap(ymLong(p.ym)), !on);
        },
        onblur: esconderTip,
        onclick: aoClicar ? () => aoClicar(p) : null,
      });
      g.append(hit);

      if (alt > 0) {
        // ponta arredondada em cima, base quadrada na linha de base
        const r = Math.min(4, bw / 2, alt);
        const d = `M${cx} ${padT + plotH} L${cx} ${topo + r} Q${cx} ${topo} ${cx + r} ${topo} L${cx + bw - r} ${topo} Q${cx + bw} ${topo} ${cx + bw} ${topo + r} L${cx + bw} ${padT + plotH} Z`;
        g.append(s('path', { class: 'col' + (on ? ' on' : ''), d }));
      }

      // rótulo direto só no mês em foco e no maior — nunca em todos,
      // e só quando cabe sem encostar no vizinho
      if ((on || i === iMax) && p.cents > 0 && band >= 46) {
        g.append(s('text', {
          class: 'col-label', x: cx + bw / 2, y: topo - 7, 'text-anchor': 'middle',
          text: eixoMoeda(p.cents),
        }));
      }

      if (i % passo === 0 || on) {
        g.append(s('text', {
          class: 'x-text' + (on ? ' on' : ''), x: padL + band * i + band / 2,
          y: padT + plotH + 15, 'text-anchor': 'middle', text: ymShortYear(p.ym),
        }));
      }
    });

    box.replaceChildren(g);
  };

  graficos.push(box);
  return box;
}

/* ---------------------------------------------------------- *
 * 7. Formulário de lançamento
 * ---------------------------------------------------------- */

const estado = {
  rota: 'mes',
  ym: ymNow(),
  eventoAberto: null,
  busca: '',
  meses: 12,          // janela dos relatórios
  catFiltro: 'todas',
  evtFiltro: 'todos',
};

function fecharModal() {
  const d = $('#modal');
  if (d.open) d.close();
}

function abrirModal(conteudo) {
  const d = $('#modal');
  $('#modal-card').replaceChildren(conteudo);
  if (!d.open) d.showModal();
  // foco imediato: um focus() atrasado roubaria o foco de quem já começou a digitar
  const primeiro = $('#modal-card input, #modal-card select, #modal-card textarea');
  if (primeiro) primeiro.focus();
}

function selectEventos(id, valor, rotuloVazio = 'Nenhum — gasto avulso') {
  return h('select', { id },
    [h('option', { value: '', selected: !valor, text: rotuloVazio }),
    ...db.eventos.map((e) => h('option', { value: e.id, selected: e.id === valor, text: `${e.emoji} ${e.nome}` }))]);
}

function selectCategorias(valor) {
  return h('select', { id: 'f-cat', name: 'cat' },
    db.categorias.map((c) => h('option', { value: c.id, selected: c.id === valor, text: `${c.emoji} ${c.nome}` })));
}

function abrirLancamento(id) {
  const edicao = id ? db.lancamentos.find((l) => l.id === id) : null;
  const l = edicao || {
    desc: '', cents: 0, data: todayISO(), cat: '', cartao: db.cartoes[0].id,
    parcelas: 1, fatura: faturaDe(todayISO(), db.cartoes[0]), obs: '', evento: null,
  };

  let modoValor = 'total';
  let faturaTocada = !!edicao;

  const fDesc = h('input', { type: 'text', id: 'f-desc', value: l.desc, placeholder: 'Ex.: Supermercado Pão de Açúcar', autocomplete: 'off', required: true });
  const fValor = h('input', { type: 'text', id: 'f-valor', inputmode: 'decimal', value: edicao ? String((l.cents / 100).toFixed(2)).replace('.', ',') : '', placeholder: '0,00', required: true });
  const fParc = h('input', { type: 'number', id: 'f-parc', min: '1', max: '72', step: '1', value: String(l.parcelas || 1) });
  const fData = h('input', { type: 'date', id: 'f-data', value: l.data });
  const fCartao = h('select', { id: 'f-cartao' }, db.cartoes.map((c) => h('option', { value: c.id, selected: c.id === l.cartao, text: c.nome })));
  const fFatura = h('input', { type: 'month', id: 'f-fatura', value: l.fatura });
  const fObs = h('input', { type: 'text', id: 'f-obs', value: l.obs || '', placeholder: 'opcional' });
  const fEvento = selectEventos('f-evento', l.evento);
  fEvento.setAttribute('aria-describedby', 'dica-evento');
  const dicaEvento = h('div', { class: 'suggestion', id: 'dica-evento' });
  const fCat = selectCategorias(l.cat || 'outros');
  fCat.setAttribute('aria-describedby', 'dica-cat');

  const dicaSugestao = h('div', { class: 'suggestion', id: 'dica-cat' });
  const dicaParcela = h('p', { class: 'hint' });

  const modoBtns = h('div', { class: 'seg' },
    h('button', { type: 'button', 'aria-pressed': 'true', text: 'é o valor total', onclick: (e) => setModo('total', e) }),
    h('button', { type: 'button', 'aria-pressed': 'false', text: 'é o valor da parcela', onclick: (e) => setModo('parcela', e) }));

  function setModo(m, ev) {
    modoValor = m;
    [...modoBtns.children].forEach((b) => b.setAttribute('aria-pressed', String(b === ev.currentTarget)));
    atualizarDicas();
  }

  function totalEmCentavos() {
    const v = parseMoney(fValor.value);
    if (v == null) return null;
    const n = Math.max(1, Number(fParc.value) || 1);
    return modoValor === 'parcela' ? v * n : v;
  }

  function recalcFatura() {
    if (faturaTocada) return;
    fFatura.value = faturaDe(fData.value || todayISO(), cartaoPorId(fCartao.value));
  }

  function atualizarDicas() {
    const total = totalEmCentavos();
    const n = Math.max(1, Number(fParc.value) || 1);
    if (total == null) { dicaParcela.textContent = ''; return; }
    const parc = parcelasDe({ cents: total, parcelas: n, fatura: fFatura.value || ymNow() });
    if (n === 1) {
      dicaParcela.textContent = `Cai inteiro na fatura de ${ymLong(fFatura.value || ymNow())}.`;
    } else {
      const ult = parc[parc.length - 1];
      dicaParcela.textContent = `${n}× de ${fmt(parc[1] ? parc[1].cents : parc[0].cents)}` +
        (parc[0].cents !== parc[1].cents ? ` (a 1ª de ${fmt(parc[0].cents)})` : '') +
        ` · total ${fmt(total)} · da fatura de ${ymShortYear(parc[0].ym)} até ${ymShortYear(ult.ym)}.`;
    }
  }

  function atualizarEvento() {
    dicaEvento.replaceChildren();
    if (!db.eventos.length) return;
    const sug = eventoNaData(fData.value || todayISO());
    if (!sug) return;
    if (!fEvento.dataset.tocado && !edicao) fEvento.value = sug.id;
    if (fEvento.value === sug.id) {
      dicaEvento.append(document.createTextNode('A data cai dentro de '),
        h('b', { text: `${sug.emoji} ${sug.nome}` }));
    }
  }

  function atualizarSugestao() {
    const sug = sugerirCategoria(fDesc.value);
    dicaSugestao.replaceChildren();
    if (!sug) return;
    const c = catPorId(sug.catId);
    if (!fCat.dataset.tocado) fCat.value = sug.catId;
    dicaSugestao.append(
      document.createTextNode(sug.origem === 'aprendida' ? 'Você costuma marcar como ' : 'Sugestão: '),
      h('b', { text: `${c.emoji} ${c.nome}` }));
  }

  fDesc.addEventListener('input', atualizarSugestao);
  fCat.addEventListener('change', () => { fCat.dataset.tocado = '1'; });
  fEvento.addEventListener('change', () => { fEvento.dataset.tocado = '1'; atualizarEvento(); });
  fValor.addEventListener('input', atualizarDicas);
  fParc.addEventListener('input', atualizarDicas);
  fData.addEventListener('change', () => { recalcFatura(); atualizarDicas(); atualizarEvento(); });
  fCartao.addEventListener('change', () => { recalcFatura(); atualizarDicas(); });
  fFatura.addEventListener('change', () => { faturaTocada = true; atualizarDicas(); });

  const chips = h('div', { class: 'filters', style: { gap: '6px', margin: '6px 0 0' } },
    [1, 2, 3, 6, 10, 12].map((n) => h('button', {
      class: 'btn small', type: 'button', text: n === 1 ? 'à vista' : n + '×',
      onclick: () => { fParc.value = n; atualizarDicas(); },
    })));

  const form = h('form', { id: 'form-lanc', novalidate: true, onsubmit: (e) => { e.preventDefault(); guardar(); } },
    h('div', { class: 'form-grid' },
      h('div', { class: 'field full' }, h('label', { for: 'f-desc', text: 'O que foi?' }), fDesc, dicaSugestao),
      h('div', { class: 'field' }, h('label', { for: 'f-valor', text: 'Valor (R$)' }), fValor, modoBtns),
      h('div', { class: 'field' }, h('label', { for: 'f-parc', text: 'Parcelas' }), fParc, chips),
      h('div', { class: 'field full' }, h('label', { for: 'f-cat', text: 'Categoria' }), fCat),
      h('div', { class: 'field full' },
        h('label', { for: 'f-evento', text: 'Evento' }), fEvento, dicaEvento,
        db.eventos.length ? null : h('p', { class: 'hint', text: 'Você ainda não criou nenhum evento. Crie um na aba Eventos para juntar, por exemplo, tudo de uma viagem.' })),
      h('div', { class: 'field' }, h('label', { for: 'f-data', text: 'Data da compra' }), fData),
      h('div', { class: 'field' }, h('label', { for: 'f-cartao', text: 'Cartão' }), fCartao),
      h('div', { class: 'field' }, h('label', { for: 'f-fatura', text: 'Entra na fatura de' }), fFatura),
      h('div', { class: 'field' }, h('label', { for: 'f-obs', text: 'Observação' }), fObs),
      h('div', { class: 'full' }, dicaParcela),
    ));

  function guardar() {
    const desc = fDesc.value.trim();
    const total = totalEmCentavos();
    if (!desc) { fDesc.focus(); toast('Escreva o que foi o gasto.'); return; }
    if (total == null || total === 0) { fValor.focus(); toast('Informe um valor válido.'); return; }
    const dados = {
      id: edicao ? edicao.id : uid(),
      desc,
      cents: total,
      data: fData.value || todayISO(),
      cat: fCat.value,
      cartao: fCartao.value,
      parcelas: Math.min(72, Math.max(1, Number(fParc.value) || 1)),
      fatura: fFatura.value || faturaDe(fData.value || todayISO(), cartaoPorId(fCartao.value)),
      evento: fEvento.value || null,
      obs: fObs.value.trim(),
      criadoEm: edicao ? edicao.criadoEm : new Date().toISOString(),
    };
    if (edicao) Object.assign(edicao, dados);
    else db.lancamentos.push(dados);
    aprender(desc, dados.cat);
    salvar();
    fecharModal();
    estado.ym = dados.fatura;
    render();
    toast(edicao ? 'Gasto atualizado.' : 'Gasto lançado.');
  }

  function excluir() {
    if (!confirm(`Excluir "${edicao.desc}"? Isso apaga também as parcelas futuras dessa compra.`)) return;
    db.lancamentos = db.lancamentos.filter((x) => x.id !== edicao.id);
    salvar();
    fecharModal();
    render();
    toast('Gasto excluído.');
  }

  const card = h('div', {},
    h('div', { class: 'modal-head' },
      h('h2', { text: edicao ? 'Editar gasto' : 'Novo gasto' }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', text: '✕', onclick: fecharModal })),
    form,
    h('div', { class: 'modal-foot' },
      edicao ? h('button', { class: 'btn danger', type: 'button', text: 'Excluir', onclick: excluir }) : null,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'button', text: 'Cancelar', onclick: fecharModal }),
      h('button', { class: 'btn primary', type: 'submit', form: 'form-lanc', text: 'Salvar' })),
  );

  abrirModal(card);
  atualizarSugestao();
  atualizarEvento();
  atualizarDicas();
}

/* ---------------------------------------------------------- *
 * 8. Tela: Mês
 * ---------------------------------------------------------- */

function navegadorMes() {
  const ir = (n) => { estado.ym = ymAdd(estado.ym, n); render(); };
  return h('div', { class: 'month-nav' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Mês anterior', text: '‹', onclick: () => ir(-1) }),
    h('div', { class: 'now' }, cap(ymLong(estado.ym)),
      estado.ym !== ymNow() ? h('small', {}, h('button', {
        class: 'btn small ghost', type: 'button', text: 'voltar para o mês atual',
        onclick: () => { estado.ym = ymNow(); render(); },
      })) : h('small', { text: 'mês atual' })),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Próximo mês', text: '›', onclick: () => ir(1) }),
  );
}

function telaMes() {
  const ocs = ocorrenciasDoMes(estado.ym);
  const total = somar(ocs);
  const anterior = somar(ocorrenciasDoMes(ymAdd(estado.ym, -1)));
  const cats = porCategoria(ocs);
  const parcelados = ocs.filter((o) => o.de > 1);
  const view = [navegadorMes()];

  if (!db.lancamentos.length) {
    return [navegadorMes(), h('div', { class: 'card' },
      vazio('💳', 'Ainda não há nada por aqui. Lance o primeiro gasto ou cole a sua fatura de uma vez.',
        h('div', { class: 'filters', style: { justifyContent: 'center' } },
          h('button', { class: 'btn primary', type: 'button', text: 'Lançar um gasto', onclick: () => abrirLancamento() }),
          h('button', { class: 'btn', type: 'button', text: 'Importar fatura', onclick: () => irPara('importar') }))))];
  }

  // Resumo do mês — o número herói da tela
  view.push(h('div', { class: 'card' },
    h('div', { class: 'hero-label', text: `Total da fatura de ${ymLong(estado.ym)}` }),
    h('div', { class: 'hero-figure', text: fmt(total) }),
    deltaEl(total, anterior, ymLong(ymAdd(estado.ym, -1))),
    h('div', { class: 'tiles' },
      tile('Lançamentos', String(ocs.length), ocs.length === 1 ? 'uma linha na fatura' : 'linhas na fatura'),
      tile('Em parcelas', fmt(somar(parcelados)), `${parcelados.length} ${parcelados.length === 1 ? 'parcela' : 'parcelas'} caindo agora`),
      tile('À vista', fmt(total - somar(parcelados)), 'comprado e pago neste mês'),
      tile('Maior categoria', cats[0] ? fmt(cats[0].cents) : '—', cats[0] ? `${cats[0].cat.emoji} ${cats[0].cat.nome}` : 'sem gastos'),
    )));

  if (cats.length) {
    view.push(figura({
      titulo: 'Onde o dinheiro foi',
      sub: `Gasto por categoria em ${ymLong(estado.ym)}. Toque numa barra para ver só essa categoria nos relatórios.`,
      grafico: barrasH({
        itens: cats.map((c) => ({ key: c.cat.id, emoji: c.cat.emoji, nome: c.cat.nome, cents: c.cents })),
        aoClicar: (it) => { estado.catFiltro = it.key; irPara('relatorios'); },
      }),
      tabela: tabelaSimples(
        [{ t: 'Categoria' }, { t: 'Valor', num: true }, { t: '% do mês', num: true }],
        cats.map((c) => [`${c.cat.emoji} ${c.cat.nome}`, fmt(c.cents), Math.round((c.cents / (total || 1)) * 100) + '%'])),
    }));
  }

  view.push(listaLancamentos(ocs));
  return view;
}

function listaLancamentos(ocs) {
  const busca = norm(estado.busca);
  const filtradas = busca
    ? ocs.filter((o) => norm(o.l.desc).includes(busca) || norm(catPorId(o.l.cat).nome).includes(busca))
    : ocs;

  const porDia = new Map();
  for (const o of [...filtradas].sort((a, b) => (a.l.data < b.l.data ? 1 : -1))) {
    if (!porDia.has(o.l.data)) porDia.set(o.l.data, []);
    porDia.get(o.l.data).push(o);
  }

  const campoBusca = h('input', {
    type: 'text', value: estado.busca, placeholder: 'Buscar por nome ou categoria…', 'aria-label': 'Buscar lançamentos',
    oninput: (e) => {
      estado.busca = e.target.value;
      const foco = document.activeElement === e.target;
      render();
      if (foco) { const n = $('#busca'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
    },
    id: 'busca',
  });

  const corpo = filtradas.length
    ? [...porDia.entries()].map(([dia, itens]) => h('div', {},
      h('div', { class: 'group-head' },
        h('span', { text: cap(dateFull(dia)) }),
        h('span', { class: 'g-total', text: fmt(somar(itens)) })),
      h('div', { class: 'list' }, itens.map((o) => {
        const c = catPorId(o.l.cat);
        return h('button', { class: 'item', type: 'button', onclick: () => abrirLancamento(o.l.id) },
          h('span', { class: 'item-emoji', 'aria-hidden': 'true', text: c.emoji }),
          h('span', { class: 'item-main' },
            h('span', { class: 'item-title', text: o.l.desc }),
            h('span', { class: 'item-meta' },
              h('span', { text: c.nome }),
              o.de > 1 ? h('span', { class: 'badge soft', text: `${o.n}/${o.de}` }) : null,
              eventoPorId(o.l.evento) ? h('span', { class: 'badge', text: `${eventoPorId(o.l.evento).emoji} ${eventoPorId(o.l.evento).nome}` }) : null,
              db.cartoes.length > 1 ? h('span', { text: cartaoPorId(o.l.cartao).nome }) : null,
              o.l.obs ? h('span', { text: o.l.obs }) : null)),
          h('span', { class: 'item-amount' }, fmt(o.cents),
            o.de > 1 ? h('small', { text: `de ${fmt(o.l.cents)}` }) : null));
      }))))
    : [vazio('🔍', busca ? 'Nenhum lançamento encontrado com esse termo.' : 'Nenhum gasto nesta fatura.')];

  return h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', { text: 'Lançamentos' }),
      h('div', { class: 'card-actions' },
        h('button', { class: 'btn small', type: 'button', text: 'Importar fatura', onclick: () => irPara('importar') }))),
    h('div', { class: 'filters' }, h('div', { class: 'field grow' }, campoBusca)),
    corpo);
}

/* ---------------------------------------------------------- *
 * 9. Tela: Relatórios
 * ---------------------------------------------------------- */

function telaRelatorios() {
  if (!db.lancamentos.length) {
    return h('div', { class: 'card' }, vazio('📊', 'Os relatórios aparecem assim que houver gastos lançados.',
      h('button', { class: 'btn primary', type: 'button', text: 'Lançar um gasto', onclick: () => abrirLancamento() })));
  }

  const fim = ymNow();
  const comDados = mesesComDados();
  const primeiro = comDados[0] || fim;
  const totalMeses = Math.max(1, ymDiff(fim, primeiro) + 1);
  const janela = estado.meses === 'tudo' ? totalMeses : Math.min(Number(estado.meses), totalMeses);
  const inicio = ymAdd(fim, -(janela - 1));
  const meses = ymRange(inicio, janela);

  const dentro = (o) => o.ym >= inicio && o.ym <= fim;
  const daCategoria = (o) => estado.catFiltro === 'todas' || o.l.cat === estado.catFiltro;
  const doEvento = (o) => estado.evtFiltro === 'todos'
    || (estado.evtFiltro === 'nenhum' ? !o.l.evento : o.l.evento === estado.evtFiltro);
  const todasOcs = ocorrencias().filter(dentro).filter(doEvento);
  const ocs = todasOcs.filter(daCategoria);

  const porMes = meses.map((ym) => ({ ym, cents: somar(ocs.filter((o) => o.ym === ym)) }));
  const total = somar(ocs);
  const mediaMes = Math.round(total / janela);
  const pico = porMes.reduce((a, b) => (b.cents > a.cents ? b : a), porMes[0]);
  const cats = porCategoria(todasOcs);
  const catAtual = estado.catFiltro === 'todas' ? null : catPorId(estado.catFiltro);
  const evtAtual = eventoPorId(estado.evtFiltro);

  // ---- uma linha de filtros, acima de tudo que ela afeta ----
  const filtros = h('div', { class: 'filters' },
    h('div', { class: 'field' },
      h('label', { for: 'f-janela', text: 'Período' }),
      h('select', {
        id: 'f-janela',
        onchange: (e) => { estado.meses = e.target.value === 'tudo' ? 'tudo' : Number(e.target.value); render(); },
      },
        [['6', 'Últimos 6 meses'], ['12', 'Últimos 12 meses'], ['24', 'Últimos 24 meses'], ['tudo', 'Tudo']]
          .map(([v, t]) => h('option', { value: v, selected: String(estado.meses) === v, text: t })))),
    h('div', { class: 'field grow' },
      h('label', { for: 'f-catfiltro', text: 'Categoria' }),
      h('select', {
        id: 'f-catfiltro',
        onchange: (e) => { estado.catFiltro = e.target.value; render(); },
      },
        [h('option', { value: 'todas', selected: estado.catFiltro === 'todas', text: 'Todas as categorias' }),
        ...db.categorias.map((c) => h('option', { value: c.id, selected: c.id === estado.catFiltro, text: `${c.emoji} ${c.nome}` }))])),
    db.eventos.length ? h('div', { class: 'field grow' },
      h('label', { for: 'f-evtfiltro', text: 'Evento' }),
      h('select', {
        id: 'f-evtfiltro',
        onchange: (e) => { estado.evtFiltro = e.target.value; render(); },
      },
        [h('option', { value: 'todos', selected: estado.evtFiltro === 'todos', text: 'Todos os gastos' }),
        h('option', { value: 'nenhum', selected: estado.evtFiltro === 'nenhum', text: 'Fora de eventos' }),
        ...db.eventos.map((ev) => h('option', { value: ev.id, selected: ev.id === estado.evtFiltro, text: `${ev.emoji} ${ev.nome}` }))])) : null,
  );

  const escopo = [
    catAtual ? `${catAtual.emoji} ${catAtual.nome}` : 'todas as categorias',
    evtAtual ? `em ${evtAtual.emoji} ${evtAtual.nome}` : estado.evtFiltro === 'nenhum' ? 'fora de eventos' : null,
  ].filter(Boolean).join(' · ');

  const resumo = h('div', { class: 'card' },
    h('div', { class: 'hero-label', text: `Média por mês · ${escopo}` }),
    h('div', { class: 'hero-figure', text: fmt(mediaMes) }),
    h('div', { class: 'delta flat' }, h('small', { text: `em ${janela} ${janela === 1 ? 'mês' : 'meses'}, de ${ymLong(inicio)} a ${ymLong(fim)}` })),
    h('div', { class: 'tiles' },
      tile('Total no período', fmt(total)),
      tile('Mês mais caro', pico && pico.cents ? fmt(pico.cents) : '—', pico && pico.cents ? cap(ymLong(pico.ym)) : null),
      tile('Este mês', fmt(somar(ocs.filter((o) => o.ym === fim))), cap(ymLong(fim))),
      tile('Mês passado', fmt(somar(ocs.filter((o) => o.ym === ymAdd(fim, -1)))), cap(ymLong(ymAdd(fim, -1)))),
    ));

  const evolucao = figura({
    titulo: 'Evolução mês a mês',
    sub: `Valores em R$ · ${escopo}. O mês atual está destacado; toque numa coluna para abrir aquele mês.`,
    grafico: colunasMes({
      pontos: porMes, destaque: fim,
      aoClicar: (p) => { estado.ym = p.ym; irPara('mes'); },
    }),
    tabela: tabelaSimples([{ t: 'Mês' }, { t: 'Total', num: true }],
      porMes.map((p) => [cap(ymLong(p.ym)), fmt(p.cents)])),
  });

  const ranking = cats.length ? figura({
    titulo: 'Ranking de categorias',
    sub: `Soma de ${ymLong(inicio)} a ${ymLong(fim)}. A porcentagem é sobre o total do período.`,
    grafico: barrasH({
      itens: cats.map((c) => ({ key: c.cat.id, emoji: c.cat.emoji, nome: c.cat.nome, cents: c.cents })),
      aoClicar: (it) => { estado.catFiltro = it.key; render(); },
    }),
    tabela: tabelaSimples(
      [{ t: 'Categoria' }, { t: 'Total', num: true }, { t: 'Média/mês', num: true }, { t: '% do total', num: true }],
      cats.map((c) => [`${c.cat.emoji} ${c.cat.nome}`, fmt(c.cents), fmt(Math.round(c.cents / janela)),
        Math.round((c.cents / (somar(todasOcs) || 1)) * 100) + '%'])),
  }) : null;

  return [filtros, resumo, evolucao, ranking];
}

/* ---------------------------------------------------------- *
 * 10. Tela: Parcelas futuras
 * ---------------------------------------------------------- */

function telaParcelas() {
  const hoje = ymNow();
  const futuras = ocorrencias().filter((o) => o.ym > hoje);

  if (!futuras.length) {
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Parcelas futuras' })),
      vazio('🎉', 'Nada parcelado para os próximos meses. As faturas seguintes começam do zero.'));
  }

  const totalFuturo = somar(futuras);
  const ultimo = futuras.reduce((m, o) => (o.ym > m ? o.ym : m), hoje);
  const qtdMeses = Math.min(18, ymDiff(ultimo, hoje));
  const meses = ymRange(ymAdd(hoje, 1), Math.max(1, qtdMeses));
  const porMes = meses.map((ym) => ({ ym, cents: somar(futuras.filter((o) => o.ym === ym)) }));
  const proximo = porMes[0];

  // compras parceladas ainda em andamento
  const emAndamento = db.lancamentos
    .filter((l) => (Number(l.parcelas) || 1) > 1)
    .map((l) => {
      const parc = parcelasDe(l);
      const restantes = parc.filter((p) => p.ym > hoje);
      if (!restantes.length) return null;
      const pagas = parc.length - restantes.length;
      return { l, parc, restantes, pagas, falta: somar(restantes), fim: parc[parc.length - 1].ym };
    })
    .filter(Boolean)
    .sort((a, b) => b.falta - a.falta);

  const resumo = h('div', { class: 'card' },
    h('div', { class: 'hero-label', text: 'Já comprometido nas próximas faturas' }),
    h('div', { class: 'hero-figure', text: fmt(totalFuturo) }),
    h('div', { class: 'delta flat' }, h('small', { text: `${emAndamento.length} ${emAndamento.length === 1 ? 'compra parcelada' : 'compras parceladas'} em andamento, até ${ymLong(ultimo)}` })),
    h('div', { class: 'tiles' },
      tile('Próxima fatura', fmt(proximo.cents), cap(ymLong(proximo.ym)) + ' — só as parcelas'),
      tile('Média mensal', fmt(Math.round(totalFuturo / Math.max(1, meses.length))), 'até acabarem as parcelas'),
      tile('Mês mais pesado', fmt(Math.max(...porMes.map((p) => p.cents))), cap(ymLong(porMes.reduce((a, b) => (b.cents > a.cents ? b : a), porMes[0]).ym))),
      tile('Termina em', cap(ymLong(ultimo)), 'última parcela'),
    ));

  const grafico = figura({
    titulo: 'O que já está comprometido',
    sub: 'Valores em R$ — só as parcelas de compras já feitas. Gastos novos entram por cima disso.',
    grafico: colunasMes({
      pontos: porMes, destaque: porMes[0].ym,
      aoClicar: (p) => { estado.ym = p.ym; irPara('mes'); },
    }),
    tabela: tabelaSimples([{ t: 'Mês' }, { t: 'Parcelas', num: true }],
      porMes.map((p) => [cap(ymLong(p.ym)), fmt(p.cents)])),
  });

  const lista = h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', { text: 'Compras parceladas em andamento' })),
    h('p', { class: 'card-sub', text: 'Da que mais pesa para a que menos pesa no que ainda falta pagar.' }),
    h('div', { class: 'list' }, emAndamento.map((x) => {
      const c = catPorId(x.l.cat);
      return h('button', { class: 'item', type: 'button', onclick: () => abrirLancamento(x.l.id) },
        h('span', { class: 'item-emoji', 'aria-hidden': 'true', text: c.emoji }),
        h('span', { class: 'item-main' },
          h('span', { class: 'item-title', text: x.l.desc }),
          h('span', { class: 'item-meta' },
            h('span', { class: 'badge', text: `${x.pagas} de ${x.parc.length} pagas` }),
            h('span', { text: `faltam ${x.restantes.length}` }),
            h('span', { text: `até ${ymShortYear(x.fim)}` }))),
        h('span', { class: 'item-amount' }, fmt(x.falta), h('small', { text: `de ${fmt(x.l.cents)}` })));
    })));

  return [resumo, grafico, lista];
}

/* ---------------------------------------------------------- *
 * 11. Importar fatura (texto colado ou CSV)
 * ---------------------------------------------------------- */

const MESES_ABREV = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

const LINHA_IGNORAR = /^(data|descri|lan[cç]amento|total|subtotal|saldo|limite|valor a pagar|vencimento|fatura|pagamento (efetuado|recebido)|encargos|resumo|compras nacionais|compras internacionais|demonstrativo)/i;

/** Escolhe o ano mais plausível para um dia/mês sem ano, dada a fatura de destino. */
function anoProvavel(mes, faturaYm) {
  const anoF = Number(faturaYm.slice(0, 4));
  let melhor = anoF, melhorNota = Infinity;
  for (const y of [anoF - 1, anoF, anoF + 1]) {
    const d = ymDiff(faturaYm, `${y}-${pad2(mes)}`);
    const nota = d >= 0 ? d : Math.abs(d) + 12;   // preferimos datas antes da fatura
    if (nota < melhorNota) { melhorNota = nota; melhor = y; }
  }
  return melhor;
}

/** Lê uma linha de fatura e devolve {data, desc, cents, n, de} — ou null se não der. */
function analisarLinha(linha, faturaYm) {
  let t = linha.replace(/\t/g, ' ; ').trim();
  if (!t || LINHA_IGNORAR.test(t)) return null;

  // 1) valor: pegamos a última quantia da linha
  const reMoeda = /(?:R\$\s*)?-?\(?\d{1,3}(?:\.\d{3})+,\d{2}\)?-?|(?:R\$\s*)?-?\(?\d+,\d{2}\)?-?|(?:R\$\s*)?-?\(?\d+\.\d{2}\)?-?/g;
  const moedas = t.match(reMoeda);
  if (!moedas) return null;
  const bruto = moedas[moedas.length - 1];
  const cents = parseMoney(bruto);
  if (cents == null || cents === 0) return null;
  t = t.slice(0, t.lastIndexOf(bruto)) + ' ' + t.slice(t.lastIndexOf(bruto) + bruto.length);

  // 2) data (dd/mm[/aaaa], aaaa-mm-dd ou "12 ago")
  let data = null;
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) { data = `${m[1]}-${m[2]}-${m[3]}`; t = t.replace(m[0], ' '); }
  if (!data) {
    m = t.match(/\b(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\b/);
    if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[1]) >= 1 && Number(m[1]) <= 31) {
      let ano = m[3] ? Number(m[3]) : anoProvavel(Number(m[2]), faturaYm);
      if (ano < 100) ano += 2000;
      data = `${ano}-${pad2(Number(m[2]))}-${pad2(Number(m[1]))}`;
      t = t.replace(m[0], ' ');
    }
  }
  if (!data) {
    m = t.match(/\b(\d{1,2})\s*(?:de\s*)?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\b/i);
    if (m) {
      const mes = MESES_ABREV[m[2].toLowerCase()];
      data = `${anoProvavel(mes, faturaYm)}-${pad2(mes)}-${pad2(Number(m[1]))}`;
      t = t.replace(m[0], ' ');
    }
  }
  if (!data) data = `${faturaYm}-01`;

  // 3) parcela — só depois de tirar a data, para não confundir 12/08 com 12 de 8
  let n = 1, de = 1;
  const reParc = /\b(?:parc(?:ela)?\.?\s*)?\(?\s*(\d{1,2})\s*(?:\/|de|-)\s*(\d{1,2})\s*\)?/i;
  const p = t.match(reParc);
  if (p && Number(p[2]) > 1 && Number(p[2]) <= 72 && Number(p[1]) >= 1 && Number(p[1]) <= Number(p[2])) {
    n = Number(p[1]); de = Number(p[2]);
    t = t.replace(p[0], ' ');
  }

  const desc = t.replace(/[;,|]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s\-–—.]+|[\s\-–—.]+$/g, '').trim();
  if (!desc) return null;
  return { data, desc, cents, n, de };
}

/** Uma parcela k/n dessa fatura descreve uma compra que começou k-1 meses antes. */
function montarCandidato(linha, faturaYm, cartaoId, eventoId) {
  const faturaOrigem = ymAdd(faturaYm, -(linha.n - 1));
  const total = linha.cents * linha.de;
  const sug = sugerirCategoria(linha.desc);
  const auto = eventoNaData(linha.data);
  return {
    incluir: linha.cents > 0,
    data: linha.data,
    desc: linha.desc,
    parcelaCents: linha.cents,
    cents: total,
    n: linha.n,
    de: linha.de,
    fatura: faturaOrigem,
    cartao: cartaoId,
    cat: sug ? sug.catId : 'outros',
    // o seletor do topo manda; sem ele, vale o evento cujo período engloba a data
    evento: eventoId || (auto ? auto.id : null),
    credito: linha.cents < 0,
  };
}

/** Já existe uma parcela igual (mesmo nome e mesmo valor) nesta fatura? */
function jaLancado(cand, faturaYm) {
  const chave = norm(cand.desc).slice(0, 24);
  return ocorrenciasDoMes(faturaYm).some(
    (o) => o.cents === cand.parcelaCents && norm(o.l.desc).slice(0, 24) === chave);
}

function telaImportar() {
  const cartaoSel = h('select', { id: 'imp-cartao' }, db.cartoes.map((c) => h('option', { value: c.id, text: c.nome })));
  const faturaInp = h('input', { type: 'month', id: 'imp-fatura', value: estado.ym });
  const eventoSel = selectEventos('imp-evento', '', 'Detectar pela data da compra');
  const area = h('textarea', {
    id: 'imp-texto', rows: '9',
    placeholder: 'Cole aqui as linhas da fatura. Exemplos que funcionam:\n\n12/08  IFOOD *RESTAURANTE   45,90\n03/08 DROGARIA SAO PAULO  R$ 89,00\n21/07;MAGAZINE LUIZA PARC 03/10;129,90\n2026-08-05,Netflix.com,55.90',
  });
  const saida = h('div', { id: 'imp-saida' });

  function analisar() {
    const faturaYm = faturaInp.value || ymNow();
    const cartaoId = cartaoSel.value;
    const linhas = area.value.split(/\r?\n/);
    const candidatos = [];
    let ignoradas = 0;

    for (const linha of linhas) {
      if (!linha.trim()) continue;
      const parsed = analisarLinha(linha, faturaYm);
      if (!parsed) { ignoradas++; continue; }
      const cand = montarCandidato(parsed, faturaYm, cartaoId, eventoSel.value || null);
      cand.duplicado = jaLancado(cand, faturaYm);
      if (cand.duplicado || cand.credito) cand.incluir = false;
      candidatos.push(cand);
    }

    if (!candidatos.length) {
      saida.replaceChildren(h('div', { class: 'card' },
        vazio('🤔', 'Não consegui reconhecer nenhum gasto nesse texto. Confira se cada linha tem pelo menos um valor, tipo "45,90".')));
      return;
    }
    saida.replaceChildren(previa(candidatos, faturaYm, ignoradas));
  }

  function previa(candidatos, faturaYm, ignoradas) {
    const contador = h('span', { class: 'card-sub', style: { margin: '0' } });
    const atualizarContador = () => {
      const sel = candidatos.filter((c) => c.incluir);
      contador.textContent = `${sel.length} de ${candidatos.length} selecionados · ${fmt(sel.reduce((t, c) => t + c.parcelaCents, 0))} nesta fatura`;
      btnImportar.disabled = sel.length === 0;
      btnImportar.textContent = `Importar ${sel.length} ${sel.length === 1 ? 'gasto' : 'gastos'}`;
    };

    const btnImportar = h('button', {
      class: 'btn primary', type: 'button',
      onclick: () => {
        const sel = candidatos.filter((c) => c.incluir);
        for (const c of sel) {
          db.lancamentos.push({
            id: uid(), desc: c.desc, cents: c.cents, data: c.data, cat: c.cat,
            cartao: c.cartao, parcelas: c.de, fatura: c.fatura, evento: c.evento || null,
            obs: '', criadoEm: new Date().toISOString(),
          });
          aprender(c.desc, c.cat);
        }
        salvar();
        estado.ym = faturaYm;
        irPara('mes');
        toast(`${sel.length} ${sel.length === 1 ? 'gasto importado' : 'gastos importados'}.`);
      },
    }, 'Importar');

    const linhas = candidatos.map((c) => {
      const chk = h('input', {
        type: 'checkbox', checked: c.incluir, 'aria-label': `Incluir ${c.desc}`,
        onchange: (e) => { c.incluir = e.target.checked; tr.classList.toggle('imp-off', !c.incluir); atualizarContador(); },
      });
      const tr = h('tr', { class: c.incluir ? null : 'imp-off' },
        h('td', {}, chk),
        h('td', { text: dateLabel(c.data) }),
        h('td', {}, h('input', {
          type: 'text', value: c.desc,
          oninput: (e) => { c.desc = e.target.value; },
        })),
        h('td', {}, h('select', {
          onchange: (e) => { c.cat = e.target.value; },
        }, db.categorias.map((x) => h('option', { value: x.id, selected: x.id === c.cat, text: `${x.emoji} ${x.nome}` })))),
        h('td', { class: 'num' },
          c.de > 1 ? h('span', { class: 'badge soft', text: `${c.n}/${c.de}` }) : '',
          eventoPorId(c.evento) ? h('div', {}, h('span', { class: 'badge', text: `${eventoPorId(c.evento).emoji} ${eventoPorId(c.evento).nome}` })) : null),
        h('td', { class: 'num' }, fmt(c.parcelaCents),
          c.duplicado ? h('div', {}, h('span', { class: 'badge', text: 'já lançado' })) : null,
          c.credito ? h('div', {}, h('span', { class: 'badge', text: 'crédito' })) : null),
      );
      return tr;
    });

    const marcarTodos = (v) => {
      candidatos.forEach((c, i) => {
        c.incluir = v && !c.duplicado && !c.credito;
        linhas[i].classList.toggle('imp-off', !c.incluir);
        linhas[i].querySelector('input[type=checkbox]').checked = c.incluir;
      });
      atualizarContador();
    };

    const card = h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Confira antes de importar' }),
        h('div', { class: 'card-actions' },
          h('button', { class: 'btn small', type: 'button', text: 'Marcar todos', onclick: () => marcarTodos(true) }),
          h('button', { class: 'btn small', type: 'button', text: 'Desmarcar todos', onclick: () => marcarTodos(false) }))),
      contador,
      candidatos.some((c) => c.de > 1)
        ? h('p', { class: 'hint', text: 'Nas compras parceladas eu reconstruo a compra inteira: as parcelas passadas entram no histórico e as futuras aparecem na aba "Parcelas futuras".' })
        : null,
      ignoradas ? h('p', { class: 'hint', text: `${ignoradas} ${ignoradas === 1 ? 'linha foi ignorada' : 'linhas foram ignoradas'} por não ter valor reconhecível (cabeçalhos, totais e afins).` }) : null,
      h('div', { class: 'table-wrap' },
        h('table', { class: 'imp-table' },
          h('thead', {}, h('tr', {},
            h('th', { text: '' }), h('th', { text: 'Data' }), h('th', { text: 'Descrição' }),
            h('th', { text: 'Categoria' }), h('th', { class: 'num', text: 'Parc.' }), h('th', { class: 'num', text: 'Valor' }))),
          h('tbody', {}, linhas))),
      h('div', { class: 'modal-foot' }, h('span', { class: 'spacer' }), btnImportar));

    setTimeout(atualizarContador, 0);
    return card;
  }

  return [
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Importar fatura' })),
      h('p', { class: 'card-sub', text: 'Copie as linhas da fatura do app ou do site do banco e cole aqui. Eu identifico data, valor, parcela e chuto a categoria — você confere antes de confirmar.' }),
      h('div', { class: 'filters' },
        h('div', { class: 'field' }, h('label', { for: 'imp-cartao', text: 'Cartão' }), cartaoSel),
        h('div', { class: 'field' }, h('label', { for: 'imp-fatura', text: 'Fatura de' }), faturaInp),
        db.eventos.length ? h('div', { class: 'field grow' },
          h('label', { for: 'imp-evento', text: 'Vincular ao evento' }), eventoSel) : null),
      h('div', { class: 'field' }, h('label', { for: 'imp-texto', text: 'Linhas da fatura' }), area),
      h('div', { class: 'modal-foot' },
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn primary', type: 'button', text: 'Analisar', onclick: analisar }))),
    saida,
  ];
}

/* ---------------------------------------------------------- *
 * 12. Tela: Ajustes
 * ---------------------------------------------------------- */

function aplicarTema() {
  const t = db.prefs.tema || 'auto';
  document.documentElement.dataset.theme = t === 'claro' ? 'light' : t === 'escuro' ? 'dark' : '';
}

function exportarBackup() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `gastos-backup-${todayISO()}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  db.prefs.ultimoBackup = todayISO();
  salvar();
  toast('Backup baixado.');
}

function importarBackup(file) {
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(String(leitor.result));
      if (!dados || !Array.isArray(dados.lancamentos)) throw new Error('formato inesperado');
      if (!confirm(`Isso substitui tudo que está aqui por ${dados.lancamentos.length} lançamento(s) do arquivo. Continuar?`)) return;
      localStorage.setItem(DB_KEY, JSON.stringify(dados));
      db = carregar();
      aplicarTema();
      render();
      toast('Backup restaurado.');
    } catch (e) {
      console.error(e);
      toast('Não consegui ler esse arquivo. Ele precisa ser um backup exportado por este app.');
    }
  };
  leitor.readAsText(file);
}

function editarCartao(id) {
  const c = id ? db.cartoes.find((x) => x.id === id) : { id: uid(), nome: '', fechamento: null };
  const nome = h('input', { type: 'text', id: 'c-nome', value: c.nome, placeholder: 'Ex.: Nubank' });
  const fech = h('input', { type: 'number', id: 'c-fech', min: '1', max: '31', value: c.fechamento || '', placeholder: 'deixe vazio se não souber' });

  abrirModal(h('div', {},
    h('div', { class: 'modal-head' }, h('h2', { text: id ? 'Editar cartão' : 'Novo cartão' }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', text: '✕', onclick: fecharModal })),
    h('div', { class: 'form-grid' },
      h('div', { class: 'field full' }, h('label', { for: 'c-nome', text: 'Nome do cartão' }), nome),
      h('div', { class: 'field full' }, h('label', { for: 'c-fech', text: 'Dia do fechamento da fatura' }), fech,
        h('p', { class: 'hint', text: 'Compras feitas depois desse dia caem na fatura do mês seguinte. Se ficar vazio, cada compra entra na fatura do próprio mês.' }))),
    h('div', { class: 'modal-foot' },
      id && db.cartoes.length > 1 ? h('button', {
        class: 'btn danger', type: 'button', text: 'Excluir',
        onclick: () => {
          if (!confirm(`Excluir "${c.nome}"? Os gastos dele passam para "${db.cartoes.find((x) => x.id !== id).nome}".`)) return;
          const destino = db.cartoes.find((x) => x.id !== id).id;
          db.lancamentos.forEach((l) => { if (l.cartao === id) l.cartao = destino; });
          db.cartoes = db.cartoes.filter((x) => x.id !== id);
          salvar(); fecharModal(); render();
        },
      }) : null,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'button', text: 'Cancelar', onclick: fecharModal }),
      h('button', {
        class: 'btn primary', type: 'button', text: 'Salvar',
        onclick: () => {
          if (!nome.value.trim()) { nome.focus(); return; }
          c.nome = nome.value.trim();
          c.fechamento = fech.value ? Math.min(31, Math.max(1, Number(fech.value))) : null;
          if (!id) db.cartoes.push(c);
          salvar(); fecharModal(); render(); toast('Cartão salvo.');
        },
      }))));
}

function editarCategoria(id) {
  const c = id ? db.categorias.find((x) => x.id === id) : { id: uid(), emoji: '🏷️', nome: '' };
  const emoji = h('input', { type: 'text', id: 'k-emoji', value: c.emoji, maxlength: '4', style: { textAlign: 'center', fontSize: '20px' } });
  const nome = h('input', { type: 'text', id: 'k-nome', value: c.nome, placeholder: 'Ex.: Academia' });
  const usados = ocorrencias().filter((o) => o.l.cat === id).length;

  abrirModal(h('div', {},
    h('div', { class: 'modal-head' }, h('h2', { text: id ? 'Editar categoria' : 'Nova categoria' }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', text: '✕', onclick: fecharModal })),
    h('div', { class: 'form-grid' },
      h('div', { class: 'field' }, h('label', { for: 'k-emoji', text: 'Ícone' }), emoji),
      h('div', { class: 'field' }, h('label', { for: 'k-nome', text: 'Nome' }), nome)),
    h('div', { class: 'modal-foot' },
      id && c.id !== 'outros' ? h('button', {
        class: 'btn danger', type: 'button', text: 'Excluir',
        onclick: () => {
          if (!confirm(`Excluir "${c.nome}"? ${usados ? `${usados} lançamento(s) vão para "Outros".` : ''}`)) return;
          db.lancamentos.forEach((l) => { if (l.cat === id) l.cat = 'outros'; });
          Object.keys(db.regras).forEach((k) => { if (db.regras[k] === id) delete db.regras[k]; });
          db.categorias = db.categorias.filter((x) => x.id !== id);
          if (!db.categorias.some((x) => x.id === 'outros')) db.categorias.push({ id: 'outros', emoji: '❓', nome: 'Outros' });
          salvar(); fecharModal(); render();
        },
      }) : null,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'button', text: 'Cancelar', onclick: fecharModal }),
      h('button', {
        class: 'btn primary', type: 'button', text: 'Salvar',
        onclick: () => {
          if (!nome.value.trim()) { nome.focus(); return; }
          c.nome = nome.value.trim();
          c.emoji = emoji.value.trim() || '🏷️';
          if (!id) db.categorias.push(c);
          salvar(); fecharModal(); render(); toast('Categoria salva.');
        },
      }))));
}

function telaAjustes() {
  const regras = Object.entries(db.regras);
  const arquivo = h('input', {
    type: 'file', accept: 'application/json,.json', style: { display: 'none' },
    onchange: (e) => { if (e.target.files[0]) importarBackup(e.target.files[0]); e.target.value = ''; },
  });

  const temaSeg = h('div', { class: 'seg' }, [['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, t]) =>
    h('button', {
      type: 'button', text: t, 'aria-pressed': String((db.prefs.tema || 'auto') === v),
      onclick: () => { db.prefs.tema = v; salvar(); aplicarTema(); render(); },
    })));

  return [
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Backup — leia isto' })),
      h('div', { class: 'callout' },
        h('b', { text: 'Seus dados ficam só neste navegador, neste aparelho. ' }),
        'Nada é enviado para lugar nenhum. A contrapartida é que, se você limpar os dados do navegador ou trocar de celular, tudo some. Baixe um backup de vez em quando — é um arquivo só.'),
      h('div', { class: 'filters' },
        h('button', { class: 'btn primary', type: 'button', text: '⬇ Baixar backup', onclick: exportarBackup }),
        h('button', { class: 'btn', type: 'button', text: '⬆ Restaurar backup', onclick: () => arquivo.click() }),
        arquivo),
      h('p', { class: 'hint', text: db.prefs.ultimoBackup ? `Último backup: ${dateFull(db.prefs.ultimoBackup)}.` : 'Você ainda não baixou nenhum backup.' }),
      h('p', { class: 'hint', text: `Hoje: ${db.lancamentos.length} lançamento(s) guardados.` })),

    cartaoInstalar(),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Cartões' }),
        h('div', { class: 'card-actions' }, h('button', { class: 'btn small', type: 'button', text: '+ Novo cartão', onclick: () => editarCartao() }))),
      h('div', { class: 'rows' }, db.cartoes.map((c) => h('div', { class: 'row-edit' },
        h('span', { class: 'chip-emoji', 'aria-hidden': 'true', text: '💳' }),
        h('span', { class: 'r-main' },
          h('span', { class: 'r-title', text: c.nome }),
          h('span', { class: 'r-note', text: c.fechamento ? `fecha todo dia ${c.fechamento}` : 'sem dia de fechamento definido' })),
        h('button', { class: 'btn small', type: 'button', text: 'Editar', onclick: () => editarCartao(c.id) }))))),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Categorias' }),
        h('div', { class: 'card-actions' }, h('button', { class: 'btn small', type: 'button', text: '+ Nova categoria', onclick: () => editarCategoria() }))),
      h('p', { class: 'card-sub', text: 'Use as que fazem sentido para você — dá para renomear, trocar o ícone e criar novas.' }),
      h('div', { class: 'rows' }, db.categorias.map((c) => {
        const qtd = ocorrencias().filter((o) => o.l.cat === c.id).length;
        return h('div', { class: 'row-edit' },
          h('span', { class: 'chip-emoji', 'aria-hidden': 'true', text: c.emoji }),
          h('span', { class: 'r-main' },
            h('span', { class: 'r-title', text: c.nome }),
            h('span', { class: 'r-note', text: qtd ? `${qtd} lançamento(s)` : 'sem uso ainda' })),
          h('button', { class: 'btn small', type: 'button', text: 'Editar', onclick: () => editarCategoria(c.id) }));
      }))),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'O que o app aprendeu' }),
        regras.length ? h('div', { class: 'card-actions' }, h('button', {
          class: 'btn small danger', type: 'button', text: 'Esquecer tudo',
          onclick: () => { if (confirm('Apagar todas as regras aprendidas? Os gastos já lançados não mudam.')) { db.regras = {}; salvar(); render(); } },
        })) : null),
      h('p', { class: 'card-sub', text: 'Toda vez que você corrige a categoria de um gasto, eu guardo a dica e acerto sozinho na próxima.' }),
      regras.length
        ? h('div', { class: 'rows' }, regras.map(([termo, catId]) => {
          const c = catPorId(catId);
          return h('div', { class: 'row-edit' },
            h('span', { class: 'chip-emoji', 'aria-hidden': 'true', text: c.emoji }),
            h('span', { class: 'r-main' },
              h('span', { class: 'r-title', text: `"${termo}"` }),
              h('span', { class: 'r-note', text: `vira ${c.nome}` })),
            h('button', {
              class: 'btn small ghost', type: 'button', text: 'Remover',
              onclick: () => { delete db.regras[termo]; salvar(); render(); },
            }));
        }))
        : h('p', { class: 'hint', text: 'Nada aprendido ainda.' })),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Aparência' })),
      temaSeg),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { text: 'Zona de perigo' })),
      h('p', { class: 'card-sub', text: 'Apaga todos os gastos, categorias e cartões deste navegador. Não dá para desfazer.' }),
      h('button', {
        class: 'btn danger', type: 'button', text: 'Apagar tudo',
        onclick: () => {
          if (!confirm('Apagar TODOS os dados deste app? Baixe um backup antes se tiver dúvida.')) return;
          if (!confirm('Tem certeza mesmo? Isso é definitivo.')) return;
          localStorage.removeItem(DB_KEY);
          db = carregar();
          aplicarTema();
          estado.ym = ymNow();
          render();
          toast('Tudo apagado.');
        },
      })),
  ];
}

/* ---------------------------------------------------------- *
 * 12b. Eventos (viagem, reforma, festa…)
 * ---------------------------------------------------------- */

/**
 * Medidor de orçamento: um trilho na mesma cor do dado, mais claro,
 * e o preenchimento carregando a severidade — sempre com ícone e texto,
 * para a cor nunca ser a única pista.
 */
function medidor(gasto, meta) {
  const frac = meta > 0 ? gasto / meta : 0;
  const pct = Math.round(frac * 100);
  const nivel = frac > 1 ? 'crit' : frac >= 0.9 ? 'warn' : 'ok';
  const icone = nivel === 'crit' ? '⛔' : nivel === 'warn' ? '⚠️' : '✓';
  const texto = nivel === 'crit'
    ? `${fmt(gasto - meta)} acima do orçamento de ${fmt(meta)}`
    : `${pct}% do orçamento de ${fmt(meta)} · restam ${fmt(meta - gasto)}`;
  return h('div', { class: 'meter-wrap' },
    h('div', { class: 'meter', role: 'img', 'aria-label': texto },
      h('div', { class: 'meter-fill ' + nivel, style: { width: Math.min(100, pct) + '%' } })),
    h('div', { class: 'meter-legend ' + nivel },
      h('span', { 'aria-hidden': 'true', text: icone }), h('span', { text: texto })));
}

function periodoEvento(ev) {
  if (ev.inicio && ev.fim) return `${dateLabel(ev.inicio)} a ${dateLabel(ev.fim)}`;
  if (ev.inicio) return `a partir de ${dateLabel(ev.inicio)}`;
  return 'sem datas definidas';
}

function editarEvento(id) {
  const ev = id ? db.eventos.find((x) => x.id === id) : { id: uid(), emoji: '🧳', nome: '', inicio: '', fim: '', meta: null };
  const emoji = h('input', { type: 'text', id: 'e-emoji', value: ev.emoji, maxlength: '4', style: { textAlign: 'center', fontSize: '20px' } });
  const nome = h('input', { type: 'text', id: 'e-nome', value: ev.nome, placeholder: 'Ex.: Viagem ao Chile' });
  const inicio = h('input', { type: 'date', id: 'e-inicio', value: ev.inicio || '' });
  const fim = h('input', { type: 'date', id: 'e-fim', value: ev.fim || '' });
  const meta = h('input', { type: 'text', id: 'e-meta', inputmode: 'decimal', placeholder: 'opcional', value: ev.meta ? String((ev.meta / 100).toFixed(2)).replace('.', ',') : '' });
  const vinculados = id ? lancamentosDoEvento(id).length : 0;

  abrirModal(h('div', {},
    h('div', { class: 'modal-head' }, h('h2', { text: id ? 'Editar evento' : 'Novo evento' }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', text: '✕', onclick: fecharModal })),
    h('div', { class: 'form-grid' },
      h('div', { class: 'field' }, h('label', { for: 'e-emoji', text: 'Ícone' }), emoji),
      h('div', { class: 'field' }, h('label', { for: 'e-nome', text: 'Nome do evento' }), nome),
      h('div', { class: 'field' }, h('label', { for: 'e-inicio', text: 'Começa em' }), inicio),
      h('div', { class: 'field' }, h('label', { for: 'e-fim', text: 'Termina em' }), fim),
      h('div', { class: 'field full' }, h('label', { for: 'e-meta', text: 'Orçamento (R$)' }), meta,
        h('p', { class: 'hint', text: 'Se preencher as datas, todo gasto feito nesse período já vem marcado com o evento. O orçamento é opcional e vira uma barrinha de quanto já foi.' }))),
    h('div', { class: 'modal-foot' },
      id ? h('button', {
        class: 'btn danger', type: 'button', text: 'Excluir',
        onclick: () => {
          if (!confirm(`Excluir o evento "${ev.nome}"? ${vinculados ? `Os ${vinculados} gasto(s) continuam existindo, só deixam de estar vinculados.` : ''}`)) return;
          db.lancamentos.forEach((l) => { if (l.evento === id) l.evento = null; });
          db.eventos = db.eventos.filter((x) => x.id !== id);
          estado.eventoAberto = null;
          salvar(); fecharModal(); render(); toast('Evento excluído.');
        },
      }) : null,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'button', text: 'Cancelar', onclick: fecharModal }),
      h('button', {
        class: 'btn primary', type: 'button', text: 'Salvar',
        onclick: () => {
          if (!nome.value.trim()) { nome.focus(); toast('Dê um nome ao evento.'); return; }
          if (inicio.value && fim.value && fim.value < inicio.value) { fim.focus(); toast('A data final não pode ser antes da inicial.'); return; }
          ev.nome = nome.value.trim();
          ev.emoji = emoji.value.trim() || '🧳';
          ev.inicio = inicio.value || '';
          ev.fim = fim.value || '';
          ev.meta = parseMoney(meta.value) || null;
          if (!id) { ev.criadoEm = new Date().toISOString(); db.eventos.push(ev); estado.eventoAberto = ev.id; }
          salvar(); fecharModal(); render(); toast('Evento salvo.');
        },
      }))));
}

/** Marca de uma vez vários gastos que já existiam como sendo do evento. */
function vincularGastos(eventoId) {
  const ev = eventoPorId(eventoId);
  let busca = '';
  const lista = h('div', { class: 'list' });
  const marcados = new Set();

  const candidatos = () => {
    const b = norm(busca);
    return db.lancamentos
      .filter((l) => l.evento !== eventoId)
      .filter((l) => !b || norm(l.desc).includes(b) || norm(catPorId(l.cat).nome).includes(b))
      .sort((a, c) => (a.data < c.data ? 1 : -1))
      .slice(0, 120);
  };

  const botao = h('button', { class: 'btn primary', type: 'button', disabled: true, text: 'Vincular' });

  const atualizarBotao = () => {
    botao.disabled = marcados.size === 0;
    botao.textContent = marcados.size
      ? `Vincular ${marcados.size} ${marcados.size === 1 ? 'gasto' : 'gastos'}`
      : 'Vincular';
  };

  function desenhar() {
    const itens = candidatos();
    lista.replaceChildren(...(itens.length ? itens.map((l) => {
      const c = catPorId(l.cat);
      const outro = eventoPorId(l.evento);
      const chk = h('input', {
        type: 'checkbox', checked: marcados.has(l.id), 'aria-label': `Vincular ${l.desc}`,
        onchange: (e) => { e.target.checked ? marcados.add(l.id) : marcados.delete(l.id); atualizarBotao(); },
      });
      return h('label', { class: 'item', style: { cursor: 'pointer' } },
        chk,
        h('span', { class: 'item-emoji', 'aria-hidden': 'true', text: c.emoji }),
        h('span', { class: 'item-main' },
          h('span', { class: 'item-title', text: l.desc }),
          h('span', { class: 'item-meta' },
            h('span', { text: dateLabel(l.data) }),
            h('span', { text: c.nome }),
            l.parcelas > 1 ? h('span', { class: 'badge', text: `${l.parcelas}×` }) : null,
            outro ? h('span', { class: 'badge soft', text: `hoje em ${outro.nome}` }) : null)),
        h('span', { class: 'item-amount', text: fmt(l.cents) }));
    }) : [vazio('🔍', 'Nenhum gasto encontrado.')]));
  }

  const campo = h('input', {
    type: 'text', placeholder: 'Buscar por nome ou categoria…', 'aria-label': 'Buscar gastos',
    oninput: (e) => { busca = e.target.value; desenhar(); },
  });

  // atalho: já deixa marcados os gastos que caem no período do evento
  if (ev.inicio && ev.fim) {
    db.lancamentos.forEach((l) => {
      if (l.evento !== eventoId && l.data >= ev.inicio && l.data <= ev.fim) marcados.add(l.id);
    });
  }
  desenhar();
  atualizarBotao();

  botao.addEventListener('click', () => {
    db.lancamentos.forEach((l) => { if (marcados.has(l.id)) l.evento = eventoId; });
    salvar(); fecharModal(); render();
    toast(`${marcados.size} ${marcados.size === 1 ? 'gasto vinculado' : 'gastos vinculados'}.`);
  });

  abrirModal(h('div', {},
    h('div', { class: 'modal-head' }, h('h2', { text: `Vincular gastos a ${ev.nome}` }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fechar', text: '✕', onclick: fecharModal })),
    ev.inicio && ev.fim
      ? h('p', { class: 'card-sub', text: `Já deixei marcado tudo que foi comprado entre ${dateLabel(ev.inicio)} e ${dateLabel(ev.fim)}. Desmarque o que não for do evento.` })
      : h('p', { class: 'card-sub', text: 'Marque os gastos que fazem parte deste evento.' }),
    h('div', { class: 'filters' }, h('div', { class: 'field grow' }, campo)),
    h('div', { class: 'lista-vinculo' }, lista),
    h('div', { class: 'modal-foot' },
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'button', text: 'Cancelar', onclick: fecharModal }),
      botao)));
}

function telaEventos() {
  if (estado.eventoAberto) {
    const ev = eventoPorId(estado.eventoAberto);
    if (ev) return detalheEvento(ev);
    estado.eventoAberto = null;
  }

  const cabecalho = h('div', { class: 'card-head' }, h('h2', { text: 'Eventos' }),
    h('div', { class: 'card-actions' },
      h('button', { class: 'btn small primary', type: 'button', text: '+ Novo evento', onclick: () => editarEvento() })));

  if (!db.eventos.length) {
    return h('div', { class: 'card' }, cabecalho,
      vazio('🧳', 'Um evento junta gastos de categorias diferentes sob um mesmo guarda-chuva: uma viagem, uma reforma, uma festa. Você vê quanto aquilo custou no total, mesmo espalhado por vários meses e faturas.',
        h('button', { class: 'btn primary', type: 'button', text: 'Criar o primeiro evento', onclick: () => editarEvento() })));
  }

  const resumos = db.eventos.map((ev) => ({ ev, r: resumoEvento(ev) })).sort((a, b) => b.r.total - a.r.total);

  return h('section', { class: 'card' }, cabecalho,
    h('p', { class: 'card-sub', text: 'O valor é o custo cheio das compras — incluindo as parcelas que ainda vão cair.' }),
    h('div', { class: 'list' }, resumos.map(({ ev, r }) =>
      h('button', {
        class: 'item', type: 'button',
        onclick: () => { estado.eventoAberto = ev.id; render(); scrollTo({ top: 0, behavior: 'instant' }); },
      },
        h('span', { class: 'item-emoji', 'aria-hidden': 'true', text: ev.emoji }),
        h('span', { class: 'item-main' },
          h('span', { class: 'item-title', text: ev.nome }),
          h('span', { class: 'item-meta' },
            h('span', { text: periodoEvento(ev) }),
            h('span', { text: `${r.qtd} ${r.qtd === 1 ? 'gasto' : 'gastos'}` }),
            r.aPagar > 0 ? h('span', { class: 'badge soft', text: `${fmt(r.aPagar)} a pagar` }) : null,
            ev.meta && r.total > ev.meta
              ? h('span', { class: 'badge alerta' }, h('span', { 'aria-hidden': 'true', text: '⛔' }), ` ${fmt(r.total - ev.meta)} acima do orçamento`)
              : ev.meta && r.total >= ev.meta * 0.9
                ? h('span', { class: 'badge alerta' }, h('span', { 'aria-hidden': 'true', text: '⚠️' }), ' perto do limite')
                : null)),
        h('span', { class: 'item-amount' }, fmt(r.total),
          ev.meta ? h('small', { text: `de ${fmt(ev.meta)}` }) : null)))));
}

function detalheEvento(ev) {
  const r = resumoEvento(ev);
  const cats = porCategoria(ocorrencias(r.ls));

  const voltar = h('div', { class: 'month-nav' },
    h('button', {
      class: 'icon-btn', type: 'button', 'aria-label': 'Voltar para a lista de eventos', text: '‹',
      onclick: () => { estado.eventoAberto = null; render(); },
    }),
    h('div', { class: 'now' }, `${ev.emoji} ${ev.nome}`, h('small', { text: periodoEvento(ev) })),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Editar evento', text: '✎', onclick: () => editarEvento(ev.id) }));

  if (!r.qtd) {
    return [voltar, h('div', { class: 'card' },
      vazio('📎', 'Nenhum gasto vinculado ainda. Você pode marcar gastos que já existem ou escolher este evento ao lançar um novo.',
        h('div', { class: 'filters', style: { justifyContent: 'center' } },
          h('button', { class: 'btn primary', type: 'button', text: 'Vincular gastos existentes', onclick: () => vincularGastos(ev.id) }),
          h('button', { class: 'btn', type: 'button', text: 'Lançar um gasto', onclick: () => abrirLancamento() }))))];
  }

  const meses = [...new Set(r.ocs.map((o) => o.ym))].sort();
  const serie = meses.length > 1
    ? ymRange(meses[0], ymDiff(meses[meses.length - 1], meses[0]) + 1)
      .map((ym) => ({ ym, cents: somar(r.ocs.filter((o) => o.ym === ym)) }))
    : null;

  const resumo = h('div', { class: 'card' },
    h('div', { class: 'hero-label', text: `Custo total de ${ev.nome}` }),
    h('div', { class: 'hero-figure', text: fmt(r.total) }),
    ev.meta ? medidor(r.total, ev.meta)
      : h('div', { class: 'delta flat' }, h('small', { text: `${r.qtd} ${r.qtd === 1 ? 'gasto' : 'gastos'} entre ${dateLabel(r.primeiro)} e ${dateLabel(r.ultimo)}` })),
    h('div', { class: 'tiles' },
      tile('Já pago', fmt(r.pago), 'faturas até este mês'),
      tile('Ainda a pagar', fmt(r.aPagar), r.aPagar > 0 ? 'parcelas nas próximas faturas' : 'nada pendente'),
      tile('Gastos', String(r.qtd), `${r.ls.filter((l) => l.parcelas > 1).length} parcelado(s)`),
      tile('Média por gasto', fmt(Math.round(r.total / r.qtd))),
    ),
    h('div', { class: 'filters', style: { marginTop: '16px', marginBottom: 0 } },
      h('button', { class: 'btn', type: 'button', text: '📎 Vincular gastos existentes', onclick: () => vincularGastos(ev.id) }),
      h('button', { class: 'btn', type: 'button', text: '✎ Editar evento', onclick: () => editarEvento(ev.id) })));

  const porCat = figura({
    titulo: 'Em que foi gasto',
    sub: `Categorias dentro de ${ev.nome}.`,
    grafico: barrasH({ itens: cats.map((c) => ({ key: c.cat.id, emoji: c.cat.emoji, nome: c.cat.nome, cents: c.cents })) }),
    tabela: tabelaSimples([{ t: 'Categoria' }, { t: 'Valor', num: true }, { t: '% do evento', num: true }],
      cats.map((c) => [`${c.cat.emoji} ${c.cat.nome}`, fmt(c.cents), Math.round((c.cents / (r.total || 1)) * 100) + '%'])),
  });

  const noTempo = serie ? figura({
    titulo: 'Como se espalha pelas faturas',
    sub: 'Valores em R$ — quanto deste evento cai em cada fatura, contando as parcelas.',
    grafico: colunasMes({ pontos: serie, destaque: ymNow(), aoClicar: (p) => { estado.ym = p.ym; irPara('mes'); } }),
    tabela: tabelaSimples([{ t: 'Fatura' }, { t: 'Valor', num: true }], serie.map((p) => [cap(ymLong(p.ym)), fmt(p.cents)])),
  }) : null;

  const lista = h('section', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', { text: 'Gastos deste evento' })),
    h('div', { class: 'list' }, [...r.ls].sort((a, b) => (a.data < b.data ? 1 : -1)).map((l) => {
      const c = catPorId(l.cat);
      return h('button', { class: 'item', type: 'button', onclick: () => abrirLancamento(l.id) },
        h('span', { class: 'item-emoji', 'aria-hidden': 'true', text: c.emoji }),
        h('span', { class: 'item-main' },
          h('span', { class: 'item-title', text: l.desc }),
          h('span', { class: 'item-meta' },
            h('span', { text: dateLabel(l.data) }),
            h('span', { text: c.nome }),
            l.parcelas > 1 ? h('span', { class: 'badge', text: `${l.parcelas}×` }) : null)),
        h('span', { class: 'item-amount' }, fmt(l.cents),
          l.parcelas > 1 ? h('small', { text: `${l.parcelas}× de ${fmt(Math.floor(l.cents / l.parcelas))}` }) : null));
    })));

  return [voltar, resumo, porCat, noTempo, lista];
}

/* ---------------------------------------------------------- *
 * 14. PWA: instalar no aparelho, funcionar offline, atualizar
 * ---------------------------------------------------------- */

let promptInstalar = null;   // guardado quando o navegador oferece a instalação

const ehStandalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  matchMedia('(display-mode: minimal-ui)').matches ||
  navigator.standalone === true;

const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Registra o service worker e, quando chega versão nova, mostra uma barra
 * em vez de trocar o código embaixo do pé de quem está usando.
 */
function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // service worker só roda em contexto seguro (https, localhost, 127.0.0.1);
  // abrir o index.html direto do disco não registra nada, e tudo bem.
  if (!self.isSecureContext) return;

  const barra = $('#pwa-atualizar');
  let pediuAtualizar = false;
  let recarregando = false;

  // Só recarregamos quando ELA pediu a atualização. Na primeira visita o
  // clients.claim() também dispara este evento, e recarregar ali seria um
  // susto — pior ainda se houvesse um formulário preenchido pela metade.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!pediuAtualizar || recarregando) return;
    recarregando = true;
    location.reload();
  });

  navigator.serviceWorker.register('sw.js').then((reg) => {
    const mostrarBarra = (visivel) => {
      barra.hidden = !visivel;
      document.body.classList.toggle('com-aviso', visivel);
    };

    const oferecer = (worker) => {
      if (!worker || !navigator.serviceWorker.controller) return;
      mostrarBarra(true);
      $('#pwa-atualizar-btn').onclick = () => {
        mostrarBarra(false);
        pediuAtualizar = true;
        worker.postMessage({ tipo: 'ATUALIZAR_AGORA' });
      };
      $('#pwa-atualizar-fechar').onclick = () => mostrarBarra(false);
    };

    if (reg.waiting) oferecer(reg.waiting);

    reg.addEventListener('updatefound', () => {
      const novo = reg.installing;
      if (!novo) return;
      novo.addEventListener('statechange', () => {
        if (novo.state === 'installed') oferecer(novo);
      });
    });

    // procura atualização quando o app volta para a frente, no máximo de hora em hora
    let ultimaChecagem = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaChecagem < 36e5) return;
      ultimaChecagem = Date.now();
      reg.update().catch(() => {});
    });
  }).catch((e) => console.warn('[pwa] service worker não registrado:', e));
}

function prepararInstalacao() {
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptInstalar = e;
    if (estado.rota === 'ajustes') render();
  });
  addEventListener('appinstalled', () => {
    promptInstalar = null;
    toast('App instalado. Ele agora abre direto da sua tela de início.');
    if (estado.rota === 'ajustes') render();
  });
}

/** O cartão de instalação em Ajustes muda conforme o que o aparelho permite. */
function cartaoInstalar() {
  const card = (corpo) => h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', { text: 'Instalar no aparelho' })), corpo);

  if (ehStandalone()) {
    return card(h('div', {},
      h('p', { class: 'card-sub', style: { marginBottom: '8px' } },
        '✓ O app já está instalado neste aparelho — você está usando a versão instalada.'),
      h('p', { class: 'hint', text: 'Ele abre em tela cheia e funciona sem internet. Os dados continuam sendo deste aparelho.' })));
  }

  if (promptInstalar) {
    return card(h('div', {},
      h('p', { class: 'card-sub', text: 'Instale para abrir direto da tela de início, em tela cheia e sem barra de navegador. Funciona sem internet.' }),
      h('button', {
        class: 'btn primary', type: 'button', text: '⬇ Instalar app',
        onclick: async () => {
          const p = promptInstalar;
          promptInstalar = null;
          p.prompt();
          const { outcome } = await p.userChoice;
          if (outcome !== 'accepted') toast('Sem problema — dá para instalar depois por aqui.');
          render();
        },
      })));
  }

  if (ehIOS()) {
    return card(h('div', {},
      h('p', { class: 'card-sub', text: 'No iPhone e iPad a instalação é manual, pelo Safari:' }),
      h('ol', { class: 'passos' },
        h('li', {}, 'Toque no botão de ', h('b', { text: 'compartilhar' }), ' (o quadrado com a seta para cima).'),
        h('li', {}, 'Escolha ', h('b', { text: 'Adicionar à Tela de Início' }), '.'),
        h('li', {}, 'Confirme em ', h('b', { text: 'Adicionar' }), '.')),
      h('p', { class: 'hint', text: 'Precisa ser pelo Safari — no Chrome do iPhone essa opção não aparece.' })));
  }

  return card(h('div', {},
    h('p', { class: 'card-sub', text: 'Dá para instalar e abrir direto da tela de início, sem barra de navegador.' }),
    h('ol', { class: 'passos' },
      h('li', {}, 'No ', h('b', { text: 'Android (Chrome)' }), ': menu dos três pontinhos → ', h('b', { text: 'Instalar aplicativo' }), '.'),
      h('li', {}, 'No ', h('b', { text: 'computador' }), ': o ícone de instalar do lado direito da barra de endereço.')),
    h('p', { class: 'hint', text: 'Se o botão automático não apareceu, é só usar o menu do navegador — dá no mesmo.' })));
}

/** Atalhos do ícone (segurar o app na tela de início) chegam por ?acao=… */
function tratarAtalho() {
  const acao = new URLSearchParams(location.search).get('acao');
  if (!acao) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if (acao === 'novo') { render(); abrirLancamento(); return true; }
  if (TELAS[acao]) { estado.rota = acao; return false; }
  return false;
}

/* ---------------------------------------------------------- *
 * 13. Roteador e inicialização
 * ---------------------------------------------------------- */

const TELAS = {
  mes: telaMes,
  relatorios: telaRelatorios,
  eventos: telaEventos,
  parcelas: telaParcelas,
  importar: telaImportar,
  ajustes: telaAjustes,
};

function irPara(rota) {
  estado.rota = rota;
  location.hash = '#/' + rota;
  render();
  $('#view').focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: 'instant' });
}

function render() {
  graficos = [];
  esconderTip();
  const rota = TELAS[estado.rota] ? estado.rota : 'mes';
  const view = $('#view');
  view.replaceChildren();
  append(view, [TELAS[rota]()]);

  for (const b of $('#tabs').children) {
    const ativo = b.dataset.route === rota;
    b.setAttribute('aria-current', ativo ? 'page' : 'false');
  }
  $('#fab').hidden = rota === 'importar' || rota === 'ajustes';

  requestAnimationFrame(() => graficos.forEach((g) => g.__draw && g.__draw()));
}

function iniciar() {
  aplicarTema();
  prepararInstalacao();

  const hash = (location.hash || '').replace(/^#\/?/, '');
  if (TELAS[hash]) estado.rota = hash;

  for (const b of $('#tabs').children) {
    b.addEventListener('click', () => {
      if (b.dataset.route === 'eventos') estado.eventoAberto = null;
      irPara(b.dataset.route);
    });
  }
  addEventListener('hashchange', () => {
    const r = (location.hash || '').replace(/^#\/?/, '');
    if (TELAS[r] && r !== estado.rota) { estado.rota = r; render(); }
  });

  $('#fab').addEventListener('click', () => abrirLancamento());

  $('#btn-theme').addEventListener('click', () => {
    const ordem = ['auto', 'claro', 'escuro'];
    const i = ordem.indexOf(db.prefs.tema || 'auto');
    db.prefs.tema = ordem[(i + 1) % ordem.length];
    salvar();
    aplicarTema();
    toast(`Tema: ${db.prefs.tema}`);
    if (estado.rota === 'ajustes') render();
    requestAnimationFrame(() => graficos.forEach((g) => g.__draw && g.__draw()));
  });

  // fechar o modal clicando fora do cartão
  $('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) fecharModal(); });

  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => graficos.forEach((g) => g.__draw && g.__draw()), 120);
  });

  const abriuModal = tratarAtalho();
  if (!abriuModal) render();

  registrarServiceWorker();
}

document.addEventListener('DOMContentLoaded', iniciar);
