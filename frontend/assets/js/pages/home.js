import ApiService from '../api.js';
import { renderProductCard, getCart, addToCart, updateCartQuantity, updateCartBadge } from '../main.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Afficher les catégories statiques (elles sont en dur dans le HTML)
  // Charger les produits featured
  await loadFeatured();

  // Charger et afficher les catégories dynamiques si besoin
  await loadCategories();
});

async function loadCategories() {
  try {
    const res = await ApiService.getCategories();
    const cats = res.data.filter(c => c.categorie_parente_id === null);
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    grid.innerHTML = '';
    cats.forEach(cat => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-2';
      col.innerHTML = `
        <a href="produits.html?category=${encodeURIComponent(cat.nom)}" class="cat-card d-block text-decoration-none">
          <div class="cat-icon">${cat.icone || '🌿'}</div>
          <div class="cat-name">${cat.nom}</div>
        </a>`;
      grid.appendChild(col);
    });
    // Ajouter le lien "Voir tout"
    const colAll = document.createElement('div');
    colAll.className = 'col-6 col-md-4 col-lg-2';
    colAll.innerHTML = `
      <a href="produits.html" class="cat-card d-flex flex-column align-items-center justify-content-center h-100" style="border-style:dashed;">
        <div class="cat-icon"><i class="bi bi-plus-circle" style="font-size:2rem;color:var(--primary);"></i></div>
        <div class="cat-name text-primary-custom">Voir tout</div>
      </a>`;
    grid.appendChild(colAll);
  } catch (e) { /* Affichage statique en fallback */ }
}

async function loadFeatured() {
  const loading = document.getElementById('featured-loading');
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  try {
    const res = await ApiService.getProducts('?limit=6');
    const products = res.data.slice(0, 6);
    if (loading) loading.style.display = 'none';

    if (products.length === 0) {
      grid.innerHTML = '<div class="col-12 text-center text-muted">Aucun produit disponible.</div>';
      return;
    }

    const cart = getCart();
    products.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 fade-up visible';
      col.innerHTML = renderProductCard(p, cart);
      grid.appendChild(col);
    });

    attachCartEvents(grid);
    window.addEventListener('cartUpdated', () => {
      const c = getCart();
      grid.querySelectorAll('.product-card').forEach(card => {
        const btn = card.querySelector('.btn-add-cart, .qty-selector');
        if (!btn) return;
        const id = btn.dataset.id || btn.querySelector('[data-id]')?.dataset.id;
        if (!id) return;
        const item = c.find(i => String(i.id) === String(id));
        if (item) {
          btn.outerHTML = `<div class="qty-selector"><button class="qty-btn btn-dec" data-id="${id}"><i class="bi bi-dash"></i></button><span class="qty-value">${item.quantity}</span><button class="qty-btn btn-inc" data-id="${id}"><i class="bi bi-plus"></i></button></div>`;
        } else {
          const p2 = res.data.find(x => String(x.id) === String(id));
          if (p2) btn.outerHTML = renderProductCard(p2, c);
        }
        attachCartEvents(card);
      });
    });

  } catch (e) {
    if (loading) loading.innerHTML = '<p class="text-muted">Impossible de charger les produits.</p>';
  }
}

function attachCartEvents(container) {
  container.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart({
        id: btn.dataset.id,
        libelle: btn.dataset.libelle,
        prix_unitaire: parseFloat(btn.dataset.prix),
        image_url: btn.dataset.img?.replace('http://localhost:3000', '')
      });
    });
  });
  container.querySelectorAll('.btn-inc').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.id, 1));
  });
  container.querySelectorAll('.btn-dec').forEach(btn => {
    btn.addEventListener('click', () => updateCartQuantity(btn.dataset.id, -1));
  });
}
