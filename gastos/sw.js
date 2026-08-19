/* ============================================================
   Service worker do Gastos.
   Faz o app abrir sem internet e cuidar da própria atualização.

   Regra de ouro aqui: nunca segurar uma versão velha sem avisar.
   A navegação vai primeiro na rede (então, com sinal, você sempre
   pega o código novo) e só cai no cache quando a rede falha.
   ============================================================ */
'use strict';

const VERSAO = 'gastos-2026-08-19a';
const CACHE_APP = `app-${VERSAO}`;
const CACHE_FONTES = 'fontes-v1';   // sobrevive às atualizações do app

const CASCA = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

const ehFonte = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('install', (evento) => {
  // sem skipWaiting: a versão nova espera o usuário aceitar
  evento.waitUntil(
    caches.open(CACHE_APP).then((c) => c.addAll(CASCA)).catch((e) => {
      console.warn('[sw] não consegui pré-cachear tudo:', e);
    }),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes
      .filter((n) => n.startsWith('app-') && n !== CACHE_APP)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.tipo === 'ATUALIZAR_AGORA') self.skipWaiting();
});

async function guardar(cache, req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const c = await caches.open(cache);
    await c.put(req, res.clone());
  }
  return res;
}

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const mesmaOrigem = url.origin === self.location.origin;
  if (!mesmaOrigem && !ehFonte(url)) return;

  // 1) Navegação: rede primeiro, cache como rede de segurança.
  if (req.mode === 'navigate') {
    evento.respondWith((async () => {
      try {
        const res = await fetch(req);
        await guardar(CACHE_APP, './index.html', res);
        return res;
      } catch (e) {
        const cache = await caches.open(CACHE_APP);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // 2) Fontes do Google: cache primeiro (elas nunca mudam de endereço).
  if (ehFonte(url)) {
    evento.respondWith((async () => {
      const cache = await caches.open(CACHE_FONTES);
      const salvo = await cache.match(req);
      if (salvo) return salvo;
      try {
        return await guardar(CACHE_FONTES, req, await fetch(req));
      } catch (e) {
        return salvo || Response.error();
      }
    })());
    return;
  }

  // 3) Resto do app: responde do cache e atualiza por baixo.
  evento.respondWith((async () => {
    const cache = await caches.open(CACHE_APP);
    const salvo = await cache.match(req);
    const rede = fetch(req).then((res) => guardar(CACHE_APP, req, res)).catch(() => null);
    return salvo || (await rede) || Response.error();
  })());
});
