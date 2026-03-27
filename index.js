const API_URL =
  "https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true";

const contenedorCards = document.getElementById("propiedades-list");

const propertyTypeTranslations = {
  Land: "Terreno",
  Apartment: "Departamento",
  House: "Casa",
  "Weekend House": "Casa de fin de semana",
  Office: "Oficina",
  Mooring: "Amarra",
  "Bussiness Premises": "Local comercial",
  "Commercial Building": "Edificio comercial",
  Countryside: "Campo",
  Garage: "Cochera",
  Hotel: "Hotel",
  "Industrial Ship": "Nave industrial",
  Condo: "PH",
  Storage: "Depósito",
  "Bussiness Permit": "Fondo de comercio",
  "Storage room": "Baulera",
  "Wine Cellar": "Bodega",
  Farm: "Granja",
  Ranch: "Estancia",
  "Nautical Bed": "Cama náutica",
};

const currentYear = new Date().getFullYear();

function escapeHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function opToStd(v) {
  const a = (v || "").toString().toLowerCase();

  if (a.includes("temporary") || a === "alquiler temporal") {
    return "Temporary Rent";
  }

  if (a.includes("rent") || a === "alquiler") {
    return "Rent";
  }

  return "Sale";
}

function formatearPrecioTokko(priceObj) {
  if (!priceObj || priceObj.price == null) return "Consultar precio";

  const currency = (priceObj.currency || "").toUpperCase();
  const n = Number(priceObj.price);

  const symbol =
    currency === "ARS"
      ? "$ "
      : currency === "USD"
        ? "USD "
        : currency
          ? `${currency} `
          : "";

  return `${symbol}${
    Number.isFinite(n) ? n.toLocaleString("es-AR") : priceObj.price
  }`;
}

function obtenerOperacionesDePropiedad(p) {
  const opsUnicas = new Map();

  (p.operations || []).forEach((o) => {
    const tipoStd = opToStd(o.operation_type);

    if (!opsUnicas.has(tipoStd)) {
      opsUnicas.set(tipoStd, {
        type: tipoStd,
        label:
          tipoStd === "Sale"
            ? "Venta"
            : tipoStd === "Rent"
              ? "Alquiler"
              : "Temporal",
        badgeClass:
          tipoStd === "Sale"
            ? "badge-sale"
            : tipoStd === "Rent"
              ? "badge-rent"
              : "badge-temporary",
        priceObj: o?.prices?.[0] || null,
      });
    }
  });

  const ordenPreferido = ["Sale", "Rent", "Temporary Rent"];

  return ordenPreferido
    .filter((tipo) => opsUnicas.has(tipo))
    .map((tipo) => opsUnicas.get(tipo));
}

function construirBadgesOperacionHtml(p) {
  const operaciones = obtenerOperacionesDePropiedad(p);

  return operaciones
    .map(
      (op) =>
        `<span class="property-card__badge ${op.badgeClass}">${op.label}</span>`,
    )
    .join("");
}

function construirPreciosOperacionHtml(p) {
  const operaciones = obtenerOperacionesDePropiedad(p);

  return operaciones
    .map(
      (op) => `
        <div class="property-card__price-row">
          <span class="property-card__price-label">${op.label}</span>
          <span class="property-card__price-value">${formatearPrecioTokko(op.priceObj)}</span>
        </div>
      `,
    )
    .join("");
}

function obtenerSlidesPropiedad(p, titulo) {
  if (p.photos?.length) {
    return p.photos
      .filter((ph) => ph?.image)
      .map(
        (ph, index) => `
          <div class="swiper-slide">
            <a href="propiedad.html?id=${p.id}" aria-label="Ver ${escapeHtml(titulo)}">
              <img
                src="${ph.image}"
                alt="${escapeHtml(titulo)} - foto ${index + 1}"
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        `,
      )
      .join("");
  }

  return `
    <div class="swiper-slide">
      <a href="propiedad.html?id=${p.id}" aria-label="Ver ${escapeHtml(titulo)}">
        <img
          src="assets/img/no-image.jpg"
          alt="${escapeHtml(titulo)}"
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  `;
}

