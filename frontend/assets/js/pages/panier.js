import ApiService from '../api.js';
import { getCart, saveCart, showToast, updateCartBadge } from '../main.js';

document.addEventListener('DOMContentLoaded', () => {
  const itemsContainer = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('cart-empty');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');
  const btnCheckout = document.getElementById('btn-checkout');
  const checkoutAlert = document.getElementById('checkout-alert');

  let cart = getCart();
  render();

  function render() {
    cart = getCart();
    itemsContainer.innerHTML = '';

    if (cart.length === 0) {
      emptyMsg.classList.remove('d-none');
      subtotalEl.textContent = '0 FCFA';
      totalEl.textContent = '0 FCFA';
      btnCheckout.disabled = true;
      return;
    }

    emptyMsg.classList.add('d-none');
    btnCheckout.disabled = false;
    let total = 0;

    cart.forEach((item, idx) => {
      const prix = parseFloat(item.prix_unitaire) || parseFloat(item.prix) || 0;
      const itemTotal = prix * item.quantity;
      total += itemTotal;
      const img = item.image_url ? `http://localhost:3000${item.image_url}` : null;

      itemsContainer.insertAdjacentHTML('beforeend', `
        <div class="cart-item-row" data-idx="${idx}">
          <div style="width:80px;height:80px;border-radius:12px;overflow:hidden;background:var(--secondary);flex-shrink:0;">
            ${img
              ? `<img src="${img}" alt="${item.libelle}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=&quot;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.8rem;&quot;></div>'">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--primary-bg);"><svg width="32" height="32" viewBox="0 0 24 24" fill="var(--primary)"><path d="M17 8C8 10 5.9 16.17 3.82 19.11A1 1 0 0 0 5 20.5C6.5 17 9 14.5 11 14c-1 2-2 4-1.5 6.5.5 2.5 3.5 2.5 4.5.5 2.5-5 1.5-11 3-12.5z"/></svg></div>`}
          </div>
          <div style="flex:1;min-width:0;">
            <a href="produit-detail.html?id=${item.id}" style="font-weight:600;color:var(--text-main);text-decoration:none;display:block;margin-bottom:4px;">${item.libelle}</a>
            <div style="color:var(--primary);font-weight:700;font-size:.9rem;margin-bottom:10px;">${prix.toLocaleString('fr-FR')} FCFA / unité</div>
            <div style="display:flex;align-items:center;gap:12px;">
              <button class="qty-btn-minus" data-idx="${idx}" style="width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">−</button>
              <span style="font-weight:700;min-width:20px;text-align:center;">${item.quantity}</span>
              <button class="qty-btn-plus" data-idx="${idx}" style="width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">+</button>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-weight:800;font-size:1.05rem;margin-bottom:8px;">${itemTotal.toLocaleString('fr-FR')} FCFA</div>
            <button class="qty-btn-remove" data-idx="${idx}" style="border:none;background:none;color:#ef4444;font-size:.82rem;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Retirer
            </button>
          </div>
        </div>
      `);
    });

    subtotalEl.textContent = `${total.toLocaleString('fr-FR')} FCFA`;
    totalEl.textContent = `${total.toLocaleString('fr-FR')} FCFA`;

    // Bind events
    itemsContainer.querySelectorAll('.qty-btn-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx);
        if (cart[i].quantity > 1) { cart[i].quantity--; saveCart(cart); render(); }
      });
    });
    itemsContainer.querySelectorAll('.qty-btn-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx);
        cart[i].quantity++;
        saveCart(cart);
        render();
      });
    });
    itemsContainer.querySelectorAll('.qty-btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx);
        cart.splice(i, 1);
        saveCart(cart);
        showToast('Article retiré', '', 'warning');
        render();
      });
    });
  }

  // ---- CHECKOUT ----
  // Le backend attend: { producteur_id, adresse_livraison, notes, lignes: [{produit_id, quantite}] }
  // Chaque ligne doit avoir un producteur_id. On regroupe par producteur.
  btnCheckout.addEventListener('click', async () => {
    checkoutAlert.classList.add('d-none');

    if (!ApiService.isAuthenticated()) {
      showAlert('warning', 'Vous devez vous <a href="auth.html">connecter</a> pour passer commande.');
      return;
    }

    // Vérifier que tous les articles ont un producteur_id
    const missingProducteur = cart.find(i => !i.producteur_id);
    if (missingProducteur) {
      showAlert('warning', `Le produit "${missingProducteur.libelle}" n'a pas d'information sur le producteur. Veuillez le retirer et l'ajouter depuis la fiche produit.`);
      return;
    }

    // Grouper les lignes par producteur_id
    const groupes = {};
    cart.forEach(item => {
      const pid = item.producteur_id;
      if (!groupes[pid]) groupes[pid] = [];
      groupes[pid].push({
        produit_id: parseInt(item.id),
        quantite: item.quantity
      });
    });

    btnCheckout.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;margin-right:8px;"></span>Traitement...';
    btnCheckout.disabled = true;

    const user = ApiService.getUser();
    const adresse = user?.adresse || 'Adresse par défaut';

    try {
      // Envoyer une commande par groupe de producteur
      const promises = Object.entries(groupes).map(([producteur_id, lignes]) =>
        ApiService.createCommande({
          producteur_id: parseInt(producteur_id),
          adresse_livraison: adresse,
          notes: '',
          lignes
        })
      );

      await Promise.all(promises);

      // Vider le panier
      saveCart([]);
      render();
      showToast('Commande passée !', 'Votre commande a bien été enregistrée en base de données.', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 2500);

    } catch (err) {
      showAlert('danger', err.message || 'Une erreur est survenue lors de la commande.');
      btnCheckout.innerHTML = 'Commander';
      btnCheckout.disabled = false;
    }
  });

  function showAlert(type, html) {
    checkoutAlert.innerHTML = html;
    checkoutAlert.className = `alert alert-${type} mt-3`;
    checkoutAlert.style.borderRadius = '10px';
    checkoutAlert.style.fontSize = '.85rem';
    checkoutAlert.classList.remove('d-none');
  }
});
