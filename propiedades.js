/* =========================
   TOKKO + SIDEBAR + GRID V2
   ========================= */

let todasLasPropiedades = [];
let propiedadesFiltradas = [];
let paginaActual = 1;

const propiedadesPorPagina = 24;
const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
const API_URL = `https://tokkobroker.com/api/v1/property/?key=${API_KEY}&format=json&shared=true&limit=500`;
const WHATSAPP_NUMERO = "5491172172121";
const CACHE_KEY = "ndb-propiedades-v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
let datosListos = false;

const contenedor = document.getElementById("lista-propiedades");
const searchInput = document.getElementById("search-text");
const paginacionNav = document.getElementById("paginacion");
const resultsCount = document.getElementById("results-count");
const emptyState = document.getElementById("empty-state");

const selOperacion = document.getElementById("filtro-operacion");
const selTipologia = document.getElementById("filtro-tipologia");
const selZona = document.getElementById("filtro-zona");
const selOrden = document.getElementById("filtro-orden");

const filtroMoneda = document.getElementById("filtro-moneda");
const filtroPrecioMin = document.getElementById("filtro-precio-min");
const filtroPrecioMax = document.getElementById("filtro-precio-max");
const filtroAmbientes = document.getElementById("filtro-ambientes");
const btnLimpiar = document.getElementById("btn-limpiar");