function renderCardDestacada(propiedad, index) {
  const tipo =
    propertyTypeTranslations[propiedad.type?.name] ||
    propiedad.type?.name ||
    "Propiedad";

  const zona = propiedad.location?.name || "Zona no especificada";
  const titulo = propiedad.publication_title || `${tipo} en ${zona}`;

  const badgesHtml = construirBadgesOperacionHtml(propiedad);
  const preciosHtml = construirPreciosOperacionHtml(propiedad);

  const ambientes = Number(propiedad.room_amount || 0);
  const dormitorios = Number(propiedad.bedroom_amount || propiedad.suite_amount || 0);
  const banos = Number(propiedad.bathroom_amount || 0);
  const superficie = Number(propiedad.total_surface || 0);

  const totalFotos =
    propiedad.photos?.filter((ph) => ph?.image)?.length || 1;

  const slidesHtml = obtenerSlidesPropiedad(propiedad, titulo);

  return `
    <div class="swiper-slide">
      <article class="property-card property-card--home">
        <div class="property-card__media">
          <div class="property-card__badges">
            ${badgesHtml}
          </div>

          <div
            class="swiper mySwiper property-card__swiper"
            id="swiper-${index}"
            data-slides="${totalFotos}"
            aria-label="Galería de imágenes de ${escapeHtml(titulo)}"
          >
            <div class="swiper-wrapper">
              ${slidesHtml}
            </div>

            <div class="swiper-button-prev" aria-label="Imagen anterior"></div>
            <div class="swiper-button-next" aria-label="Imagen siguiente"></div>
          </div>
        </div>

        <div class="property-card__body">
          <div class="property-card__prices">
            ${preciosHtml}
          </div>

          <h3 class="property-card__title">
            <a href="propiedad.html?id=${propiedad.id}">
              ${escapeHtml(titulo)}
            </a>
          </h3>

          <p class="property-card__location">${escapeHtml(zona)}</p>

          <div class="property-card__features">
            ${
              ambientes > 0
                ? `<span><i class="fas fa-couch"></i> ${ambientes} amb.</span>`
                : ""
            }
            ${
              dormitorios > 0
                ? `<span><i class="fas fa-bed"></i> ${dormitorios} dorm.</span>`
                : ""
            }
            ${
              banos > 0
                ? `<span><i class="fas fa-bath"></i> ${banos} baños</span>`
                : ""
            }
            ${
              superficie > 0
                ? `<span><i class="fas fa-ruler-combined"></i> ${superficie} m²</span>`
                : ""
            }
          </div>

          <div class="property-card__footer">
            <span class="property-card__code">ID: ${propiedad.id}</span>
            <a class="property-card__link" href="propiedad.html?id=${propiedad.id}">
              Ver propiedad
            </a>
          </div>
        </div>
      </article>
    </div>
  `;
}

function cargarPropiedades() {
  fetch(API_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      contenedorCards.innerHTML = "";

      const propiedades = data.objects || [];

      propiedades.forEach((propiedad, index) => {
        contenedorCards.insertAdjacentHTML(
          "beforeend",
          renderCardDestacada(propiedad, index),
        );
      });

      inicializarSwipers();
      inicializarSwiperGeneral();
    })
    .catch((error) => {
      console.error("Error al cargar propiedades destacadas:", error);
      contenedorCards.innerHTML = "<p>Error al cargar propiedades.</p>";
    });
}

function inicializarSwipers() {
  document.querySelectorAll(".mySwiper").forEach((el) => {
    const totalSlides = Number(el.dataset.slides || 1);
    const hasMultiple = totalSlides > 1;

    new Swiper(el, {
      loop: hasMultiple,
      autoplay: false,
      slidesPerView: 1,
      spaceBetween: 0,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      navigation: {
        nextEl: el.querySelector(".swiper-button-next"),
        prevEl: el.querySelector(".swiper-button-prev"),
      },
    });
  });
}

function inicializarSwiperGeneral() {
  new Swiper(".myMainSwiper", {
    loop: true,
    grabCursor: true,
    slidesPerView: 3,
    slidesPerGroup: 3,
    spaceBetween: 30,
    breakpoints: {
      0: {
        slidesPerView: 1,
        slidesPerGroup: 1,
      },
      768: {
        slidesPerView: 2,
        slidesPerGroup: 2,
      },
      1024: {
        slidesPerView: 3,
        slidesPerGroup: 3,
      },
    },
  });
}

const copyright = document.getElementById("copyright");
if (copyright) {
  copyright.innerHTML =
    currentYear +
    " © Copyright NDB Propiedades. Todos los derechos reservados. Argentina, Buenos Aires.";
}

document.addEventListener("DOMContentLoaded", () => {
  cargarPropiedades();
});

/* =========================
   Fade-in observer
   ========================= */
const animables = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 },
);

animables.forEach((el) => observer.observe(el));

/* =========================
   Steps animation
   ========================= */
const pasos = document.querySelectorAll(".step");
const path = document.getElementById("snake-path");
const trail = document.getElementById("snake-trail");

if (path && trail && pasos.length) {
  const totalLength = path.getTotalLength();
  const pasosCount = pasos.length;
  const stepLength = totalLength / pasosCount;

  let pasoActual = 0;

  function moverCabeza(index) {
    const offset = stepLength * index - 5;
    path.getPointAtLength(offset);
    path.getPointAtLength(offset + 5);
    trail.setAttribute(
      "stroke-dashoffset",
      totalLength - (stepLength * index - 5),
    );
  }

  function activarPaso() {
    pasos.forEach((paso, i) => {
      paso.classList.toggle("active", i === pasoActual);
    });

    moverCabeza(pasoActual);
    pasoActual = (pasoActual + 1) % pasosCount;
  }

  activarPaso();
  setInterval(activarPaso, 1800);
}