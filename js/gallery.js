(function () {
const section = document.querySelector('.gallery');
const car = document.querySelector('.gallery .carousel') || document.querySelector('.carousel');
if (!car) return;


fetch('json/gallery.json', { cache: 'no-cache' })
.then((res) => {
if (!res.ok) throw new Error('HTTP ' + res.status);
return res.json();
})
.then((data) => {
const items = Array.isArray(data) ? data : (data.images || []);
if (!items.length) throw new Error('No images found');


// Clear existing children (if any hardcoded slides exist)
car.innerHTML = '';


// Build slides
items.forEach((img) => {
const figure = document.createElement('figure');
figure.className = 'slide';
const image = document.createElement('img');
image.src = img.src;
image.alt = img.alt || '';
image.loading = 'lazy';
image.decoding = 'async';
const fc = document.createElement('figcaption');
fc.className = 'slide-caption';
fc.textContent = img.caption || '';
figure.append(image, fc);
car.appendChild(figure);
});


// Controls (use existing if present; otherwise create)
let prev = document.getElementById('prev-slide');
let next = document.getElementById('next-slide');
if (!prev || !next) {
const controls = document.createElement('div');
controls.className = 'carousel-controls';
prev = document.createElement('a'); prev.id = 'prev-slide'; prev.className = 'btn btn-secondary'; prev.href = '#'; prev.setAttribute('aria-label', 'Previous slide'); prev.textContent = '‹ Prev';
next = document.createElement('a'); next.id = 'next-slide'; next.className = 'btn btn-secondary'; next.href = '#'; next.setAttribute('aria-label', 'Next slide'); next.textContent = 'Next ›';
controls.append(prev, next);
(section || car.parentElement).appendChild(controls);
}


function stepWidth() { return car.clientWidth; }
function go(dir) { car.scrollBy({ left: dir * stepWidth(), behavior: 'smooth' }); }


prev.addEventListener('click', (e) => { e.preventDefault(); go(-1); });
next.addEventListener('click', (e) => { e.preventDefault(); go(1); });


// Keyboard navigation when carousel is focused
car.setAttribute('tabindex', '0');
car.addEventListener('keydown', (e) => {
if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
});


})
.catch((err) => {
console.error('Gallery load error:', err);
// Minimal fallback text if JSON fails
const msg = document.createElement('p');
msg.style.color = 'var(--muted)';
msg.textContent = 'Could not load gallery. Check gallery.json.';
(section || car.parentElement).appendChild(msg);
});
})();