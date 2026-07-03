/* ── Vessel selection ─────────────────────────────────────── */
let currentVessel = null;

function selectVessel(id) {
  // Hide all vessels
  document.querySelectorAll('[id^="vessel-"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.chip').forEach(el => el.classList.remove('active'));

  if (currentVessel === id) {
    currentVessel = null;
    return;
  }
  currentVessel = id;
  const el = document.getElementById('vessel-' + id);
  if (el) el.style.display = 'block';
  const chip = document.getElementById('chip-' + id);
  if (chip) chip.classList.add('active');
}

/* ── Accordion ────────────────────────────────────────────── */
function toggleAcc(btn) {
  btn.classList.toggle('open');
  const content = btn.nextElementSibling;
  if (content) content.classList.toggle('open');
}

/* ── Lightbox ─────────────────────────────────────────────── */
let lbDishes = [];
let lbIndex  = 0;

function openLightbox(dishes, index) {
  lbDishes = dishes;
  lbIndex  = index;
  renderLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.addEventListener('keydown', lbKeyHandler);
}

function openLightboxSingle(dish) {
  openLightbox([dish], 0);
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.removeEventListener('keydown', lbKeyHandler);
}

function lbKeyHandler(e) {
  if (e.key === 'ArrowLeft')  navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
  if (e.key === 'Escape')     closeLightbox();
}

function navLightbox(dir) {
  lbIndex = (lbIndex + dir + lbDishes.length) % lbDishes.length;
  renderLightbox();
}

function renderLightbox() {
  const d = lbDishes[lbIndex];
  document.getElementById('lb-img').src = d.image;
  document.getElementById('lb-date').textContent = new Date(d.date).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
  document.getElementById('lb-counter').textContent = (lbIndex + 1) + ' / ' + lbDishes.length;

  const rating = parseFloat(d.rating) || 0;
  const votes  = parseInt(d.votes)   || 0;
  document.getElementById('lb-rating').textContent = votes > 0
    ? rating.toFixed(1) + ' ★  (' + votes + ' vote' + (votes !== 1 ? 's' : '') + ')'
    : 'No ratings yet — be the first!';

  // Interactive stars
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const lit = i <= Math.round(rating) ? 'lit' : '';
    starsHtml += `<span class="lb-star ${lit}" data-val="${i}"
      onmouseover="hoverStar(this,${i})"
      onmouseout="resetStars(${rating})"
      onclick="rateDish('${d.id}', ${i})">&#9733;</span>`;
  }
  document.getElementById('lb-stars').innerHTML = starsHtml;
}

function hoverStar(el, val) {
  document.querySelectorAll('#lb-stars .lb-star').forEach((s, i) => {
    s.classList.toggle('lit', i < val);
  });
}

function resetStars(rating) {
  document.querySelectorAll('#lb-stars .lb-star').forEach((s, i) => {
    s.classList.toggle('lit', i < Math.round(rating));
  });
}

function rateDish(dishId, value) {
  fetch('/api/rate.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({dish_id: dishId, rating: value})
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      // Update local dish object and re-render
      const d = lbDishes[lbIndex];
      if (d.id === dishId) {
        d.rating = data.rating;
        d.votes  = data.votes;
        renderLightbox();
      }
    }
  })
  .catch(console.error);
}

// Close lightbox when clicking outside the inner content
document.getElementById('lightbox').addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});
