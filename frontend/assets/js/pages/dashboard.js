import ApiService from '../api.js';
import { showToast } from '../main.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!ApiService.isAuthenticated()) { window.location.href = 'auth.html'; return; }

  const user = ApiService.getUser();
  if (!user) { ApiService.logout(); return; }

  const role = (user.role || 'acheteur').toLowerCase();

  // Profil UI
  const fullName = user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email;
  document.getElementById('user-name').textContent = fullName;
  document.getElementById('profile-name').textContent = fullName;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-role').textContent = role.charAt(0).toUpperCase() + role.slice(1);

  const badge = document.getElementById('user-role-badge');
  badge.className = "px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-widest";
  badge.textContent = role.charAt(0).toUpperCase() + role.slice(1);

  // Menus par rôle
  document.getElementById('btn-view-orders').classList.remove('d-none');
  if (role === 'producteur' || role === 'admin') {
    document.getElementById('btn-view-sales').classList.remove('d-none');
    document.getElementById('btn-view-products').classList.remove('d-none');
  }
  if (role === 'admin') {
    document.getElementById('btn-view-all-orders').classList.remove('d-none');
    document.getElementById('btn-view-users').classList.remove('d-none');
  }

  // Navigation
  const menuBtns = document.querySelectorAll('.dash-nav-link');
  const sections = document.querySelectorAll('.view-section');

  menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(target).classList.add('active');
      
      if (target === 'view-orders') loadOrders();
      if (target === 'view-sales') loadSales();
      if (target === 'view-products') loadMyProducts();
      if (target === 'view-all-orders') loadAllOrders();
      if (target === 'view-users') loadUsers();
    });
  });

  // ---- MES ACHATS ----
  async function loadOrders() {
    try {
      const res = await ApiService.getCommandes();
      const orders = res.data || [];
      document.getElementById('orders-loading').classList.add('d-none');
      const tbody = document.getElementById('orders-tbody');
      tbody.innerHTML = '';

      if (orders.length === 0) {
        document.getElementById('orders-empty').classList.remove('d-none');
        return;
      }
      document.getElementById('orders-list').classList.remove('d-none');

      orders.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString('fr-FR');
        let action = '';
        if (o.statut === 'en_attente') {
          action = `<button class="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors btn-cancel" data-id="${o.id}">Annuler</button>`;
        } else if (o.statut === 'livree') {
          action = `<button class="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors btn-eval" data-cid="${o.id}">Évaluer</button>`;
        }
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="group hover:bg-emerald-50/50 transition-colors">
            <td class="py-6 text-sm font-black text-emerald-950">#${o.id}</td>
            <td class="py-6 text-sm font-bold text-emerald-900">${date}</td>
            <td class="py-6 text-sm font-black text-emerald-950">${Number(o.total_montant).toLocaleString('fr-FR')} <span class="text-[10px] text-emerald-500">FCFA</span></td>
            <td class="py-6 text-center">${statusBadge(o.statut)}</td>
            <td class="py-6 text-right">${action}</td>
          </tr>`);
      });

      tbody.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Annuler cette commande ?')) return;
          try { await ApiService.updateOrderStatus(btn.dataset.id, 'annulee'); showToast('Commande annulée', '', 'success'); loadOrders(); }
          catch (e) { showToast('Erreur', e.message, 'error'); }
        });
      });
      tbody.querySelectorAll('.btn-eval').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('eval-commande-id').value = btn.dataset.cid;
          new bootstrap.Modal(document.getElementById('evalModal')).show();
        });
      });
    } catch (e) {
      document.getElementById('orders-loading').innerHTML = '<span class="text-red-500 font-bold text-sm">Erreur de chargement</span>';
    }
  }

  // ---- MES VENTES ----
  async function loadSales() {
    try {
      const res = await ApiService.getCommandes();
      const sales = res.data || [];
      document.getElementById('sales-loading').classList.add('d-none');
      const tbody = document.getElementById('sales-tbody');
      tbody.innerHTML = '';

      if (sales.length === 0) {
        document.getElementById('sales-empty').classList.remove('d-none');
        return;
      }
      document.getElementById('sales-list').classList.remove('d-none');

      let totalRev = 0;
      sales.forEach(s => {
        totalRev += parseFloat(s.total_montant);
        const date = new Date(s.createdAt).toLocaleDateString('fr-FR');
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="group hover:bg-emerald-50/50 transition-colors">
            <td class="py-6 text-sm font-black text-emerald-950">#${s.id}</td>
            <td class="py-6 text-xs font-bold text-emerald-600">ID: ${s.acheteur_id}</td>
            <td class="py-6 text-sm font-bold text-emerald-900">${date}</td>
            <td class="py-6 text-sm font-black text-emerald-950">${Number(s.total_montant).toLocaleString('fr-FR')} <span class="text-[10px] text-emerald-500">FCFA</span></td>
            <td class="py-6 text-center">${statusBadge(s.statut)}</td>
            <td class="py-6 text-right">
              <button class="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors btn-change-status" data-id="${s.id}" data-statut="${s.statut}">
                Modifier
              </button>
            </td>
          </tr>`);
      });

      document.getElementById('sales-revenue').textContent = `${totalRev.toLocaleString('fr-FR')} FCFA`;

      tbody.querySelectorAll('.btn-change-status').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('status-order-id').value = btn.dataset.id;
          document.getElementById('status-select').value = btn.dataset.statut;
          new bootstrap.Modal(document.getElementById('statusModal')).show();
        });
      });
    } catch {
      document.getElementById('sales-loading').innerHTML = '<span class="text-red-500 font-bold text-sm">Erreur de chargement</span>';
    }
  }

  // Stats rapides
  async function loadStats() {
    const cardsEl = document.getElementById('stat-cards');
    if (!cardsEl) return;
    
    const loadingHtml = '<div class="col-span-full py-10 text-center"><div class="spinner-border text-emerald-500"></div></div>';
    cardsEl.innerHTML = loadingHtml;

    try {
      if (role === 'acheteur') {
        const res = await ApiService.getCommandes();
        const orders = res.data || [];
        const validOrders = orders.filter(o => o.statut !== 'annulee');
        const totalSpent = validOrders.reduce((sum, o) => sum + parseFloat(o.total_montant), 0);

        cardsEl.innerHTML = `
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-bag-check"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Commandes passées</p>
              <p class="text-3xl font-black text-emerald-950">${validOrders.length}</p>
            </div>
          </div>
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-wallet2"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total des dépenses</p>
              <p class="text-3xl font-black text-emerald-950">${totalSpent.toLocaleString('fr-FR')} <span class="text-sm text-emerald-600">FCFA</span></p>
            </div>
          </div>
        `;
      } else if (role === 'producteur') {
        const resOrders = await ApiService.getCommandes();
        const orders = resOrders.data || [];
        const validSales = orders.filter(o => o.statut !== 'annulee');
        const totalRevenue = validSales.reduce((sum, o) => sum + parseFloat(o.total_montant), 0);

        const resProducts = await ApiService.getProducts(`?producteur_id=${user.id}&limit=100`);
        const myProducts = resProducts.data || [];

        cardsEl.innerHTML = `
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-graph-up-arrow"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Revenus générés</p>
              <p class="text-3xl font-black text-emerald-950">${totalRevenue.toLocaleString('fr-FR')} <span class="text-sm text-emerald-600">FCFA</span></p>
            </div>
          </div>
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-box-seam"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Produits en ligne</p>
              <p class="text-3xl font-black text-emerald-950">${myProducts.length}</p>
            </div>
          </div>
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-cart-check"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Ventes réalisées</p>
              <p class="text-3xl font-black text-emerald-950">${validSales.length}</p>
            </div>
          </div>
        `;
      } else if (role === 'admin') {
        const resOrders = await ApiService.getCommandes();
        const orders = resOrders.data || [];
        const totalVolume = orders.reduce((sum, o) => sum + parseFloat(o.total_montant), 0);

        const resUsers = await ApiService.getUsers();
        const usersCount = (resUsers.data || []).length;

        cardsEl.innerHTML = `
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-people"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Utilisateurs inscrits</p>
              <p class="text-3xl font-black text-emerald-950">${usersCount}</p>
            </div>
          </div>
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-activity"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Commandes globales</p>
              <p class="text-3xl font-black text-emerald-950">${orders.length}</p>
            </div>
          </div>
          <div class="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl text-emerald-600"><i class="bi bi-cash-stack"></i></div>
            <div>
              <p class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Volume d'affaires</p>
              <p class="text-3xl font-black text-emerald-950">${totalVolume.toLocaleString('fr-FR')} <span class="text-sm text-emerald-600">FCFA</span></p>
            </div>
          </div>
        `;
      }
    } catch (e) {
      cardsEl.innerHTML = '<div class="col-span-full py-10 text-center"><span class="text-red-500 font-bold text-sm">Impossible de charger les statistiques.</span></div>';
    }
  }

  loadStats();

  // ---- MON CATALOGUE ----
  async function loadCategories() {
    try {
      const res = await ApiService.getCategories();
      const categories = res.data || [];
      const select = document.getElementById('ap-cat');
      if (!select) return;
      select.innerHTML = '<option value="" disabled selected>Choisir une catégorie...</option>';
      categories.forEach(c => {
        select.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.nom}</option>`);
      });
    } catch (e) {
      console.error('Erreur chargement catégories', e);
    }
  }

  // Initialisation des catégories si producteur
  if (role === 'producteur') {
    loadCategories();
  }

  async function loadMyProducts() {
    try {
      const res = await ApiService.getProducts(`?producteur_id=${user.id}&limit=100`);
      const products = res.data || [];
      document.getElementById('products-loading').classList.add('d-none');
      const grid = document.getElementById('products-grid');
      grid.innerHTML = '';

      if (products.length === 0) {
        document.getElementById('products-empty').classList.remove('d-none');
        return;
      }

      products.forEach(p => {
        const img = p.image_url ? `http://localhost:3000${p.image_url}` : '';
        grid.insertAdjacentHTML('beforeend', `
          <div class="bg-emerald-50 rounded-3xl p-4 border border-emerald-100 flex flex-col group">
            <div class="relative overflow-hidden rounded-2xl mb-4">
              ${img ? `<img src="${img}" class="w-full h-40 object-cover transform group-hover:scale-110 transition-transform duration-500" onerror="this.style.display='none'">` : `<div class="w-full h-40 bg-white flex items-center justify-center text-4xl text-emerald-200"><i class="bi bi-image"></i></div>`}
            </div>
            <div class="flex-1 px-2">
              <h4 class="text-lg font-black text-emerald-950 mb-1">${p.libelle}</h4>
              <p class="text-emerald-600 font-bold mb-2">${Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA / ${p.unite}</p>
              <p class="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-4">Stock: ${p.quantite_disponible}</p>
            </div>
            <button class="w-full py-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors btn-delete-product" data-id="${p.id}">
              <i class="bi bi-trash3 mr-2"></i> Supprimer
            </button>
          </div>`);
      });

      grid.querySelectorAll('.btn-delete-product').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Supprimer ce produit ?')) return;
          try { await ApiService.deleteProduct(btn.dataset.id); showToast('Produit supprimé', '', 'success'); loadMyProducts(); loadStats(); }
          catch (e) { showToast('Erreur', e.message, 'error'); }
        });
      });
    } catch {
      document.getElementById('products-loading').innerHTML = '<span class="text-red-500 font-bold text-sm">Erreur de chargement</span>';
    }
  }

  // ---- ADMIN: TOUTES COMMANDES ----
  async function loadAllOrders() {
    try {
      const res = await ApiService.getCommandes();
      const orders = res.data || [];
      document.getElementById('all-orders-loading').classList.add('d-none');
      const tbody = document.getElementById('all-orders-tbody');
      tbody.innerHTML = '';
      document.getElementById('all-orders-list').classList.remove('d-none');
      
      orders.forEach(o => {
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="group hover:bg-emerald-50/50 transition-colors">
            <td class="py-6 text-sm font-black text-emerald-950">#${o.id}</td>
            <td class="py-6 text-xs font-bold text-emerald-600">ID: ${o.acheteur_id}</td>
            <td class="py-6 text-sm font-black text-emerald-950">${Number(o.total_montant).toLocaleString('fr-FR')} <span class="text-[10px] text-emerald-500">FCFA</span></td>
            <td class="py-6 text-center">${statusBadge(o.statut)}</td>
            <td class="py-6 text-sm font-bold text-emerald-900 text-right">${new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
          </tr>`);
      });
    } catch {
      document.getElementById('all-orders-loading').innerHTML = '<span class="text-red-500 font-bold text-sm">Erreur de chargement</span>';
    }
  }

  // ---- ADMIN: UTILISATEURS ----
  async function loadUsers() {
    try {
      const res = await ApiService.getUsers();
      const users = res.data || [];
      document.getElementById('users-loading').classList.add('d-none');
      const tbody = document.getElementById('users-tbody');
      tbody.innerHTML = '';
      document.getElementById('users-list').classList.remove('d-none');
      
      users.forEach(u => {
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="group hover:bg-emerald-50/50 transition-colors">
            <td class="py-6 text-sm font-black text-emerald-950">${u.prenom} ${u.nom}</td>
            <td class="py-6 text-sm font-bold text-emerald-700">${u.email}</td>
            <td class="py-6 text-center">${statusBadge(u.role, true)}</td>
            <td class="py-6 text-sm font-bold text-emerald-900 text-right">${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
          </tr>`);
      });
    } catch {
      document.getElementById('users-loading').innerHTML = '<span class="text-red-500 font-bold text-sm">Erreur de chargement</span>';
    }
  }

  // ---- FORM : AJOUTER PRODUIT ----
  document.getElementById('form-add-product').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-product');
    btn.innerHTML = '<div class="spinner-border spinner-border-sm text-white"></div>';
    btn.disabled = true;

    const fd = new FormData();
    fd.append('libelle', document.getElementById('ap-libelle').value);
    fd.append('prix_unitaire', document.getElementById('ap-prix').value);
    fd.append('quantite_disponible', document.getElementById('ap-qte').value);
    fd.append('unite', document.getElementById('ap-unite').value);
    fd.append('categorie_id', document.getElementById('ap-cat').value);
    const desc = document.getElementById('ap-description').value;
    if (desc) fd.append('description', desc);
    const date = document.getElementById('ap-date-recolte').value;
    if (date) fd.append('date_recolte', date);
    const img = document.getElementById('ap-image').files[0];
    if (img) fd.append('image', img);

    try {
      await ApiService.createProduct(fd);
      showToast('Produit publié !', 'Votre produit est visible dans le catalogue.', 'success');
      bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
      document.getElementById('form-add-product').reset();
      loadMyProducts();
      loadStats();
    } catch (err) {
      showToast('Erreur', err.message, 'error');
    } finally {
      btn.innerHTML = '<i class="bi bi-plus-circle"></i> Publier le produit';
      btn.disabled = false;
    }
  });

  // ---- SAVE STATUT ----
  document.getElementById('btn-save-status').addEventListener('click', async () => {
    const id = document.getElementById('status-order-id').value;
    const statut = document.getElementById('status-select').value;
    try {
      await ApiService.updateOrderStatus(id, statut);
      showToast('Statut mis à jour', '', 'success');
      bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
      loadSales();
    } catch (e) { showToast('Erreur', e.message, 'error'); }
  });

  // ---- SAVE EVAL ----
  document.getElementById('btn-save-eval').addEventListener('click', async () => {
    try {
      await ApiService.submitEvaluation({
        commande_id: document.getElementById('eval-commande-id').value,
        note: document.getElementById('eval-note').value,
        commentaire: document.getElementById('eval-comment').value
      });
      showToast('Merci !', 'Votre évaluation a été envoyée.', 'success');
      bootstrap.Modal.getInstance(document.getElementById('evalModal')).hide();
    } catch (e) { showToast('Erreur', e.message, 'error'); }
  });
  
  // Logout handler
  document.getElementById('btn-logout').addEventListener('click', (e) => {
      e.preventDefault();
      ApiService.logout();
  });

  // ---- Utilities ----
  function statusBadge(statut, isRole = false) {
    if (isRole) {
      const c = { admin: 'bg-red-50 text-red-700 border-red-100', producteur: 'bg-emerald-50 text-emerald-700 border-emerald-100', acheteur: 'bg-blue-50 text-blue-700 border-blue-100' };
      return `<span class="inline-flex items-center px-4 py-1.5 ${c[statut] || 'bg-gray-50 text-gray-700 border-gray-100'} text-[10px] font-black rounded-xl border uppercase tracking-widest">${statut}</span>`;
    }
    const map = {
      en_attente: 'bg-yellow-50 text-yellow-700 border-yellow-100', 
      confirmee: 'bg-blue-50 text-blue-700 border-blue-100',
      en_preparation: 'bg-purple-50 text-purple-700 border-purple-100', 
      expediee: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      livree: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
      annulee: 'bg-red-50 text-red-700 border-red-100'
    };
    const labels = {
      en_attente: 'En attente', confirmee: 'Confirmée',
      en_preparation: 'En préparation', expediee: 'Expédiée',
      livree: 'Livrée', annulee: 'Annulée'
    };
    return `<span class="inline-flex items-center px-4 py-1.5 ${map[statut] || 'bg-gray-50 text-gray-700 border-gray-100'} text-[10px] font-black rounded-xl border uppercase tracking-widest">${labels[statut] || statut}</span>`;
  }
});
