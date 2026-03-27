/* =========================
   TOKKO + SIDEBAR + GRID V2
   ========================= */

let todasLasPropiedades = [];
let propiedadesFiltradas = [];
let paginaActual = 1;

const propiedadesPorPagina = 50;
const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
const API_URL = `https://tokkobroker.com/api/v1/property/?key=${API_KEY}&format=json&shared=true`;

const contenedor = document.getElementById("lista-propiedades");
const searchInput = document.getElementById("search-text");
const paginacionNav = document.getElementById("paginacion");
const resultsCount = document.getElementById("results-count");
const emptyState = document.getElementById("empty-state");

const selOperacion = document.getElementById("filtro-operacion");
const selTipologia = document.getElementById("filtro-tipologia");
const selZona = document.getElementById("filtro-zona");
const selOrden = document.getElementById("filtro-orden");

const filtroPrecioMin = document.getElementById("filtro-precio-min");
const filtroPrecioMax = document.getElementById("filtro-precio-max");
const filtroAmbientes = document.getElementById("filtro-ambientes");
const btnLimpiar = document.getElementById("btn-limpiar");

const openFiltersBtn = document.getElementById("open-filters");
const closeFiltersBtn = document.getElementById("close-filters");
const filtersSidebar = document.getElementById("filters-sidebar");

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

