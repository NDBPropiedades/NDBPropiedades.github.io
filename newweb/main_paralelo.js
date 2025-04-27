// --- Código de navegación del menú ---
const toggleButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");
const menuIcon = toggleButton.querySelector("i"); // icono dentro del botón

toggleButton.addEventListener("click", () => {
  nav.classList.toggle("active");

  // Cambiar icono hamburguesa <-> cruz
  if (nav.classList.contains("active")) {
    menuIcon.classList.remove("fa-bars");
    menuIcon.classList.add("fa-times");
  } else {
    menuIcon.classList.remove("fa-times");
    menuIcon.classList.add("fa-bars");
  }
});

// Cuando hacés click en un link, cerrar el menú
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    menuIcon.classList.remove("fa-times");
    menuIcon.classList.add("fa-bars");
  });
});

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
// Toggle footer hamburguer and X
const footerToggleButton = document.querySelector('.footer-menu-toggle');
const footerMenu = document.querySelector('.footer-menu');
const footerIcon = footerToggleButton.querySelector('i');

footerToggleButton.addEventListener('click', () => {
  footerMenu.classList.toggle('active');
  
  if (footerMenu.classList.contains('active')) {
    footerIcon.classList.remove('fa-bars');
    footerIcon.classList.add('fa-times'); // Cambiamos a ícono X
  } else {
    footerIcon.classList.remove('fa-times');
    footerIcon.classList.add('fa-bars'); // Volvemos a hamburguesa
  }
});
