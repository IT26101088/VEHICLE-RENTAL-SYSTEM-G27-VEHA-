(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var V = window.Veha;
    var ADMIN_USER = 'admin';
    var ADMIN_PASS = 'admin';
    var params = new URLSearchParams(window.location.search);

    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');
    var loginError = document.getElementById('loginError');
    var registerError = document.getElementById('registerError');
    var authTitle = document.getElementById('authTitle');
    var authSub = document.getElementById('authSub');
    var switchToRegister = document.getElementById('switchToRegister');
    var switchToLogin = document.getElementById('switchToLogin');
    var tabs = document.querySelectorAll('[data-tab]');
    var next = safeNext(params.get('next'));

    function safeNext(raw) {
      if (!raw) return 'bookings.html';
      if (/^(index|vehicles|vehicle|bookings|dashboard)\.html(\?[A-Za-z0-9=&%._\-]*)?$/.test(raw)) return raw;
      return 'bookings.html';
    }

    function setMode(mode) {
      var isRegister = mode === 'register';
      loginForm.hidden = isRegister;
      registerForm.hidden = !isRegister;
      authTitle.textContent = isRegister ? 'Create your account.' : 'Welcome back.';
      authSub.textContent = isRegister
        ? 'One account for scooters, vans, coaches and everything in between.'
        : 'Sign in to manage bookings and get back on the road.';
      tabs.forEach(function (tab) {
        var active = tab.getAttribute('data-tab') === mode;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      switchToRegister.hidden = isRegister;
      switchToLogin.hidden = !isRegister;
      clearError(loginError);
      clearError(registerError);
      clearInvalid(loginForm);
      clearInvalid(registerForm);
    }

    function clearError(box) {
      if (!box) return;
      box.classList.remove('is-visible');
      box.innerHTML = '';
    }

    function clearInvalid(form) {
      form.querySelectorAll('.is-invalid').forEach(function (field) { field.classList.remove('is-invalid'); });
    }

    function fail(box, message, field) {
      box.innerHTML = V.icon('info') + '<span>' + V.esc(message) + '</span>';
      box.classList.add('is-visible');
      if (field) {
        field.classList.add('is-invalid');
        field.focus();
      }
    }

    function validEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function go() {
      window.setTimeout(function () { window.location.href = next; }, 450);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setMode(tab.getAttribute('data-tab'));
      });
    });

    document.querySelectorAll('[data-tab-link]').forEach(function (button) {
      button.addEventListener('click', function () {
        setMode(button.getAttribute('data-tab-link'));
      });
    });

    document.querySelectorAll('[data-toggle-password]').forEach(function (button) {
      button.addEventListener('click', function () {
        var input = document.getElementById(button.getAttribute('data-toggle-password'));
        if (!input) return;
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        button.textContent = showing ? 'Show' : 'Hide';
        button.setAttribute('aria-pressed', String(!showing));
      });
    });

    /* Existing session: prefill the login email */
    var cached = V.getUser();
    if (cached && cached.email && cached.role !== 'admin') {
      document.getElementById('loginEmail').value = cached.email;
    }

    [loginForm, registerForm].forEach(function (form) {
      form.addEventListener('input', function (event) {
        clearError(form === loginForm ? loginError : registerError);
        if (event.target.classList) event.target.classList.remove('is-invalid');
      });
    });

    document.getElementById('forgotLink').addEventListener('click', function (event) {
      event.preventDefault();
      V.toast('Demo mode: sign in with any email and a 6+ character password.');
    });

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var emailField = document.getElementById('loginEmail');
      var passwordField = document.getElementById('loginPassword');
      var email = emailField.value.trim().toLowerCase();
      var password = passwordField.value;

      var button0 = loginForm.querySelector('button[type="submit"]');

      /* Admin sign-in: only these credentials grant admin access */
      if (email === ADMIN_USER) {
        if (password !== ADMIN_PASS) {
          fail(loginError, 'Incorrect admin username or password.', passwordField);
          return;
        }
        V.setUser({ name: 'Admin', email: 'admin', phone: '', role: 'admin' });
        button0.disabled = true;
        button0.textContent = 'Signing you in…';
        V.toast('Welcome, Admin.');
        window.setTimeout(function () { window.location.href = 'dashboard.html'; }, 450);
        return;
      }

      if (!validEmail(email)) {
        fail(loginError, 'Enter a valid email address.', emailField);
        return;
      }
      if (password.length < 6) {
        fail(loginError, 'Your password needs at least 6 characters.', passwordField);
        return;
      }

      var existing = V.getUser();
      var name;
      if (existing && existing.email && existing.email.toLowerCase() === email) {
        name = existing.name;
      } else {
        var prefix = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        name = prefix.split(' ').filter(Boolean).map(function (word) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ') || 'VEHA Rider';
      }

      V.setUser({
        name: name,
        email: email,
        phone: existing && existing.email && existing.email.toLowerCase() === email ? existing.phone || '' : '',
        role: 'user'
      });

      var button = loginForm.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Signing you in…';
      V.toast('Welcome back, ' + name.split(' ')[0] + '.');
      go();
    });

    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameField = document.getElementById('regName');
      var emailField = document.getElementById('regEmail');
      var phoneField = document.getElementById('regPhone');
      var passField = document.getElementById('regPassword');
      var confirmField = document.getElementById('regConfirm');
      var termsField = document.getElementById('regTerms');

      var name = nameField.value.trim().replace(/\s+/g, ' ');
      var email = emailField.value.trim().toLowerCase();
      var phone = phoneField.value.trim();
      var password = passField.value;
      var confirm = confirmField.value;
      var digits = phone.replace(/\D/g, '');

      if (name.length < 2) {
        fail(registerError, 'Tell us your full name.', nameField);
        return;
      }
      if (!validEmail(email)) {
        fail(registerError, 'Enter a valid email address.', emailField);
        return;
      }
      if (digits.length < 9 || digits.length > 12) {
        fail(registerError, 'Enter a valid mobile number, like 077 123 4567.', phoneField);
        return;
      }
      if (password.length < 6) {
        fail(registerError, 'Choose a password with at least 6 characters.', passField);
        return;
      }
      if (confirm !== password) {
        fail(registerError, 'Your passwords do not match.', confirmField);
        return;
      }
      if (!termsField.checked) {
        fail(registerError, 'Please accept the rental terms to continue.', termsField);
        return;
      }

      V.setUser({ name: name, email: email, phone: phone, role: 'user' });

      var button = registerForm.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Creating your account…';
      V.toast('Account created. Let\u2019s get you rolling.');
      go();
    });

    var initialMode = params.get('mode') === 'register' ? 'register' : 'login';
    setMode(initialMode);

    var firstField = document.querySelector('.auth-form:not([hidden]) input');
    if (firstField && !cached) firstField.focus({ preventScroll: true });
  });
})();
