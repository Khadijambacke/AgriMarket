import ApiService from '../api.js';
import { addToCart } from '../main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const contentEl = document.getElementById('product-content');

  let id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    id = localStorage.getItem('agrimarket_current_product');
  }
  if (!id) { showError(); return; }

  let product = null;
  let qty = 1;

  try {
    const res = await ApiService.getProductById(id);
    product = res.data;
    render(product);
  } catch {
    showError();
  }

  function showError() {
    loadingEl.classList.add('d-none');
    errorEl.classList.remove('d-none');
  }

  function render(p) {
    loadingEl.classList.add('d-none');
    contentEl.classList.remove('d-none');
    document.title = `${p.libelle} | AgriMarket`;

    document.getElementById('pd-category').textContent = p.categorie ? p.categorie.nom : 'Produit';
    document.getElementById('pd-title').textContent = p.libelle;
    document.getElementById('pd-price').textContent = `${Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA`;
    document.getElementById('pd-unit').textContent = `/ ${p.unite || 'unité'}`;
    document.getElementById('pd-description').textContent = p.description || 'Produit frais de qualité agricole, directement du producteur.';
    document.getElementById('pd-region').textContent = p.region || 'Origine locale';

    const stockEl = document.getElementById('pd-stock');
    if (Number(p.quantite_disponible) > 0) {
      stockEl.textContent = `${Number(p.quantite_disponible)} disponible(s)`;
      stockEl.style.color = 'var(--primary)';
    } else {
      stockEl.textContent = 'Rupture de stock';
      stockEl.style.color = '#ef4444';
      document.getElementById('btn-add').disabled = true;
    }

    if (p.producteur) {
      document.getElementById('pd-vendeur').textContent = `${p.producteur.prenom} ${p.producteur.nom}`;
      loadEvaluations(p.producteur.id);
    } else {
      document.getElementById('pd-vendeur-row').style.display = 'none';
      document.getElementById('evaluations-loading').classList.add('d-none');
      document.getElementById('evaluations-empty').classList.remove('d-none');
    }

    const imgSrc = p.image_url ? `http://localhost:3000${p.image_url}` : '';
    const imgEl = document.getElementById('pd-image');
    if (imgSrc) {
      imgEl.src = imgSrc;
      imgEl.onerror = () => { imgEl.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:5rem;"><i class="bi bi-image text-muted"></i></div>'; };
    } else {
      imgEl.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:6rem;"><i class="bi bi-image text-muted"></i></div>';
    }
  }

  async function loadEvaluations(producteurId) {
    try {
      const res = await ApiService.getProducteurEvaluations(producteurId);
      const evals = res.data || [];
      document.getElementById('evaluations-loading').classList.add('d-none');
      
      if (evals.length === 0) {
        document.getElementById('evaluations-empty').classList.remove('d-none');
        return;
      }
      
      const listEl = document.getElementById('evaluations-list');
      listEl.innerHTML = '';
      listEl.classList.remove('d-none');
      
      let sum = 0;
      evals.forEach(e => {
        sum += e.note;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
          starsHtml += `<i class="bi bi-star-fill" style="color:${i <= e.note ? '#fbbf24' : '#e5e7eb'};font-size:.9rem;margin-right:2px;"></i>`;
        }
        
        const date = new Date(e.createdAt).toLocaleDateString('fr-FR');
        const name = e.evaluateur ? `${e.evaluateur.prenom} ${e.evaluateur.nom}` : 'Utilisateur anonyme';
        
        listEl.insertAdjacentHTML('beforeend', `
          <div style="background:#fff;border:1.5px solid var(--border);border-radius:1rem;padding:20px;margin-bottom:16px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex align-items-center gap-3">
                <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:bold;">
                  ${name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style="font-weight:700;color:var(--text-main);font-size:.95rem;">${name}</div>
                  <div style="color:var(--text-muted);font-size:.8rem;">${date}</div>
                </div>
              </div>
              <div>${starsHtml}</div>
            </div>
            ${e.commentaire ? `<p style="margin:0;color:var(--text-main);font-size:.95rem;line-height:1.6;">${e.commentaire}</p>` : `<p style="margin:0;color:var(--text-muted);font-style:italic;font-size:.9rem;">Aucun commentaire fourni.</p>`}
          </div>
        `);
      });
      
      const avg = (sum / evals.length).toFixed(1);
      const statsEl = document.getElementById('evaluations-stats');
      statsEl.innerHTML = `<i class="bi bi-star-fill text-warning me-2"></i>${avg} / 5 <span style="font-size:.9rem;color:var(--text-muted);font-weight:normal;">(${evals.length} avis)</span>`;
      statsEl.classList.remove('d-none');
      
    } catch (e) {
      console.error(e);
      document.getElementById('evaluations-loading').innerHTML = '<span class="text-danger">Impossible de charger les avis.</span>';
    }
  }

  // Qty controls
  document.getElementById('btn-minus').addEventListener('click', () => {
    if (qty > 1) { qty--; document.getElementById('pd-qty').value = qty; }
  });
  document.getElementById('btn-plus').addEventListener('click', () => {
    if (product && qty < Number(product.quantite_disponible)) {
      qty++;
      document.getElementById('pd-qty').value = qty;
    }
  });
  document.getElementById('btn-add').addEventListener('click', () => {
    if (!product) return;
    addToCart({
      id: product.id,
      libelle: product.libelle,
      prix_unitaire: product.prix_unitaire,
      image_url: product.image_url,
      producteur_id: product.producteur_id
    }, qty);
  });
});