const normalizar = (v) =>
  (v || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

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

/* =========================
   Scroll lock para mobile
   ========================= */
function lockScroll() {
  const y = window.scrollY || document.documentElement.scrollTop;
  document.documentElement.dataset.scrollY = y;
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");
  document.body.style.position = "fixed";
  document.body.style.top = `-${y}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockScroll() {
  const y = parseInt(document.documentElement.dataset.scrollY || "0", 10);
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, y);
}

/* =========================
   Tom Select
   ========================= */
let tsOperacion = null;
let tsTipologia = null;
let tsZona = null;
let tsOrden = null;

function initTomSelects() {
  if (!window.TomSelect) {
    console.error("TomSelect no cargó");
    return;
  }

  const makeTS = (el, extra = {}) => {
    if (!el) return null;

    const ts = new TomSelect(el, {
      plugins: ["remove_button"],
      create: false,
      persist: false,
      closeAfterSelect: false,
      placeholder: el.getAttribute("placeholder") || "",
      ...extra,
    });

    ts.on("dropdown_open", lockScroll);
    ts.on("dropdown_close", unlockScroll);
    ts.on("change", reiniciarListado);

    return ts;
  };

  try {
    tsOperacion?.destroy();
    tsTipologia?.destroy();
    tsZona?.destroy();
    tsOrden?.destroy();
  } catch (e) {}

  tsOperacion = makeTS(selOperacion, {
    maxItems: null,
  });

  tsTipologia = makeTS(selTipologia, {
    maxItems: null,
  });

  tsZona = makeTS(selZona, {
    maxItems: null,
  });

  tsOrden = makeTS(selOrden, {
    plugins: [],
    maxItems: 1,
    closeAfterSelect: true,
    searchField: ["text", "value"],
  });
}

/* =========================
   Opciones de filtros
   ========================= */
function cargarOpcionesDesdeDatos(props) {
  const ops = new Set();
  props.forEach((p) =>
    (p.operations || []).forEach((o) => ops.add(opToStd(o.operation_type))),
  );

  const opsOptions = [...ops].map((v) => ({
    value: v,
    text:
      v === "Sale" ? "Venta" : v === "Rent" ? "Alquiler" : "Alquiler Temporal",
  }));

  tsOperacion?.clear();
  tsOperacion?.clearOptions();
  tsOperacion?.addOptions(opsOptions);
  tsOperacion?.refreshOptions(false);

  const tipos = new Set();
  props.forEach((p) => {
    const t = p.type?.name;
    if (t) tipos.add(t);
  });

  const tipoOptions = [...tipos]
    .sort()
    .map((v) => ({ value: v, text: propertyTypeTranslations[v] || v }));

  tsTipologia?.clear();
  tsTipologia?.clearOptions();
  tsTipologia?.addOptions(tipoOptions);
  tsTipologia?.refreshOptions(false);

  const zonas = new Set();
  props.forEach((p) => {
    const z = p.location?.name;
    if (z) zonas.add(z);
  });

  const zonaOptions = [...zonas]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((v) => ({ value: v, text: v }));

  tsZona?.clear();
  tsZona?.clearOptions();
  tsZona?.addOptions(zonaOptions);
  tsZona?.refreshOptions(false);

  const ordenOptions = [
    { value: "precio-desc", text: "Precio: mayor a menor" },
    { value: "precio-asc", text: "Precio: menor a mayor" },
    { value: "titulo-asc", text: "Título: A-Z" },
    { value: "titulo-desc", text: "Título: Z-A" },
    { value: "fecha-desc", text: "Nuevas primero" },
    { value: "fecha-asc", text: "Antiguas primero" },
  ];

  tsOrden?.clear();
  tsOrden?.clearOptions();
  tsOrden?.addOptions(ordenOptions);
  tsOrden?.refreshOptions(false);
}

/* =========================
   Helpers precio / operación
   ========================= */
function precioNumericoDePriceObj(priceObj) {
  return {
    currency: (priceObj?.currency || "").toUpperCase(),
    value: Number(priceObj?.price || 0),
  };
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

function elegirOperacionParaCard(p) {
  const opsStd = (p.operations || []).map((o) => opToStd(o.operation_type));
  const selectedOps = tsOperacion?.getValue?.() || [];

  let opS = selectedOps.find((op) => opsStd.includes(op));

  if (!opS) {
    if (opsStd.includes("Temporary Rent")) opS = "Temporary Rent";
    else if (opsStd.includes("Rent")) opS = "Rent";
    else opS = "Sale";
  }

  return opS;
}

function obtenerPriceObjSegunOperacion(p, opS) {
  const op =
    (p.operations || []).find((o) => opToStd(o.operation_type) === opS) ||
    (p.operations || [])[0];

  return op?.prices?.[0] || null;
}

function precioDeOperacion(p, opS) {
  const priceObj = obtenerPriceObjSegunOperacion(p, opS);
  return formatearPrecioTokko(priceObj);
}

function precioNumericoSegunOperacion(p, opS) {
  const priceObj = obtenerPriceObjSegunOperacion(p, opS);
  return precioNumericoDePriceObj(priceObj);
}

/* =========================
   Helpers slider / imágenes
   ========================= */
const propertySwipers = [];

function destruirSwipersActivos() {
  while (propertySwipers.length) {
    const instance = propertySwipers.pop();
    try {
      instance?.destroy(true, true);
    } catch (e) {}
  }
}

function escapeHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obtenerImagenPrincipal(p) {
  if (p.photos?.length && p.photos[0]?.image) {
    return p.photos[0].image;
  }
  return "assets/img/no-image.jpg";
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

function initPropertySwipers() {
  if (!window.Swiper) {
    console.warn("Swiper no está cargado. Las cards se mostrarán sin slider funcional.");
    return;
  }

  const swipers = document.querySelectorAll(".property-card__swiper");

  swipers.forEach((el) => {
    const totalSlides = Number(el.dataset.slides || 1);
    const hasMultiple = totalSlides > 1;

    const instance = new Swiper(el, {
      loop: hasMultiple,
      slidesPerView: 1,
      spaceBetween: 0,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      navigation: {
        nextEl: el.querySelector(".swiper-button-next"),
        prevEl: el.querySelector(".swiper-button-prev"),
      },
      pagination: {
        el: el.querySelector(".swiper-pagination"),
        clickable: true,
      },
      autoplay: false,
    });

    propertySwipers.push(instance);
  });
}

/* =========================
   Filtros
   ========================= */
function aplicarFiltros(lista) {
  let arr = [...lista];

  const operaciones = (tsOperacion?.getValue?.() || []).filter(Boolean);
  if (operaciones.length) {
    arr = arr.filter((p) =>
      (p.operations || []).some((o) =>
        operaciones.includes(opToStd(o.operation_type)),
      ),
    );
  }

  const tipologias = (tsTipologia?.getValue?.() || []).filter(Boolean);
  if (tipologias.length) {
    arr = arr.filter((p) => tipologias.includes(p.type?.name));
  }

  const zonas = (tsZona?.getValue?.() || []).filter(Boolean);
  if (zonas.length) {
    arr = arr.filter((p) => zonas.includes(p.location?.name));
  }

  const precioMin = Number(filtroPrecioMin?.value || 0);
  const precioMax = filtroPrecioMax?.value
    ? Number(filtroPrecioMax.value)
    : Infinity;

  if (precioMin > 0 || Number.isFinite(precioMax)) {
    arr = arr.filter((p) => {
      const opS = elegirOperacionParaCard(p);
      const priceData = precioNumericoSegunOperacion(p, opS);
      const precio = Number(priceData.value || 0);
      return precio >= precioMin && precio <= precioMax;
    });
  }

  const ambientesMin = Number(filtroAmbientes?.value || 0);
  if (ambientesMin > 0) {
    arr = arr.filter((p) => Number(p.room_amount || 0) >= ambientesMin);
  }

  const q = normalizar(searchInput?.value);
  if (q) {
    arr = arr.filter((p) => {
      const opS = elegirOperacionParaCard(p);
      const precioTexto = precioDeOperacion(p, opS);

      const campos = [
        p.publication_title,
        p.location?.name,
        p.address,
        p.type?.name,
        propertyTypeTranslations[p.type?.name] || p.type?.name,
        precioTexto,
      ];

      return campos.some((v) => normalizar(v).includes(q));
    });
  }

  const orden = tsOrden?.getValue?.() || "";

  if (orden) {
    arr.sort((a, b) => {
      const opA = elegirOperacionParaCard(a);
      const opB = elegirOperacionParaCard(b);

      const pa = precioNumericoSegunOperacion(a, opA);
      const pb = precioNumericoSegunOperacion(b, opB);

      const rank = (cur) => (cur === "USD" ? 0 : cur === "ARS" ? 1 : 2);

      const ta = a.publication_title || "";
      const tb = b.publication_title || "";

      const fa = new Date(a.created_on || 0);
      const fb = new Date(b.created_on || 0);

      switch (orden) {
        case "precio-asc":
          if (rank(pa.currency) !== rank(pb.currency)) {
            return rank(pa.currency) - rank(pb.currency);
          }
          return pa.value - pb.value;

        case "precio-desc":
          if (rank(pa.currency) !== rank(pb.currency)) {
            return rank(pa.currency) - rank(pb.currency);
          }
          return pb.value - pa.value;

        case "titulo-asc":
          return ta.localeCompare(tb, "es");

        case "titulo-desc":
          return tb.localeCompare(ta, "es");

        case "fecha-asc":
          return fa - fb;

        case "fecha-desc":
          return fb - fa;

        default:
          return 0;
      }
    });
  }

  return arr;
}

/* =========================
   Paginación
   ========================= */
function construirControlesPaginacion(total, actual, porPagina) {
  if (!paginacionNav) return;

  paginacionNav.innerHTML = "";

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (totalPaginas <= 1) return;

  const crearBoton = (label, pagina, disabled = false, activo = false) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;

    if (disabled) b.disabled = true;
    if (activo) b.classList.add("active");

    b.addEventListener("click", () => {
      if (disabled || activo) return;
      paginaActual = pagina;
      renderPagina();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return b;
  };

  paginacionNav.appendChild(
    crearBoton("‹", Math.max(1, actual - 1), actual === 1),
  );

  const mostrar = new Set([
    1,
    2,
    totalPaginas,
    totalPaginas - 1,
    actual,
    actual - 1,
    actual + 1,
    actual - 2,
    actual + 2,
  ]);

  let previoMostrado = 0;

  for (let i = 1; i <= totalPaginas; i++) {
    if (mostrar.has(i)) {
      paginacionNav.appendChild(crearBoton(String(i), i, false, i === actual));
      previoMostrado = i;
    } else if (previoMostrado !== -1) {
      const sp = document.createElement("span");
      sp.className = "ellipsis";
      sp.textContent = "…";
      paginacionNav.appendChild(sp);
      previoMostrado = -1;
    }
  }

  paginacionNav.appendChild(
    crearBoton(
      "›",
      Math.min(totalPaginas, actual + 1),
      actual === totalPaginas,
    ),
  );
}

/* =========================
   Render cards
   ========================= */
function cerrarSidebarMobile() {
  if (window.innerWidth <= 920 && filtersSidebar) {
    filtersSidebar.classList.remove("is-open");
    unlockScroll();
  }
}

function renderPagina() {
  if (!contenedor) return;

  destruirSwipersActivos();
  contenedor.innerHTML = "";

  if (!propiedadesFiltradas.length) {
    if (resultsCount) {
      resultsCount.textContent = "0 propiedades encontradas";
    }

    if (emptyState) {
      emptyState.hidden = false;
    }

    contenedor.style.display = "none";
    paginacionNav.innerHTML = "";
    return;
  }

  if (resultsCount) {
    resultsCount.textContent = `${propiedadesFiltradas.length} propiedades encontradas`;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  contenedor.style.display = "grid";

  const start = (paginaActual - 1) * propiedadesPorPagina;
  const items = propiedadesFiltradas.slice(start, start + propiedadesPorPagina);

  items.forEach((p, index) => {
    const tipo =
      propertyTypeTranslations[p.type?.name] || p.type?.name || "Propiedad";
    const zona = p.location?.name || "Zona no especificada";
    const titulo = p.publication_title || `${tipo} en ${zona}`;

    const opS = elegirOperacionParaCard(p);

    const badgeText =
      opS === "Sale" ? "Venta" : opS === "Rent" ? "Alquiler" : "Temporal";

    const badgeClass =
      opS === "Sale"
        ? "badge-sale"
        : opS === "Rent"
          ? "badge-rent"
          : "badge-temporary";

    const precio = precioDeOperacion(p, opS);

    const ambientes = Number(p.room_amount || 0);
    const dormitorios = Number(p.suite_amount || 0);
    const banos = Number(p.bathroom_amount || 0);
    const superficie = Number(p.total_surface || 0);

    const sliderId = `property-swiper-${start + index}-${p.id}`;
    const totalFotos = p.photos?.filter((ph) => ph?.image)?.length || 1;
    const slidesHtml = obtenerSlidesPropiedad(p, titulo);

    const html = `
      <article class="property-card">
        <div class="property-card__media">
          <span class="property-card__badge ${badgeClass}">${badgeText}</span>

          <div
            class="swiper property-card__swiper"
            id="${sliderId}"
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
          <p class="property-card__price">${precio}</p>

          <h3 class="property-card__title">
            <a href="propiedad.html?id=${p.id}" style="color:inherit;text-decoration:none;">
              ${titulo}
            </a>
          </h3>

          <p class="property-card__location">${zona}</p>

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
            <span class="property-card__code">ID: ${p.id}</span>
            <a class="property-card__link" href="propiedad.html?id=${p.id}">
              Ver propiedad
            </a>
          </div>
        </div>
      </article>
    `;

    contenedor.insertAdjacentHTML("beforeend", html);
  });

  initPropertySwipers();

  construirControlesPaginacion(
    propiedadesFiltradas.length,
    paginaActual,
    propiedadesPorPagina,
  );
}

/* =========================
   Re-render
   ========================= */
function reiniciarListado() {
  propiedadesFiltradas = aplicarFiltros(todasLasPropiedades);
  paginaActual = 1;
  renderPagina();
}

/* =========================
   Fetch Tokko
   ========================= */
async function fetchTodasLasPropiedades() {
  let res = [];
  let url = API_URL;

  while (url) {
    const response = await fetch(
      url.startsWith("http") ? url : `https://tokkobroker.com${url}`,
    );

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();
    res = res.concat(data.objects || []);
    url = data.meta?.next || null;
  }

  return res;
}

