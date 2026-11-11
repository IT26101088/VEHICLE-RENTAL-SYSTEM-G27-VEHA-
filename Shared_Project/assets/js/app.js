/* VEHA — site chrome: navigation, auth state, reveal animations */
(function () {
  'use strict';

  function initials(name) {
    return String(name || 'VE')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join('') || 'VE';
  }

  function currentPage() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    return file;
  }

  function initHeader() {
    var header = document.querySelector('[data-header]');
    var nav = document.querySelector('[data-nav]');
    var toggle = document.querySelector('[data-nav-toggle]');
    if (!nav) return;

    function onScroll() {
      if (!header) return;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      nav.querySelectorAll('.nav__links a').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var page = currentPage();
    nav.querySelectorAll('[data-nav-link]').forEach(function (link) {
      var key = link.getAttribute('data-nav-link');
      var active = (key === 'home' && page === 'index.html') ||
        (key === 'vehicles' && (page === 'vehicles.html' || page === 'vehicle.html')) ||
        (key === 'bookings' && page === 'bookings.html') ||
        (key === 'payments' && page === 'payments.html');
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
    });
  }

  function initAuthUI() {
    var slot = document.querySelector('[data-auth-slot]');
    if (!slot) return;
    var user = window.Veha.getUser();

    if (!user) {
      slot.innerHTML = '' +
        '<a class="nav__signin" href="auth.html?mode=login">Sign in</a>' +
        '<a class="btn btn--primary btn--sm nav__cta" href="vehicles.html">Book a ride</a>';

      var mobileNav = document.querySelector('[data-nav] .nav__links');
      if (mobileNav) {
        var mobileSignin = document.createElement('a');
        mobileSignin.className = 'nav__mobile-signin';
        mobileSignin.href = 'auth.html?mode=login';
        mobileSignin.textContent = 'Sign in';
        mobileNav.appendChild(mobileSignin);
      }
      return;
    }

    slot.innerHTML = '' +
      '<div class="nav-user">' +
        '<button type="button" class="nav-user__btn" data-user-toggle aria-expanded="false" aria-haspopup="true">' +
          '<span class="avatar">' + window.Veha.esc(initials(user.name)) + '</span>' +
          '<span class="nav-user__name">' + window.Veha.esc(String(user.name || 'Rider').split(' ')[0]) + '</span>' +
          window.Veha.icon('chevron', 'icon--sm') +
        '</button>' +
        '<div class="dropdown" data-user-menu>' +
          '<div class="dropdown__head">' +
            '<strong>' + window.Veha.esc(user.name) + '</strong>' +
            '<span>' + window.Veha.esc(user.email) + '</span>' +
          '</div>' +
        '<a href="profile.html">' + window.Veha.icon('user') + 'My profile</a>' +
        '<a href="update-profile.html">' + window.Veha.icon('edit') + 'Edit profile</a>' +
          '<a href="bookings.html">' + window.Veha.icon('calendar') + 'My bookings</a>' +
          '<a href="vehicles.html">' + window.Veha.icon('car') + 'Browse vehicles</a>' +
          (window.Veha.isAdmin() ? '<a href="dashboard.html">' + window.Veha.icon('grid') + 'Admin dashboard</a>' : '') +
          '<button type="button" data-signout>' + window.Veha.icon('logout') + 'Sign out</button>' +
        '</div>' +
      '</div>';

    var userBtn = slot.querySelector('[data-user-toggle]');
    var menu = slot.querySelector('[data-user-menu]');

    userBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      var open = menu.classList.toggle('is-open');
      userBtn.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', function (event) {
      if (!slot.contains(event.target)) {
        menu.classList.remove('is-open');
        userBtn.setAttribute('aria-expanded', 'false');
      }
    });

    var signout = slot.querySelector('[data-signout]');
    if (signout) {
      signout.addEventListener('click', function () {
        window.Veha.clearUser();
        window.Veha.toast('Signed out. See you soon.');
        window.setTimeout(function () {
          if (currentPage() === 'bookings.html' || currentPage() === 'dashboard.html') {
            window.location.href = 'index.html';
          } else {
            window.location.reload();
          }
        }, 500);
      });
    }
  }

  function initAdminLinks() {
    if (window.Veha.isAdmin()) return;
    document.querySelectorAll('[data-admin-link]').forEach(function (el) { el.hidden = true; });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initAuthUI();
    initYear();
    initAdminLinks();
    window.Veha.revealVisible();
  });
})();
