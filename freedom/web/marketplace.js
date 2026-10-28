'use strict';
/* global BigInt */
(() => {
  const HEX_64 = /^[0-9a-f]{64}$/;

  function parsePrice(value, nanoUnits) {
    const match = typeof value === 'string' && value.trim().match(/^([0-9]+(?:[.,][0-9]{1,8})?)\s*([a-zA-Z]{2,12})?$/);
    if (!match) throw new Error('Preço deve ser um número, opcionalmente seguido de XNO (ex.: 2.5 XNO).');
    if (!nanoUnits || typeof nanoUnits.xnoToRaw !== 'function') throw new Error('Conversor local XNO/raw indisponível.');
    const decimal = match[1].replace(',', '.');
    const price = Number(decimal);
    const currency = (match[2] || 'XNO').toUpperCase();
    if (currency !== 'XNO') throw new Error('Esta vitrine usa XNO como moeda.');
    const whole = BigInt(decimal.split('.')[0]);
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
    const fractional = decimal.split('.')[1] || '';
    if (!Number.isFinite(price) || whole > maxSafe || (whole === maxSafe && /[1-9]/.test(fractional))) {
      throw new Error('Preço fora do intervalo compatível com a vitrine NIP-15.');
    }
    return Object.freeze({ price, currency, raw: nanoUnits.xnoToRaw(decimal) });
  }

  function displayPrice(product, nanoUnits) {
    const currency = typeof product?.currency === 'string' ? product.currency : '';
    let shownPrice = product?.price ?? '—';
    if (currency.toUpperCase() === 'XNO' && typeof product?.price_raw === 'string') {
      try { shownPrice = nanoUnits.rawToXno(product.price_raw); } catch {}
    }
    return `${shownPrice} ${currency}`.trim();
  }

  function safeExternalImageUrl(value) {
    if (typeof value !== 'string' || value.length > 2048) return '';
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || url.username || url.password || !hostname || hostname === 'localhost' ||
          hostname.endsWith('.localhost') || hostname.endsWith('.local') || /^\d+(?:\.\d+){3}$/.test(hostname) || hostname.startsWith('[')) return '';
      return url.href;
    } catch { return ''; }
  }

  function productAddress(event) {
    if (!event || event.kind !== 30018 || !HEX_64.test(event.pubkey || '') || !Array.isArray(event.tags)) return '';
    const ids = event.tags.filter(tag => Array.isArray(tag) && tag[0] === 'd');
    return ids.length === 1 && typeof ids[0][1] === 'string' && ids[0][1].length > 0
      ? `30018:${event.pubkey}:${ids[0][1]}` : '';
  }

  function makeProductDeletion(event) {
    const address = productAddress(event);
    if (!address || !HEX_64.test(event.id || '')) return null;
    return Object.freeze({
      kind: 5,
      content: '',
      tags: Object.freeze([Object.freeze(['a', address]), Object.freeze(['e', event.id]), Object.freeze(['k', '30018'])])
    });
  }

  function selectActiveProducts(events, verifyEvent) {
    if (typeof verifyEvent !== 'function') return [];
    const products = new Map();
    const deletions = [];
    for (const event of events || []) {
      if (!event || !verifyEvent(event)) continue;
      if (event.kind === 5 && Number.isSafeInteger(event.created_at) && Array.isArray(event.tags)) { deletions.push(event); continue; }
      if (event.kind !== 30018 || !HEX_64.test(event.id || '') || !Number.isSafeInteger(event.created_at)) continue;
      const address = productAddress(event);
      if (!address) continue;
      try {
        const data = JSON.parse(event.content);
        const d = address.slice(`30018:${event.pubkey}:`.length);
        if (!data || typeof data !== 'object' || Array.isArray(data) || data.id !== d || typeof data.stall_id !== 'string' ||
            !data.stall_id || typeof data.name !== 'string' || !data.name.trim()) continue;
        const current = products.get(address);
        if (!current || event.created_at > current.created_at ||
            (event.created_at === current.created_at && event.id.localeCompare(current.id) < 0)) {
          products.set(address, { ...event, data });
        }
      } catch {}
    }
    return [...products.values()].filter(product => {
      const address = productAddress(product);
      return !deletions.some(deletion => deletion.pubkey === product.pubkey && deletion.created_at >= product.created_at &&
        deletion.tags.some(tag => Array.isArray(tag) &&
          ((tag[0] === 'a' && tag[1] === address) || (tag[0] === 'e' && tag[1] === product.id))));
    }).sort((a, b) => b.created_at - a.created_at);
  }

  window.LiberdadeMarketplace = Object.freeze({ parsePrice, displayPrice, safeExternalImageUrl, productAddress, makeProductDeletion, selectActiveProducts });
})();
