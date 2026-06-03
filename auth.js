/* ─── FitFuel Auth Module ────────────────────────────────────
   All user data is stored in localStorage (prototype only).
   Keys:
     fitfuel_users  : array of { name, email, password }
     fitfuel_session: { name, email } or null
─────────────────────────────────────────────────────────── */

const Auth = (() => {
  const USERS_KEY   = 'fitfuel_users';
  const SESSION_KEY = 'fitfuel_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  function getUser() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  }

  function register(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, msg: 'An account with that email already exists.' };
    }
    users.push({ name, email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
    return { ok: true };
  }

  function login(email, password) {
    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, msg: 'Incorrect email or password.' };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* ── Navbar injection ────────────────────────────────────── */
  function updateNav() {
    const user     = getUser();
    const actions  = document.querySelector('.nav-actions');
    const navLinks = document.querySelector('.nav-links');
    if (!actions) return;

    if (user) {
      // Swap buttons for avatar chip + dashboard link + logout
      actions.innerHTML = `
        <a href="dashboard.html" class="btn btn-ghost" id="nav-dashboard-btn">Dashboard</a>
        <div class="nav-avatar-chip" id="nav-avatar-chip">
          <span class="nav-avatar-icon">${user.name.charAt(0).toUpperCase()}</span>
          <span class="nav-avatar-name">${user.name.split(' ')[0]}</span>
        </div>
        <button class="btn btn-ghost" id="nav-logout-btn" onclick="Auth.logout(); location.href='index.html';">Log Out</button>
      `;
      // Show Dashboard link in nav-links too
      if (navLinks && !navLinks.querySelector('.nav-dashboard-link')) {
        const li = document.createElement('li');
        li.className = 'nav-dashboard-link';
        li.innerHTML = '<a href="dashboard.html">Dashboard</a>';
        navLinks.prepend(li);
      }
    } else {
      actions.innerHTML = `
        <a href="#" class="btn btn-ghost" id="open-login-btn">Log In</a>
        <a href="#" class="btn btn-primary" id="open-signup-btn">Sign Up</a>
      `;
      // Remove dashboard link if it got added
      if (navLinks) {
        const dashLi = navLinks.querySelector('.nav-dashboard-link');
        if (dashLi) dashLi.remove();
      }
    }

    // ── Mobile menu sync ──────────────────────────────────────
    const mobileActions = document.querySelector('.mobile-actions');
    const mobileLinks   = document.querySelector('.mobile-links');
    if (mobileActions) {
      if (user) {
        mobileActions.innerHTML = `
          <a href="dashboard.html" class="btn btn-primary">Dashboard</a>
          <button class="btn btn-ghost" onclick="Auth.logout(); location.href='index.html';">Log Out</button>
        `;
      } else {
        mobileActions.innerHTML = `
          <a href="#" class="btn btn-ghost" id="mobile-login-btn">Log In</a>
          <a href="#" class="btn btn-primary" id="mobile-signup-btn">Sign Up</a>
        `;
        const mLogin  = document.getElementById('mobile-login-btn');
        const mSignup = document.getElementById('mobile-signup-btn');
        if (mLogin)  mLogin.addEventListener('click', (e) => { e.preventDefault(); openModal('login-modal'); });
        if (mSignup) mSignup.addEventListener('click', (e) => { e.preventDefault(); openModal('signup-modal'); });
      }
    }
    if (mobileLinks && user && !mobileLinks.querySelector('.mobile-dash-link')) {
      const li = document.createElement('li');
      li.className = 'mobile-dash-link';
      li.innerHTML = '<a href="dashboard.html">Dashboard</a>';
      mobileLinks.prepend(li);
    }

    // Re-bind modal openers (they may have been replaced by innerHTML)
    const loginBtn  = document.getElementById('open-login-btn');
    const signupBtn = document.getElementById('open-signup-btn');
    if (loginBtn)  loginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('login-modal'); });
    if (signupBtn) signupBtn.addEventListener('click', (e) => { e.preventDefault(); openModal('signup-modal'); });
  }

  /* ── Modal helpers ───────────────────────────────────────── */
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
  }

  /* ── Route guard (call on protected pages) ───────────────── */
  function requireAuth(redirectTo = 'index.html') {
    if (!getUser()) {
      location.href = redirectTo + '?auth=required';
    }
  }

  /* ── Init: wire modals if they exist on this page ───────── */
  function toggleMobile(e) {
    const btn = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    const opening = !menu.classList.contains('open');
    menu.classList.toggle('open');
    btn.classList.toggle('active');
    document.body.style.overflow = opening ? 'hidden' : '';
  }

  function init() {
    updateNav();

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', toggleMobile);
      // Close menu when clicking overlay background
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) toggleMobile();
      });
      // Close menu when a link is clicked
      mobileMenu.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => {
          if (mobileMenu.classList.contains('open')) toggleMobile();
        });
      });
    }

    // Close on overlay click
    document.querySelectorAll('.auth-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
      });
    });

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const result   = login(email, password);
        if (result.ok) {
          closeModal('login-modal');
          location.href = 'dashboard.html';
        } else {
          document.getElementById('login-error').textContent = result.msg;
          document.getElementById('login-error').style.display = 'block';
        }
      });
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name     = document.getElementById('signup-name').value.trim();
        const email    = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const result   = register(name, email, password);
        if (result.ok) {
          closeModal('signup-modal');
          location.href = 'dashboard.html';
        } else {
          document.getElementById('signup-error').textContent = result.msg;
          document.getElementById('signup-error').style.display = 'block';
        }
      });
    }

    // Switch between login ↔ signup
    const toSignup = document.getElementById('switch-to-signup');
    const toLogin  = document.getElementById('switch-to-login');
    if (toSignup) toSignup.addEventListener('click', (e) => { e.preventDefault(); closeModal('login-modal');  openModal('signup-modal'); });
    if (toLogin)  toLogin.addEventListener('click',  (e) => { e.preventDefault(); closeModal('signup-modal'); openModal('login-modal');  });
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { getUser, register, login, logout, requireAuth, openModal, closeModal };
})();
