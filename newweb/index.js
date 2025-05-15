// --- Código de propiedades con Swiper general + sliders por card ---
const contenedorCards = document.getElementById("propiedades-list");
const allProps = propiedades; // Importado desde propiedades.js

function cargarPropiedades() {
  contenedorCards.innerHTML = "";

  allProps.forEach((p, index) => {
    const card = document.createElement("div");
    card.className = "swiper-slide"; // ✅ cada card es un slide del slider general

    // Generar slides internos de imágenes
    const slidesHTML = (p.imagenes || [])
      .map(
        (img) => `
      <div class="swiper-slide">
        <img src="${img}" alt="${p.tipoPropiedad} en ${p.localidad}">
      </div>
    `
      )
      .join("");

    const colorTag = p.tipoTransaccion === "Venta" ? "#38b6a3" : "#0099cc";
    // Contenido de la card
    card.innerHTML = `
      <div class="card">
        <div class="swiper mySwiper" id="swiper-${index}" style="position: relative;">
         <div class="card-tag" style="background-color: ${colorTag};">${p.tipoTransaccion}</div>
          <div class="swiper-wrapper">
            ${slidesHTML}
          </div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>

        <h3>${p.tipoPropiedad} en ${p.localidad}</h3>
        <p>${p.descripcion}</p>
        <p><strong>${p.valor}</strong></p>
       <div class="iconos-card">
          <span><i class="fas fa-bed"></i> ${p.dormitorios}</span>
          <span><i class="fas fa-shower"></i> ${p.baños}</span>
          <span><i class="fas fa-ruler-combined"></i> ${p.tamaño} m²</span>
        </div>
      </div>
    `;

    contenedorCards.appendChild(card);
  });

  inicializarSwipers();
  inicializarSwiperGeneral(); // 🚀 inicializamos el Swiper grande
}

// Inicializar Swipers dentro de cada card (fotos)
function inicializarSwipers() {
  const swipers = document.querySelectorAll(".mySwiper");

  swipers.forEach((swiperElement) => {
    new Swiper(swiperElement, {
      loop: true,
      autoplay: false,
      navigation: {
        nextEl: swiperElement.querySelector(".swiper-button-next"),
        prevEl: swiperElement.querySelector(".swiper-button-prev"),
      },
    });
  });
}

// Inicializar el Swiper principal que mueve las casas
function inicializarSwiperGeneral() {
  new Swiper(".myMainSwiper", {
    loop: true,
    grabCursor: true,
    slidesPerView: 3, // ✅ 3 casas visibles
    slidesPerGroup: 3, // ✅ pasa de a 3 casas
    spaceBetween: 30, // espacio entre cards
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    // pagination: {
    //   el: '.swiper-pagination',
    //   clickable: true,
    // },
    breakpoints: {
      0: { slidesPerView: 1, slidesPerGroup: 1 },
      768: { slidesPerView: 2, slidesPerGroup: 2 },
      1024: { slidesPerView: 3, slidesPerGroup: 3 },
    },
  });
}

// 🚀 Ejecutar todo al cargar
cargarPropiedades();

const animables = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // solo una vez
      }
    });
  },
  {
    threshold: 0.2,
  }
);

animables.forEach((el) => observer.observe(el));

document.getElementById("contactForm").addEventListener("submit", function (e) {
  // 1) Obtén los valores de los campos extra
  const localidad = this.localidad.value.trim();
  const operacion = this.tipo_operacion.value.trim();
  const telefono = this.telefono.value.trim();
  const inmueble = this.tipo_inmueble.value.trim();

  // 2) Construye un bloque de texto con ellos
  let extras = "";
  if (localidad) extras += `Localidad: ${localidad}\n`;
  if (operacion) extras += `Operación: ${operacion}\n`;
  if (telefono) extras += `Teléfono: ${telefono}\n`;
  if (inmueble) extras += `Tipo de Inmueble: ${inmueble}\n`;

  // 3) Si hay extras, los añades debajo del mensaje original
  const msgEl = document.getElementById("message");
  if (extras) {
    msgEl.value = msgEl.value.trim() + "\n\n" + extras;
  }
  // Dejas que el form siga su curso (POST a Formspree)
});

// document.querySelector('.btn-reset').addEventListener('click', () => {
//   document
//     .querySelectorAll('.buscador-avanzado select')
//     .forEach(sel => sel.selectedIndex = 0);
// });
const pasos = document.querySelectorAll(".step");
const path = document.getElementById("snake-path");
const trail = document.getElementById("snake-trail");

const totalLength = path.getTotalLength();
const pasosCount = pasos.length;
const stepLength = totalLength / pasosCount;

let pasoActual = 0;

function moverCabeza(pasoIndex) {
  const len = stepLength * pasoIndex - 5;

  const pos = path.getPointAtLength(len);
  const next = path.getPointAtLength(len + 5);

  const dx = next.x - pos.x;
  const dy = next.y - pos.y;
  // const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const offset = totalLength - (stepLength * pasoIndex - 5);
  // Posiciona y rota la flecha

  // Extiende el trail
  trail.setAttribute("stroke-dashoffset", offset);
}

function activarPaso() {
  pasos.forEach((p, i) => {
    p.classList.toggle("active", i === pasoActual);
  });

  moverCabeza(pasoActual);

  pasoActual = (pasoActual + 1) % pasosCount;
}

activarPaso();
setInterval(activarPaso, 1800);
