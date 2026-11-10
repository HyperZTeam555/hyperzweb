'use strict';

// HyperZWeb service worker, deployed as sw.js next to HyperZWeb.html/index.html.
// HyperZProxy.js also serves this worker from its built-in route.
//
// Add the COOP/COEP headers that turn the top-level
// HyperZWeb document into a cross-origin isolated context. That is required so
// an embedded Firefox WASM iframe can use SharedArrayBuffer/JSPI.
//
// The page path is passed in the registration query so this worker only
// rewrites the HyperZWeb document, not every navigation in its scope.
var selfUrl = new URL(self.location.href);
var pagePath = selfUrl.searchParams.get('page') || '';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  if (event.request.mode !== 'navigate') return;
  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (pagePath && url.pathname !== pagePath) return;

  event.respondWith(fetch(event.request).then(function (response) {
    var headers = new Headers(response.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    // fetch() exposes the decoded body; do not let the browser decode it again.
    headers.delete('Content-Length');
    headers.delete('Content-Encoding');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }));
});
