import ApiService from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  if (ApiService.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  const loginAlert = document.getElementById('login-alert');
  const registerAlert = document.getElementById('register-alert');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');

  // Toggle Forms
  showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('d-none');
    registerSection.classList.remove('d-none');
  });

  showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.classList.add('d-none');
    loginSection.classList.remove('d-none');
  });

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.classList.add('d-none');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const originalText = btnLogin.textContent;
    btnLogin.textContent = 'Connexion...';
    btnLogin.disabled = true;

    try {
      await ApiService.login(email, password);
      // Success - redirect to dashboard or previous page
      window.location.href = 'dashboard.html';
    } catch (error) {
      loginAlert.textContent = error.message;
      loginAlert.classList.remove('d-none');
    } finally {
      btnLogin.textContent = originalText;
      btnLogin.disabled = false;
    }
  });

  // Handle Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerAlert.classList.add('d-none');
    
    const prenom = document.getElementById('reg-prenom').value;
    const nom = document.getElementById('reg-nom').value;
    const email = document.getElementById('reg-email').value;
    const telephone = document.getElementById('reg-telephone').value;
    const adresse = document.getElementById('reg-adresse').value;
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;

    const originalText = btnRegister.textContent;
    btnRegister.textContent = 'Inscription...';
    btnRegister.disabled = true;

    try {
      await ApiService.register({
        nom: nom,
        prenom: prenom,
        email: email,
        mot_de_passe: password,
        telephone: telephone,
        adresse: adresse,
        role: role
      });

      // Show success and switch to login
      registerSection.classList.add('d-none');
      loginSection.classList.remove('d-none');
      loginAlert.className = 'alert alert-success';
      loginAlert.textContent = 'Compte créé avec succès ! Connectez-vous.';
      document.getElementById('login-email').value = email;
    } catch (error) {
      registerAlert.textContent = error.message;
      registerAlert.classList.remove('d-none');
    } finally {
      btnRegister.textContent = originalText;
      btnRegister.disabled = false;
    }
  });

  // Check URL params for session expired
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('session') === 'expired') {
    loginAlert.textContent = 'Votre session a expiré. Veuillez vous reconnecter.';
    loginAlert.classList.remove('d-none');
  }
});
