/**
 * AgriMarket - API Service
 */

const API_BASE = 'http://localhost:3000/api';

class ApiService {

  static async _fetch(endpoint, options = {}) {
    const token = localStorage.getItem('agrimarket_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { ApiService.logout(); return; }
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError') throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
      throw err;
    }
  }

  // Auth
  static async login(email, password) {
    const res = await this._fetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('agrimarket_token', res.token);
    localStorage.setItem('agrimarket_user', JSON.stringify(res.user));
    return res;
  }

  static async register(data) {
    return this._fetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  static logout() {
    localStorage.removeItem('agrimarket_token');
    localStorage.removeItem('agrimarket_user');
    localStorage.removeItem('agrimarket_cart');
    window.location.href = 'index.html';
  }

  static isAuthenticated() { return !!localStorage.getItem('agrimarket_token'); }
  static getUser() {
    const u = localStorage.getItem('agrimarket_user');
    return u ? JSON.parse(u) : null;
  }

  // Produits
  static getProducts(params = '') { return this._fetch(`/produits${params}`); }
  static getProductById(id) { return this._fetch(`/produits/${id}`); }

  static async createProduct(formData) {
    const token = localStorage.getItem('agrimarket_token');
    const res = await fetch(`${API_BASE}/produits`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur création produit');
    return data;
  }

  static deleteProduct(id) { return this._fetch(`/produits/${id}`, { method: 'DELETE' }); }

  // Catégories
  static getCategories() { return this._fetch('/categories'); }

  // Commandes — Le backend exige { producteur_id, adresse_livraison, notes, lignes: [{produit_id, quantite}] }
  static createCommande(data) {
    return this._fetch('/commandes', { method: 'POST', body: JSON.stringify(data) });
  }
  static getCommandes() { return this._fetch('/commandes'); }
  static updateOrderStatus(id, statut, note = '') {
    return this._fetch(`/commandes/${id}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut, note })
    });
  }

  // Evaluations
  static submitEvaluation(data) {
    return this._fetch('/evaluations', { method: 'POST', body: JSON.stringify(data) });
  }
  static getProducteurEvaluations(producteurId) {
    return this._fetch(`/evaluations/producteur/${producteurId}`);
  }

  // Admin
  static getUsers() { return this._fetch('/auth/users'); }
}

export default ApiService;
