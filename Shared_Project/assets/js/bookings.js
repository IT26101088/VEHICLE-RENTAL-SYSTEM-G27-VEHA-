(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var V = window.Veha;
    var root = document.getElementById('bookingsRoot');
    var sub = document.getElementById('bookingsSub');
    var user = V.getUser();

    if (!user) {
      sub.textContent = 'Sign in to view and manage your reservations.';
      root.innerHTML = '' +
        '<div class="bookings-login">' +
          '<span class="empty-state__icon">' + V.icon('calendar') + '</span>' +
          '<h2>Sign in to see your bookings</h2>' +
          '<p>Your reservations, dates and totals live here once you\u2019re signed in.</p>' +
          '<div class="bookings-login__actions">' +
            '<a class="btn btn--primary btn--sm" href="auth.html?mode=login&next=bookings.html">Sign in</a>' +
            '<a class="btn btn--ghost btn--sm" href="auth.html?mode=register&next=bookings.html">Create an account</a>' +
          '</div>' +
        '</div>';
      return;
    }

    sub.textContent = 'Signed in as ' + user.email + ' — here\u2019s everything you\u2019ve booked.';
    render();

    function myBookings() {
      return V.getBookings()
        .filter(function (b) { return String(b.userEmail || '').toLowerCase() === String(user.email || '').toLowerCase(); })
        .sort(function (a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
    }

    function render() {
      var list = myBookings();

      if (!list.length) {
        root.innerHTML = '' +
          '<div class="bookings-login">' +
            '<span class="empty-state__icon">' + V.icon('route') + '</span>' +
            '<h2>No bookings yet</h2>' +
            '<p>Pick a ride, choose your dates and your first trip will show up right here.</p>' +
            '<div class="bookings-login__actions">' +
              '<a class="btn btn--primary btn--sm" href="vehicles.html">Find your ride</a>' +
              '<a class="btn btn--ghost btn--sm" href="index.html#how">How it works</a>' +
            '</div>' +
          '</div>';
        return;
      }

      var today = V.todayISO();
      var upcoming = list.filter(function (b) {
        return (b.status === 'Pending' || b.status === 'Confirmed') && b.ret >= today;
      }).length;
      var value = list.filter(function (b) { return b.status !== 'Cancelled'; })
        .reduce(function (sum, b) { return sum + Number(b.total || 0); }, 0);

      root.innerHTML = '' +
        '<div class="bookings-summary">' +
          '<div class="summary-card">' +
            '<span class="summary-card__icon">' + V.icon('calendar') + '</span>' +
            '<div><strong>' + upcoming + '</strong><span>' + (upcoming === 1 ? 'Upcoming trip' : 'Upcoming trips') + '</span></div>' +
          '</div>' +
          '<div class="summary-card">' +
            '<span class="summary-card__icon">' + V.icon('bookings') + '</span>' +
            '<div><strong>' + list.length + '</strong><span>' + (list.length === 1 ? 'Booking in total' : 'Total bookings') + '</span></div>' +
          '</div>' +
          '<div class="summary-card">' +
            '<span class="summary-card__icon">' + V.icon('wallet') + '</span>' +
            '<div><strong>' + V.money(value) + '</strong><span>Total booking value</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="booking-list">' + list.map(itemHTML).join('') + '</div>';
    }

    function itemHTML(booking) {
      var vehicle = V.getVehicle(booking.vehicleId);
      var type = V.typeMeta(vehicle ? vehicle.type : 'car');
      var name = vehicle ? vehicle.name : 'Vehicle no longer listed';
      var href = vehicle ? 'vehicle.html?id=' + encodeURIComponent(vehicle.id) : '';
      var status = String(booking.status || 'Pending').toLowerCase();
      var canCancel = status === 'pending' || status === 'confirmed';
      var canRemove = status === 'cancelled' || status === 'completed';

      var media = '<img src="' + type.image + '" alt="' + V.esc(name) + '" loading="lazy">';
      if (href) media = '<a href="' + href + '" aria-label="View ' + V.esc(name) + '">' + media + '</a>';

      var title = href
        ? '<a href="' + href + '">' + V.esc(name) + '</a>'
        : V.esc(name);

      return '' +
        '<article class="booking-item">' +
          '<div class="booking-item__media">' + media + '</div>' +
          '<div class="booking-item__body">' +
            '<div class="booking-item__head">' +
              '<span class="booking-item__ref">' + V.esc(booking.id) + '</span>' +
              '<span class="status status--' + V.esc(status) + '">' + V.esc(booking.status || 'Pending') + '</span>' +
            '</div>' +
            '<h3>' + title + '</h3>' +
            '<div class="booking-item__meta">' +
              '<span>' + V.icon('calendar') + V.formatDate(booking.pickup) + ' → ' + V.formatDate(booking.ret) + '</span>' +
              '<span>' + V.icon('clock') + booking.days + (booking.days === 1 ? ' day' : ' days') + '</span>' +
              '<span>' + V.icon('pin') + V.esc(booking.city) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="booking-item__actions">' +
            '<div class="booking-item__price">' + V.money(booking.total) + '<span>Total</span></div>' +
            '<div class="booking-item__buttons">' +
              (href ? '<a class="btn btn--ghost btn--tiny" href="' + href + '">View vehicle</a>' : '') +
              (canCancel ? '<button class="btn btn--danger-ghost btn--tiny" type="button" data-cancel="' + V.esc(booking.id) + '">Cancel</button>' : '') +
              (canRemove ? '<button class="btn btn--danger-ghost btn--tiny" type="button" data-remove="' + V.esc(booking.id) + '">Remove</button>' : '') +
            '</div>' +
          '</div>' +
        '</article>';
    }

    root.addEventListener('click', function (event) {
      var cancelBtn = event.target.closest('[data-cancel]');
      var removeBtn = event.target.closest('[data-remove]');

      if (cancelBtn) {
        cancelBooking(cancelBtn.getAttribute('data-cancel'));
      } else if (removeBtn) {
        removeBooking(removeBtn.getAttribute('data-remove'));
      }
    });

    function cancelBooking(id) {
      var list = V.getBookings();
      var booking = list.filter(function (b) { return b.id === id; })[0];
      if (!booking) return;
      var vehicle = V.getVehicle(booking.vehicleId);
      var vehicleName = vehicle ? vehicle.name : 'your vehicle';

      V.confirm({
        title: 'Cancel this booking?',
        message: 'Booking ' + booking.id + ' for the ' + vehicleName + ' will be cancelled. You can always book again.',
        confirmText: 'Cancel booking',
        cancelText: 'Keep booking',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        booking.status = 'Cancelled';
        V.saveBookings(list);
        render();
        V.toast('Booking ' + booking.id + ' cancelled.');
      });
    }

    function removeBooking(id) {
      var list = V.getBookings();
      var booking = list.filter(function (b) { return b.id === id; })[0];
      if (!booking) return;

      V.confirm({
        title: 'Remove this booking?',
        message: 'This clears booking ' + booking.id + ' from your list. It can\u2019t be undone.',
        confirmText: 'Remove',
        cancelText: 'Keep it',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        V.saveBookings(list.filter(function (b) { return b.id !== id; }));
        render();
        V.toast('Booking removed from your list.');
      });
    }
  });
})();