const openFiltersBtn = document.getElementById("open-filters");
const closeFiltersBtn = document.getElementById("close-filters");
const filtersSidebar = document.getElementById("filters-sidebar");
const filtersBadge = document.getElementById("filters-badge");
const btnVerResultados = document.getElementById("btn-ver-resultados");
const emptyTitle = document.getElementById("empty-title");
const emptyText = document.getElementById("empty-text");
const emptyAction = document.getElementById("empty-action");

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

    ts.on("change", reiniciarListado);

    return ts;
  };

  try {
    tsOperacion?.destroy();
    tsTipologia?.destroy();
    tsZona?.destroy();
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

  tsOperacion?.clear(true);
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

  tsTipologia?.clear(true);
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

  tsZona?.clear(true);
  tsZona?.clearOptions();
  tsZona?.addOptions(zonaOptions);
  tsZona?.refreshOptions(false);
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
  if (!priceObj || !(Number(priceObj.price) > 0)) return "Consultar precio";

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
  const selectedOpsRaw = tsOperacion?.getValue?.() || [];
  const selectedOps = Array.isArray(selectedOpsRaw)
    ? selectedOpsRaw
    : [selectedOpsRaw].filter(Boolean);

  let opS = selectedOps.find((op) => opsStd.includes(op));

  if (!opS) {
    if (opsStd.includes("Sale")) opS = "Sale";
    else if (opsStd.includes("Rent")) opS = "Rent";
    else if (opsStd.includes("Temporary Rent")) opS = "Temporary Rent";
    else opS = opsStd[0] || "Sale";
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

function obtenerSlidesPropiedad(p, titulo) {
  if (p.photos?.length) {
    return p.photos
      .filter((ph) => ph?.image)
      .map(
        (ph, index) => `
          <div class="swiper-slide">
            <a href="propiedad.html?id=${p.id}" aria-label="Ver ${escapeHtml(titulo)}">
              <img
                ${index === 0 ? `src="${ph.image}"` : `data-src="${ph.image}"`}
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
          src="/assets/img/no-image.jpg"
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
    console.warn(
      "Swiper no está cargado. Las cards se mostrarán sin slider funcional.",
    );
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

    // El resto de las fotos se descarga recién cuando el usuario llega al slider
    if (hasMultiple) {
      const hidratar = () => {
        el.querySelectorAll("img[data-src]").forEach((img) => {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        });
      };
      el.addEventListener("pointerenter", hidratar, { once: true });
      el.addEventListener("focusin", hidratar, { once: true });
    }
  });
}

/* =========================
   Filtros
   ========================= */
function aplicarFiltros(lista) {
  let arr = [...lista];

  const operacionesRaw = tsOperacion?.getValue?.() || [];
  const operaciones = Array.isArray(operacionesRaw)
    ? operacionesRaw.filter(Boolean)
    : [operacionesRaw].filter(Boolean);

  if (operaciones.length) {
    arr = arr.filter((p) =>
      (p.operations || []).some((o) =>
        operaciones.includes(opToStd(o.operation_type)),
      ),
    );
  }

  const tipologiasRaw = tsTipologia?.getValue?.() || [];
  const tipologias = Array.isArray(tipologiasRaw)
    ? tipologiasRaw.filter(Boolean)
    : [tipologiasRaw].filter(Boolean);

  if (tipologias.length) {
    arr = arr.filter((p) => tipologias.includes(p.type?.name));
  }

  const zonasRaw = tsZona?.getValue?.() || [];
  const zonas = Array.isArray(zonasRaw)
    ? zonasRaw.filter(Boolean)
    : [zonasRaw].filter(Boolean);

  if (zonas.length) {
    arr = arr.filter((p) => zonas.includes(p.location?.name));
  }

  const precioMin = Number(filtroPrecioMin?.value || 0);
  const precioMax = filtroPrecioMax?.value
    ? Number(filtroPrecioMax.value)
    : Infinity;

  if (precioMin > 0 || Number.isFinite(precioMax)) {
    const moneda = filtroMoneda?.value || "USD";

    arr = arr.filter((p) =>
      (p.operations || []).some((o) => {
        if (
          operaciones.length &&
          !operaciones.includes(opToStd(o.operation_type))
        ) {
          return false;
        }

        const { currency, value } = precioNumericoDePriceObj(o?.prices?.[0]);
        return (
          currency === moneda &&
          value > 0 &&
          value >= precioMin &&
          value <= precioMax
        );
      }),
    );
  }

  const ambientesMin = Number(filtroAmbientes?.value || 0);
  if (ambientesMin > 0) {
    arr = arr.filter((p) => Number(p.room_amount || 0) >= ambientesMin);
  }

  const q = normalizar(searchInput?.value);
  if (q) {
    arr = arr.filter((p) => {
      const operacionesTexto = obtenerOperacionesDePropiedad(p)
        .map((op) => `${op.label} ${formatearPrecioTokko(op.priceObj)}`)
        .join(" ");

      const campos = [
        p.publication_title,
        p.location?.name,
        p.address,
        p.type?.name,
        propertyTypeTranslations[p.type?.name] || p.type?.name,
        operacionesTexto,
      ];

      return campos.some((v) => normalizar(v).includes(q));
    });
  }

  const orden = selOrden?.value || "";

  if (orden) {
    arr.sort((a, b) => {
      const opA = elegirOperacionParaCard(a);
      const opB = elegirOperacionParaCard(b);

      const pa = precioNumericoSegunOperacion(a, opA);
      const pb = precioNumericoSegunOperacion(b, opB);

      const rank = (cur) => (cur === "USD" ? 0 : cur === "ARS" ? 1 : 2);

      const ta = a.publication_title || "";
      const tb = b.publication_title || "";

      const fa = new Date(a.created_at || 0);
      const fb = new Date(b.created_at || 0);

      const compararPrecio = (direccion) => {
        const conPrecioA = pa.value > 0;
        const conPrecioB = pb.value > 0;
        if (conPrecioA !== conPrecioB) return conPrecioA ? -1 : 1;
        if (rank(pa.currency) !== rank(pb.currency)) {
          return rank(pa.currency) - rank(pb.currency);
        }
        return direccion * (pa.value - pb.value);
      };

      switch (orden) {
        case "precio-asc":
          return compararPrecio(1);

        case "precio-desc":
          return compararPrecio(-1);

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
      sincronizarURL("push");
      const layout = document.querySelector(".properties-layout");
      const top = layout
        ? layout.getBoundingClientRect().top + window.scrollY - 110
        : 0;
      window.scrollTo({ top, behavior: "smooth" });
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
  if (
    window.innerWidth <= 920 &&
    filtersSidebar?.classList.contains("is-open")
  ) {
    filtersSidebar.classList.remove("is-open");
    unlockScroll();
  }
}

function textoPropiedades(n) {
  return n === 1 ? "1 propiedad" : `${n} propiedades`;
}

function actualizarConteo(n) {
  if (resultsCount) {
    resultsCount.textContent = `${textoPropiedades(n)} ${
      n === 1 ? "encontrada" : "encontradas"
    }`;
  }

  if (btnVerResultados) {
    btnVerResultados.textContent = n
      ? `Ver ${textoPropiedades(n)}`
      : "Sin resultados";
  }
}

function linkWhatsappPropiedad(p, titulo) {
  const mensaje = `Hola NDB Propiedades! Me interesa la propiedad "${titulo}" (ID ${p.id}): https://ndbpropiedades.com.ar/propiedad.html?id=${p.id}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function mostrarEstadoVacio(error = false) {
  if (!emptyState) return;

  emptyTitle.textContent = error
    ? "No pudimos cargar las propiedades"
    : "No encontramos propiedades con esos filtros";
  emptyText.textContent = error
    ? "Probá de nuevo en unos minutos o escribinos y te ayudamos."
    : "Probá ajustando la búsqueda o contanos qué estás buscando.";
  emptyAction.textContent = error ? "Reintentar" : "Limpiar filtros";
  emptyAction.dataset.accion = error ? "reintentar" : "limpiar";
  emptyState.hidden = false;
}

function mostrarSkeleton() {
  contenedor.style.display = "grid";
  contenedor.innerHTML = `
    <div class="property-card property-card--skeleton" aria-hidden="true">
      <div class="property-card__media"></div>
      <div class="property-card__body">
        <span></span><span></span><span></span>
      </div>
    </div>
  `.repeat(6);
}

function renderPagina() {
  if (!contenedor) return;

  destruirSwipersActivos();
  contenedor.innerHTML = "";

  if (!propiedadesFiltradas.length) {
    actualizarConteo(0);
    mostrarEstadoVacio();

    contenedor.style.display = "none";
    paginacionNav.innerHTML = "";
    return;
  }

  actualizarConteo(propiedadesFiltradas.length);

  if (emptyState) {
    emptyState.hidden = true;
  }

  contenedor.style.display = "grid";

  const totalPaginas = Math.ceil(
    propiedadesFiltradas.length / propiedadesPorPagina,
  );
  paginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);

  const start = (paginaActual - 1) * propiedadesPorPagina;
  const items = propiedadesFiltradas.slice(start, start + propiedadesPorPagina);

  items.forEach((p, index) => {
    const tipo =
      propertyTypeTranslations[p.type?.name] || p.type?.name || "Propiedad";
    const zona = p.location?.name || "Zona no especificada";
    const titulo = p.publication_title || `${tipo} en ${zona}`;

    const badgesHtml = construirBadgesOperacionHtml(p);
    const preciosHtml = construirPreciosOperacionHtml(p);

    const ambientes = Number(p.room_amount || 0);
    const dormitorios = Number(
      p.bedroom_amount || p.suite_amount || 0,
    );
    const banos = Number(p.bathroom_amount || 0);
    const superficie = Number(p.total_surface || 0);

    const sliderId = `property-swiper-${start + index}-${p.id}`;
    const totalFotos = p.photos?.filter((ph) => ph?.image)?.length || 1;
    const slidesHtml = obtenerSlidesPropiedad(p, titulo);

    const html = `
      <article class="property-card">
        <div class="property-card__media">
          <div class="property-card__badges">
            ${badgesHtml}
          </div>

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
          <div class="property-card__prices">
            ${preciosHtml}
          </div>

          <h3 class="property-card__title">
            <a href="propiedad.html?id=${p.id}" style="color:inherit;text-decoration:none;">
              ${escapeHtml(titulo)}
            </a>
          </h3>

          <p class="property-card__location">
            <span>${escapeHtml(zona)}</span>
            <span class="property-card__code">ID: ${p.id}</span>
          </p>

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
                ? `<span><i class="fas fa-bath"></i> ${banos} ${banos === 1 ? "baño" : "baños"}</span>`
                : ""
            }
            ${
              superficie > 0
                ? `<span><i class="fas fa-ruler-combined"></i> ${superficie} m²</span>`
                : ""
            }
          </div>

          <div class="property-card__footer">
            <a
              class="property-card__whatsapp"
              href="${linkWhatsappPropiedad(p, titulo)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Consultar por WhatsApp: ${escapeHtml(titulo)}"
            >
              <i class="fab fa-whatsapp"></i>
              Consultar
            </a>
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
  actualizarBadgeFiltros();
  sincronizarURL();
}

/* =========================
   Filtros en la URL
   ========================= */
function sincronizarURL(modo = "replace") {
  if (!datosListos) return;

  const params = new URLSearchParams();
  const agregar = (clave, valor) => {
    if (valor) params.append(clave, valor);
  };

  agregar("q", searchInput?.value.trim());
  (tsOperacion?.getValue() || []).forEach((v) => agregar("op", v));
  (tsTipologia?.getValue() || []).forEach((v) => agregar("tipo", v));
  (tsZona?.getValue() || []).forEach((v) => agregar("zona", v));
  agregar("min", filtroPrecioMin?.value);
  agregar("max", filtroPrecioMax?.value);
  if (filtroPrecioMin?.value || filtroPrecioMax?.value) {
    agregar("moneda", filtroMoneda?.value);
  }
  agregar("amb", filtroAmbientes?.value);
  agregar("orden", selOrden?.value);
  if (paginaActual > 1) agregar("pag", String(paginaActual));

  const query = params.toString();
  const url = `${location.pathname}${query ? `?${query}` : ""}`;

  if (modo === "push") history.pushState(null, "", url);
  else history.replaceState(null, "", url);
}

function aplicarEstadoDesdeURL() {
  const params = new URLSearchParams(location.search);

  if (searchInput) searchInput.value = params.get("q") || "";
  if (filtroPrecioMin) filtroPrecioMin.value = params.get("min") || "";
  if (filtroPrecioMax) filtroPrecioMax.value = params.get("max") || "";
  if (filtroMoneda) {
    filtroMoneda.value = params.get("moneda") === "ARS" ? "ARS" : "USD";
  }
  if (filtroAmbientes) filtroAmbientes.value = params.get("amb") || "";
  if (selOrden) {
    selOrden.value = params.get("orden") || "";
    if (selOrden.selectedIndex < 0) selOrden.value = "";
  }

  tsOperacion?.setValue(params.getAll("op"), true);
  tsTipologia?.setValue(params.getAll("tipo"), true);
  tsZona?.setValue(params.getAll("zona"), true);

  paginaActual = Math.max(1, parseInt(params.get("pag"), 10) || 1);
}

function mostrarDesdeEstadoURL() {
  aplicarEstadoDesdeURL();
  propiedadesFiltradas = aplicarFiltros(todasLasPropiedades);
  renderPagina();
  actualizarBadgeFiltros();
}

function limpiarFiltros() {
  if (searchInput) searchInput.value = "";
  if (filtroPrecioMin) filtroPrecioMin.value = "";
  if (filtroPrecioMax) filtroPrecioMax.value = "";
  if (filtroMoneda) filtroMoneda.value = "USD";
  if (filtroAmbientes) filtroAmbientes.value = "";

  tsOperacion?.clear(true);
  tsTipologia?.clear(true);
  tsZona?.clear(true);

  reiniciarListado();
}

function actualizarBadgeFiltros() {
  if (!filtersBadge) return;

  const activos = [
    searchInput?.value.trim(),
    tsOperacion?.getValue?.().length,
    tsTipologia?.getValue?.().length,
    tsZona?.getValue?.().length,
    filtroPrecioMin?.value,
    filtroPrecioMax?.value,
    filtroAmbientes?.value,
  ].filter(Boolean).length;

  filtersBadge.textContent = activos;
  filtersBadge.hidden = activos === 0;
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

function leerCache() {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (guardado && Date.now() - guardado.fecha < CACHE_TTL_MS) {
      return guardado.propiedades;
    }
  } catch (e) {}
  return null;
}

function guardarCache(propiedades) {
  try {
    const livianas = propiedades.map((p) => ({
      id: p.id,
      publication_title: p.publication_title,
      type: { name: p.type?.name },
      location: { name: p.location?.name },
      address: p.address,
      operations: p.operations,
      photos: (p.photos || []).map((ph) => ({ image: ph?.image })),
      room_amount: p.room_amount,
      bedroom_amount: p.bedroom_amount,
      suite_amount: p.suite_amount,
      bathroom_amount: p.bathroom_amount,
      total_surface: p.total_surface,
      created_at: p.created_at,
    }));

    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fecha: Date.now(), propiedades: livianas }),
    );
  } catch (e) {}
}

async function cargarPropiedades() {
  try {
    if (emptyState) emptyState.hidden = true;

    let propiedades = leerCache();

    if (!propiedades) {
      if (resultsCount) {
        resultsCount.textContent = "Cargando propiedades...";
      }
      mostrarSkeleton();
      propiedades = await fetchTodasLasPropiedades();
      guardarCache(propiedades);
    }

    todasLasPropiedades = propiedades;
    cargarOpcionesDesdeDatos(todasLasPropiedades);
    datosListos = true;
    mostrarDesdeEstadoURL();
  } catch (error) {
    console.error("Error cargando propiedades:", error);

    if (resultsCount) {
      resultsCount.textContent = "No se pudieron cargar las propiedades";
    }

    contenedor.innerHTML = "";
    contenedor.style.display = "none";
    mostrarEstadoVacio(true);
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
selOrden?.addEventListener("change", reiniciarListado);
filtroMoneda?.addEventListener("change", reiniciarListado);

window.addEventListener("popstate", () => {
  if (datosListos) mostrarDesdeEstadoURL();
});

btnLimpiar?.addEventListener("click", limpiarFiltros);

emptyAction?.addEventListener("click", () => {
  if (emptyAction.dataset.accion === "reintentar") cargarPropiedades();
  else limpiarFiltros();
});

btnVerResultados?.addEventListener("click", () => {
  cerrarSidebarMobile();
  document
    .querySelector(".properties-content")
    ?.scrollIntoView({ behavior: "smooth" });
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
    !e.composedPath().includes(filtersSidebar) &&
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
  cargarVideoHero();
  cargarPropiedades();

  const copyright = document.getElementById("copyright");
  if (copyright) {
    const year = new Date().getFullYear();
    copyright.textContent = `© ${year} NDB Propiedades. Todos los derechos reservados.`;
  }

  initBackToTop();
})();

/* =========================
   Video del hero (solo desktop)
   ========================= */
function cargarVideoHero() {
  const video = document.querySelector(".properties-hero__video");
  if (!video) return;

  const esDesktop = window.matchMedia("(min-width: 921px)").matches;
  const reduceMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const ahorraDatos = navigator.connection?.saveData;

  if (!esDesktop || reduceMovimiento || ahorraDatos) return;

  video.src = video.dataset.src;
  video.play().catch(() => {});
}

/* =========================
   Volver arriba (mobile)
   ========================= */
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    backToTopBtn.classList.toggle("is-visible", window.scrollY > 400);
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}