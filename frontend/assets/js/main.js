/**
 * AgriMarket - Main JS
 * Gestion globale : thème, navbar, panier, toasts, auth UI
 */

import ApiService from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbarScroll();
  initAnimations();
  updateCartBadge();
  setupAuthUI();
});

// ---- Thème sombre/clair ----
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const saved = localStorage.getItem('agrimarket_theme') || 'light';
  applyTheme(saved);
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('agrimarket_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
}

// ---- Navbar scroll ----
function initNavbarScroll() {
  const nav = document.getElementById('main-navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ---- Animations ----
function initAnimations() {
  const els = document.querySelectorAll('.fade-up');
  if (!('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(e => obs.observe(e));
}

// ---- Panier ----
export function getCart() {
  try { return JSON.parse(localStorage.getItem('agrimarket_cart')) || []; }
  catch { return []; }
}

export function saveCart(cart) {
  localStorage.setItem('agrimarket_cart', JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new Event('cartUpdated'));
}

export function addToCart(product, quantity = 1) {
  if (!ApiService.isAuthenticated()) {
    window.location.href = 'auth.html';
    return;
  }
  const cart = getCart();
  const idx = cart.findIndex(i => String(i.id) === String(product.id));
  if (idx > -1) {
    cart[idx].quantity += quantity;
    // Mettre à jour producteur_id si manquant
    if (!cart[idx].producteur_id && product.producteur_id) {
      cart[idx].producteur_id = product.producteur_id;
    }
  } else {
    cart.push({ ...product, quantity });
  }
  saveCart(cart);
  showToast('Ajouté au panier', `${product.libelle} × ${quantity}`, 'success');
}

export function updateCartQuantity(id, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => String(i.id) === String(id));
  if (idx === -1) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  saveCart(cart);
}

export function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const total = getCart().reduce((s, i) => s + i.quantity, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

// ---- Toasts ----
export function showToast(title, message = '', type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const id = 'toast-' + Date.now();
  const icons = { success: 'bi-check-circle-fill text-success', error: 'bi-exclamation-circle-fill text-danger', warning: 'bi-exclamation-triangle-fill text-warning' };
  const icon = icons[type] || icons.success;
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast toast-custom ${type === 'error' ? 'toast-error' : ''} align-items-center mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex align-items-start p-3 gap-3">
        <i class="bi ${icon} fs-5 mt-1 flex-shrink-0"></i>
        <div class="flex-grow-1">
          <div style="font-weight:600;font-size:.9rem;">${title}</div>
          ${message ? `<div style="font-size:.82rem;color:var(--text-muted);margin-top:2px;">${message}</div>` : ''}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="toast" style="font-size:.7rem;"></button>
      </div>
    </div>
  `);
  const el = document.getElementById(id);
  if (typeof bootstrap !== 'undefined') {
    new bootstrap.Toast(el, { delay: 3500 }).show();
  }
}

// ---- Auth UI ----
function setupAuthUI() {
  const authLink = document.getElementById('nav-auth-link');
  const userMenu = document.getElementById('nav-user-menu');
  const logoutBtn = document.getElementById('btn-logout');

  if (ApiService.isAuthenticated()) {
    if (authLink) authLink.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
  } else {
    if (authLink) authLink.style.display = '';
    if (userMenu) userMenu.style.display = 'none';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => { e.preventDefault(); ApiService.logout(); });
  }
}

// Utilitaire image produit
export function getProductImg(product) {
  if (product.image_url) return `http://localhost:3000${product.image_url}`;
  return 'assets/images/veg.png';
}

// Utilitaire carte produit HTML
export function renderProductCard(p, cart) {
  const imgSrc = getProductImg(p);
  const catNom = p.categorie ? p.categorie.nom : 'Divers';
  const cartItem = cart.find(i => String(i.id) === String(p.id));

  let actionBtn;
  if (cartItem) {
    actionBtn = `
      <div class="qty-selector">
        <button class="qty-btn btn-dec" data-id="${p.id}"><i class="bi bi-dash"></i></button>
        <span class="qty-value">${cartItem.quantity}</span>
        <button class="qty-btn btn-inc" data-id="${p.id}"><i class="bi bi-plus"></i></button>
      </div>`;
  } else {
    const producteurId = p.producteur_id || (p.producteur ? p.producteur.id : '');
    actionBtn = `<button class="btn-green w-100 btn-add-cart" 
          data-id="${p.id}" 
          data-libelle="${p.libelle}" 
          data-prix="${p.prix_unitaire}" 
          data-img="${imgSrc}"
          data-producteur="${p.producteur_id}"
          style="padding:8px;font-size:.85rem;justify-content:center;">
          <i class="bi bi-plus-lg me-1"></i> Ajouter
         </button>`;
  }

  return `
    <div class="product-card">
      <span class="product-badge-cat">${catNom}</span>
      <div class="product-img-wrapper">
        <a href="produit-detail.html?id=${p.id}" onclick="localStorage.setItem('agrimarket_current_product', '${p.id}')">
          <img src="${imgSrc}" alt="${p.libelle}" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;color:var(--muted);\\'><i class=\\'bi bi-image\\'></i></div>'">
        </a>
      </div>
      <div class="product-body">
        <div class="product-seller"><i class="bi bi-geo-alt me-1"></i>${p.region || 'Origine locale'}</div>
        <div class="product-title"><a href="produit-detail.html?id=${p.id}" onclick="localStorage.setItem('agrimarket_current_product', '${p.id}')" style="color:inherit;text-decoration:none;">${p.libelle}</a></div>
        <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${p.description || ''}</p>
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:14px;">
          <span class="product-price">${Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA</span>
          <span class="product-unit">/ ${p.unite || 'unité'}</span>
        </div>
        ${actionBtn}
      </div>
    </div>`;
}
