import ApiService from '../api.js';
import { getCart, addToCart, updateCartQuantity, renderProductCard } from '../main.js';

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('productsGrid');
  const loadingEl = document.getElementById('productsLoading');
  const errorEl = document.getElementById('productsError');
  const emptyEl = document.getElementById('productsEmpty');
  const searchInput = document.getElementById('searchInput');
  const categoriesContainer = document.getElementById('categoriesFilter');
  const btnReset = document.getElementById('btnResetFilters');
  const resultsCount = document.getElementById('results-count');

  let allProducts = [];
  let allCategories = [];
  let currentCategory = '';

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search') || '';
  const categoryParam = urlParams.get('category') || '';

  init();

  async function init() {
    await loadCategories();
    await loadProducts();
    setupEvents();
  }

  async function loadCategories() {
    try {
      const res = await ApiService.getCategories();
      allCategories = res.data;
      const mains = allCategories.filter(c => c.categorie_parente_id === null);
      const iconsMap = {
        'Légumes': '<i class="bi bi-tree me-2"></i>',
        'Fruits': '<i class="bi bi-flower2 me-2"></i>',
        'Céréales': '<i class="bi bi-moisture me-2"></i>',
        'Tubercules': '<i class="bi bi-layers me-2"></i>',
        'Épices': '<i class="bi bi-stars me-2"></i>'
      };
      categoriesContainer.innerHTML = '';
      mains.forEach(cat => {
        const checked = categoryParam === cat.nom ? 'checked' : '';
        if (checked) currentCategory = cat.nom;
        const displayIcon = iconsMap[cat.nom] || '<i class="bi bi-circle me-2"></i>';
        categoriesContainer.insertAdjacentHTML('beforeend', `
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="category" id="cat${cat.id}" value="${cat.nom}" ${checked} style="border-color:var(--primary);cursor:pointer;">
            <label class="form-check-label" for="cat${cat.id}" style="font-size:.88rem;cursor:pointer;color:var(--text-main);">
              ${displayIcon} ${cat.nom}
            </label>
          </div>
        `);
      });

      categoriesContainer.querySelectorAll('input[name="category"]').forEach(r => {
        r.addEventListener('change', e => {
          currentCategory = e.target.value;
          filterAndRender();
        });
      });
    } catch {
      categoriesContainer.innerHTML = '<p style="font-size:.82rem;" class="text-muted">Erreur chargement</p>';
    }
  }

  async function loadProducts() {
    try {
      loadingEl.style.display = 'flex';
      errorEl.classList.add('d-none');
      grid.innerHTML = '';

      const res = await ApiService.getProducts();
      allProducts = res.data || [];

      if (searchParam) searchInput.value = searchParam;
      if (categoryParam) currentCategory = categoryParam;

      filterAndRender();
    } catch {
      loadingEl.style.display = 'none';
      errorEl.classList.remove('d-none');
    }
  }

  function filterAndRender() {
    const term = searchInput.value.toLowerCase().trim();
    const validNames = getValidCatNames(currentCategory);

    const filtered = allProducts.filter(p => {
      const matchSearch = !term ||
        p.libelle.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term));
      const catNom = p.categorie ? p.categorie.nom : '';
      const matchCat = !currentCategory || validNames.includes(catNom);
      return matchSearch && matchCat;
    });

    renderProducts(filtered);
  }

  function getValidCatNames(catName) {
    if (!catName) return [];
    const obj = allCategories.find(c => c.nom === catName);
    const names = [catName];
    if (obj && obj.sous_categories) {
      obj.sous_categories.forEach(s => names.push(s.nom));
    }
    return names;
  }

  function renderProducts(products) {
    loadingEl.style.display = 'none';
    grid.innerHTML = '';

    if (products.length === 0) {
      emptyEl.classList.remove('d-none');
      if (resultsCount) resultsCount.textContent = '';
      return;
    }

    emptyEl.classList.add('d-none');
    if (resultsCount) resultsCount.textContent = `${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''}`;

    const cart = getCart();
    products.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-xl-4';
      col.innerHTML = renderProductCard(p, cart);
      grid.appendChild(col);
    });

    attachEvents();
  }

  function attachEvents() {
    grid.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart({
          id: btn.dataset.id,
          libelle: btn.dataset.libelle,
          prix_unitaire: parseFloat(btn.dataset.prix),
          image_url: btn.dataset.img?.replace('http://localhost:3000', ''),
          producteur_id: parseInt(btn.dataset.producteur) || null
        });
      });
    });
    grid.querySelectorAll('.btn-inc').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.id, 1));
    });
    grid.querySelectorAll('.btn-dec').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.id, -1));
    });
  }

  function setupEvents() {
    searchInput.addEventListener('input', () => filterAndRender());

    btnReset.addEventListener('click', () => {
      searchInput.value = '';
      currentCategory = '';
      categoriesContainer.querySelectorAll('input[name="category"]').forEach(r => r.checked = false);
      window.history.replaceState(null, '', 'produits.html');
      filterAndRender();
    });

    window.addEventListener('cartUpdated', () => filterAndRender());
  }
});
