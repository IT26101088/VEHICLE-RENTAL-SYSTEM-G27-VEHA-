(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var V = window.Veha;
    var params = new URLSearchParams(window.location.search);
    var vehicleId = params.get('id');
    var vehicle = vehicleId ? V.getVehicle(vehicleId) : null;

    if (!vehicle) {
      showNotFound();
      return;
    }

    var type = V.typeMeta(vehicle.type);
    var bagCount = type.bags;
    var kmLimits = { car: 150, van: 200, bus: 250, bike: 100, scooty: 100, threewheel: 100, lorry: 200, luxury: 150 };

    var SERVICE_FEE = 500;
    var DRIVER_RATE = 3500;
    var INSURANCE_RATE = 1200;
    var supportsDriver = !!V.DRIVER_TYPES[vehicle.type];

    var $ = function (id) { return document.getElementById(id); };
    var pickupInput = $('bkPickup');
    var returnInput = $('bkReturn');
    var citySelect = $('bkCity');
    var driverInput = $('exDriver');
    var insuranceInput = $('exIns');
    var driverExtra = $('driverExtra');
    var errorBox = $('bkError');
    var form = $('bookingForm');
    var modal = $('bookingModal');

    document.title = vehicle.name + ' — VEHA';

    /* Populate static content */
    $('crumbName').textContent = vehicle.name;
    $('vdImage').src = type.image;
    $('vdImage').alt = vehicle.name + ' — ' + type.singular + ' for rent in ' + vehicle.city;
    $('vdType').textContent = type.singular;
    if (vehicle.tag) {
      $('vdTag').textContent = vehicle.tag;
      $('vdTag').hidden = false;
    }
    $('vdName').textContent = vehicle.name;
    $('vdCity').textContent = vehicle.city;
    $('vdRating').textContent = Number(vehicle.rating).toFixed(1);
    $('vdReviews').textContent = '(' + vehicle.reviews + ' reviews)';
    $('vdTrips').textContent = (vehicle.reviews * 3 + 20) + '+ trips';
    $('vdAbout').textContent = vehicle.about;
    $('vdScore').textContent = Number(vehicle.rating).toFixed(1);
    $('bkPrice').textContent = V.money(vehicle.price);
    $('bkRating').textContent = Number(vehicle.rating).toFixed(1);

    $('vdSpecs').innerHTML = [
      specTile('users', 'Passengers', vehicle.seats + ' seats'),
      specTile('gear', 'Transmission', vehicle.transmission),
      specTile('fuel', 'Fuel', vehicle.fuel),
      specTile('calendar', 'Model year', String(vehicle.year)),
      specTile('bag', 'Luggage', bagCount ? bagCount + (bagCount === 1 ? ' bag' : ' bags') : 'No luggage'),
      specTile('route', 'Mileage', (kmLimits[vehicle.type] || 150) + ' km / day')
    ].join('');

    $('vdReviewsList').innerHTML = [
      review('Amaya Jayasuriya', 'AJ', 'September 2026', 'Pick-up was exactly where we agreed and the vehicle was spotless. Clear communication from start to finish — would book again.'),
      review('Tharindu Karunaratne', 'TK', 'August 2026', 'Owner was easy to reach and flexible with our return time. The price matched the quote, no surprises at handover.')
    ].join('');

    /* Booking form setup */
    var cityOptions = V.cities();
    if (cityOptions.indexOf(vehicle.city) === -1) cityOptions.unshift(vehicle.city);
    cityOptions.forEach(function (city) {
      var option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
    citySelect.value = vehicle.city;

    var today = V.todayISO();
    pickupInput.min = today;
    returnInput.min = today;

    var pickupDefault = V.offsetISO(1);
    var returnDefault = V.offsetISO(4);
    try {
      var saved = JSON.parse(sessionStorage.getItem('veha.searchDates') || 'null');
      if (saved && saved.pickup >= today && saved.ret > saved.pickup) {
        pickupDefault = saved.pickup;
        returnDefault = saved.ret;
      }
    } catch (err) { /* session storage unavailable */ }
    pickupInput.value = pickupDefault;
    returnInput.value = returnDefault;

    if (!supportsDriver) {
      driverExtra.hidden = true;
      driverInput.checked = false;
      driverInput.disabled = true;
    }

    /* Restore a draft saved just before sign-in */
    var pending = V.getPending();
    if (pending && pending.vehicleId === vehicle.id) {
      V.clearPending();
      if (pending.pickup && pending.pickup >= today) pickupInput.value = pending.pickup;
      if (pending.ret && pending.ret > pickupInput.value) returnInput.value = pending.ret;
      if (pending.city) citySelect.value = pending.city;
      if (supportsDriver) driverInput.checked = !!pending.driver;
      insuranceInput.checked = pending.insurance !== false;
      V.toast('Signed in — confirm your booking below.');
    }

    function syncReturnMin() {
      if (!pickupInput.value) return;
      returnInput.min = pickupInput.value;
      if (!returnInput.value || returnInput.value <= pickupInput.value) {
        returnInput.value = addDays(pickupInput.value, 3);
      }
    }

    function validate() {
      if (!pickupInput.value || !returnInput.value) return 'Choose both pick-up and return dates.';
      if (pickupInput.value < today) return 'Pick-up date cannot be in the past.';
      if (returnInput.value <= pickupInput.value) return 'Return date must be after the pick-up date.';
      if (!citySelect.value) return 'Choose a pick-up city.';
      return '';
    }

    function showError(message) {
      errorBox.innerHTML = V.icon('info') + '<span>' + V.esc(message) + '</span>';
      errorBox.classList.add('is-visible');
    }

    function clearError() {
      errorBox.classList.remove('is-visible');
      errorBox.textContent = '';
    }

    function calc() {
      var days = Math.max(1, V.daysBetween(pickupInput.value, returnInput.value));
      var extrasPerDay = (supportsDriver && driverInput.checked ? DRIVER_RATE : 0) + (insuranceInput.checked ? INSURANCE_RATE : 0);
      var rateTotal = Number(vehicle.price) * days;
      var extrasTotal = extrasPerDay * days;
      var total = rateTotal + extrasTotal + SERVICE_FEE;

      $('sumRateLabel').textContent = V.money(vehicle.price) + ' × ' + days + (days === 1 ? ' day' : ' days');
      $('sumRate').textContent = V.money(rateTotal);
      $('sumExtras').textContent = V.money(extrasTotal);
      $('sumTotal').textContent = V.money(total);

      return { days: days, rateTotal: rateTotal, extrasTotal: extrasTotal, total: total };
    }

    pickupInput.addEventListener('change', function () {
      syncReturnMin();
      clearError();
      calc();
    });
    returnInput.addEventListener('change', function () {
      clearError();
      calc();
    });
    driverInput.addEventListener('change', function () { clearError(); calc(); });
    insuranceInput.addEventListener('change', function () { clearError(); calc(); });
    citySelect.addEventListener('change', clearError);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var message = validate();
      if (message) {
        showError(message);
        return;
      }

      var amounts = calc();
      var user = V.getUser();
      var draft = {
        vehicleId: vehicle.id,
        pickup: pickupInput.value,
        ret: returnInput.value,
        city: citySelect.value,
        driver: supportsDriver && driverInput.checked,
        insurance: insuranceInput.checked
      };

      if (!user) {
        V.setPending(draft);
        V.toast('Sign in to confirm your booking.');
        var reserveBtn = $('reserveBtn');
        reserveBtn.disabled = true;
        reserveBtn.textContent = 'Taking you to sign in…';
        window.setTimeout(function () {
          window.location.href = 'auth.html?mode=login&next=' + encodeURIComponent('vehicle.html?id=' + vehicle.id);
        }, 450);
        return;
      }

      var booking = {
        id: V.bookingRef(),
        userName: user.name,
        userEmail: user.email,
        vehicleId: vehicle.id,
        city: draft.city,
        pickup: draft.pickup,
        ret: draft.ret,
        days: amounts.days,
        extras: amounts.extrasTotal,
        total: amounts.total,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      var bookings = V.getBookings();
      bookings.push(booking);
      V.saveBookings(bookings);
      openSuccess(booking);
    });

    /* Similar vehicles */
    var others = V.getVehicles().filter(function (v) { return v.id !== vehicle.id; });
    var sameType = others.filter(function (v) { return v.type === vehicle.type; });
    var rest = others.filter(function (v) { return v.type !== vehicle.type; }).sort(function (a, b) { return b.rating - a.rating; });
    var similar = sameType.concat(rest).slice(0, 3);
    $('similarGrid').innerHTML = similar.map(function (v) { return V.vehicleCard(v); }).join('');

    /* Success modal */
    var lastFocused = null;

    function openSuccess(booking) {
      $('bookingRef').textContent = booking.id;
      $('bookingModalSummary').innerHTML = '' +
        '<div><span>Vehicle</span><strong>' + V.esc(vehicle.name) + '</strong></div>' +
        '<div><span>Dates</span><strong>' + V.formatDate(booking.pickup) + ' → ' + V.formatDate(booking.ret) + '</strong></div>' +
        '<div><span>Pick-up</span><strong>' + V.esc(booking.city) + '</strong></div>' +
        '<div><span>Total</span><strong>' + V.money(booking.total) + '</strong></div>';
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      var closeBtn = modal.querySelector('.modal__close');
      if (closeBtn) closeBtn.focus();
      V.toast('Booking ' + booking.id + ' created.');
    }

    function closeSuccess() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    modal.querySelectorAll('[data-close-booking]').forEach(function (el) {
      el.addEventListener('click', closeSuccess);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closeSuccess();
    });

    calc();

    function specTile(iconName, label, value) {
      return '<div class="spec-tile">' +
        '<span class="spec-tile__icon">' + V.icon(iconName) + '</span>' +
        '<div><span>' + V.esc(label) + '</span><strong>' + V.esc(value) + '</strong></div>' +
        '</div>';
    }

    function review(name, initials, when, text) {
      var stars = '';
      for (var i = 0; i < 5; i++) {
        stars += V.icon('star');
      }
      return '<article class="review">' +
        '<div class="review__head">' +
          '<span class="avatar">' + V.esc(initials) + '</span>' +
          '<div><strong>' + V.esc(name) + '</strong><span>' + V.esc(when) + '</span></div>' +
          '<span class="review__stars" aria-label="5 out of 5 stars">' + stars + '</span>' +
        '</div>' +
        '<p>' + V.esc(text) + '</p>' +
      '</article>';
    }

    function addDays(iso, amount) {
      var d = new Date(iso + 'T12:00:00');
      d.setDate(d.getDate() + amount);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function showNotFound() {
      document.title = 'Vehicle not found — VEHA';
      var root = document.getElementById('detailRoot');
      if (root) {
        root.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
          '<span class="empty-state__icon">' + V.icon('car') + '</span>' +
          '<h2>We couldn\'t find that vehicle</h2>' +
          '<p>It may have been removed or the link might be wrong. Browse the full fleet to find your ride.</p>' +
          '<a class="btn btn--primary btn--sm" href="vehicles.html">Browse vehicles</a>' +
        '</div>';
      }
      var similarSection = document.querySelector('.similar');
      if (similarSection) similarSection.hidden = true;
    }
  });
})();