async function cargarPropiedades() {
  try {
    if (resultsCount) {
      resultsCount.textContent = "Cargando propiedades...";
    }

    contenedor.innerHTML = "";

    todasLasPropiedades = await fetchTodasLasPropiedades();

    cargarOpcionesDesdeDatos(todasLasPropiedades);
    reiniciarListado();
  } catch (error) {
    console.error("Error cargando propiedades:", error);

    if (resultsCount) {
      resultsCount.textContent = "No se pudieron cargar las propiedades";
    }

    contenedor.style.display = "none";

    if (emptyState) {
      emptyState.hidden = false;
      emptyState.innerHTML = `
        <i class="fas fa-house-circle-xmark"></i>
        <h3>No se pudieron cargar las propiedades</h3>
        <p>Revisá la conexión, la API o las restricciones de CORS.</p>
      `;
    }
  }
}

/* =========================
   Listeners
   ========================= */
let debounceT = null;

searchInput?.addEventListener("input", () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(reiniciarListado, 250);
});

filtroPrecioMin?.addEventListener("input", () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(reiniciarListado, 250);
});

filtroPrecioMax?.addEventListener("input", () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(reiniciarListado, 250);
});

filtroAmbientes?.addEventListener("change", reiniciarListado);

btnLimpiar?.addEventListener("click", () => {
  searchInput.value = "";
  if (filtroPrecioMin) filtroPrecioMin.value = "";
  if (filtroPrecioMax) filtroPrecioMax.value = "";
  if (filtroAmbientes) filtroAmbientes.value = "";

  tsOperacion?.clear(true);
  tsTipologia?.clear(true);
  tsZona?.clear(true);
  tsOrden?.clear(true);

  reiniciarListado();
});

openFiltersBtn?.addEventListener("click", () => {
  filtersSidebar?.classList.add("is-open");
  lockScroll();
});

closeFiltersBtn?.addEventListener("click", () => {
  filtersSidebar?.classList.remove("is-open");
  unlockScroll();
});

document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 920 &&
    filtersSidebar?.classList.contains("is-open") &&
    !filtersSidebar.contains(e.target) &&
    !openFiltersBtn?.contains(e.target)
  ) {
    filtersSidebar.classList.remove("is-open");
    unlockScroll();
  }
});

/* =========================
   Boot
   ========================= */
(function boot() {
  initTomSelects();
  cargarPropiedades();

  const copyright = document.getElementById("copyright");
  if (copyright) {
    const year = new Date().getFullYear();
    copyright.textContent = `© ${year} NDB Propiedades. Todos los derechos reservados.`;
  }
})();