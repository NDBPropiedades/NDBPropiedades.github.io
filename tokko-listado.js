let todasLasPropiedades = [];
let propiedadesFiltradas = [];
let paginaActual = 1;
const propiedadesPorPagina = 10;

const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
const API_URL = "https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true";

const contenedor = document.getElementById("lista-propiedades");
const contenedorZonas = document.getElementById("dropdown-zona");
const contenedorTipologias = document.getElementById("dropdown-tipologia");
const searchInput = document.getElementById("search-text");
const selectOperacion = document.getElementById("filtro-operacion");
const selectOrden = document.getElementById("filtro-orden");
const paginacionNav = document.getElementById("paginacion");

const propertyTypeTranslations = {
  Land:"Terreno", Apartment:"Departamento", House:"Casa", "Weekend House":"Casa de fin de semana",
  Office:"Oficina", Mooring:"Amarra", "Bussiness Premises":"Local comercial",
  "Commercial Building":"Edificio comercial", Countryside:"Campo", Garage:"Cochera", Hotel:"Hotel",
  "Industrial Ship":"Nave industrial", Condo:"PH", Storage:"Depósito", "Bussiness Permit":"Fondo de comercio",
  "Storage room":"Baulera", "Wine Cellar":"Bodega", Farm:"Granja", Ranch:"Estancia", "Nautical Bed":"Cama náutica"
};

// ============ helpers ============
const normalizar = s => (s || "").toString().toLowerCase()
  .normalize("NFD").replace(/\p{Diacritic}/gu, '');

function getCheckedValues(sel) {
  return Array.from(document.querySelectorAll(`${sel} input:checked`)).map(i => i.value);
}
function opToStd(op) {
  const o = (op || "").toString().toLowerCase();
  if (o.includes("temporary")) return "Temporary Rent";
  if (o.includes("rent") || o === "alquiler") return "Rent";
  return "Sale";
}

// ============ UI: Tipologías y Zonas ============
function poblarTipologiasUnicas(arr) {
  const set = new Set();
  arr.forEach(p => p.type?.name && set.add(p.type.name));
  contenedorTipologias.innerHTML = "";
  [...set].sort().forEach(val => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${val}" /> ${propertyTypeTranslations[val] || val}`;
    contenedorTipologias.appendChild(label);
  });
  contenedorTipologias.querySelectorAll("input").forEach(i => i.addEventListener("change", reiniciarListado));
}

function poblarZonasUnicas(arr) {
  const set = new Set();
  arr.forEach(p => p.location?.name && set.add(p.location.name));
  contenedorZonas.innerHTML = "";
  [...set].sort().forEach(val => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${val}" /> ${val}`;
    contenedorZonas.appendChild(label);
  });
  contenedorZonas.querySelectorAll("input").forEach(i => i.addEventListener("change", reiniciarListado));
}

// ============ Filtros + orden + búsqueda ============
function aplicarFiltros(base) {
  let data = [...base];

  // Operación
  const opSel = selectOperacion?.value && selectOperacion.value !== "default" ? selectOperacion.value : null;
  if (opSel) {
    data = data.filter(p => (p.operations || [])
      .some(op => opToStd(op.operation_type) === opSel));
  }

  // Tipología
  const tips = getCheckedValues("#dropdown-tipologia");
  if (tips.length) data = data.filter(p => tips.includes(p.type?.name));

  // Zona
  const zonas = getCheckedValues("#dropdown-zona");
  if (zonas.length) data = data.filter(p => zonas.includes(p.location?.name));

  // Búsqueda
  const term = normalizar(searchInput?.value);
  if (term) {
    data = data.filter(p => {
      const campos = [
        p.publication_title, p.location?.name, p.address, p.type?.name,
        p.operations?.[0]?.prices?.[0]?.price && `USD ${p.operations[0].prices[0].price}`
      ];
      return campos.some(x => normalizar(x).includes(term));
    });
  }

  // Orden
  const ord = selectOrden?.value;
  if (ord && ord !== "default") {
    data.sort((a,b) => {
      const pa = a.operations?.[0]?.prices?.[0]?.price || 0;
      const pb = b.operations?.[0]?.prices?.[0]?.price || 0;
      const ta = a.publication_title || "";
      const tb = b.publication_title || "";
      const da = new Date(a.created_on);
      const db = new Date(b.created_on);
      switch (ord) {
        case "precio-asc":  return pa - pb;
        case "precio-desc": return pb - pa;
        case "titulo-asc":  return ta.localeCompare(tb);
        case "titulo-desc": return tb.localeCompare(ta);
        case "fecha-asc":   return da - db;
        case "fecha-desc":  return db - da;
        default: return 0;
      }
    });
  }
  return data;
}

// ============ Render ============
function construirControlesPaginacion(total, pagina, porPagina) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  paginacionNav.innerHTML = "";

  const mkBtn = (label, page, disabled=false, activo=false) => {
    const el = document.createElement("button");
    el.textContent = label;
    if (disabled) el.disabled = true;
    if (activo) el.classList.add("activo");
    el.addEventListener("click", () => {
      if (!disabled && !activo) {
        paginaActual = page;
        renderPagina();
      }
    });
    return el;
  };

  // Prev
  paginacionNav.appendChild(mkBtn("«", Math.max(1, pagina-1), pagina===1));

  // números con elipsis
  const totalP = totalPaginas;
  const show = new Set([1, 2, totalP, totalP-1, pagina, pagina-1, pagina+1, pagina-2, pagina+2]);
  let last = 0;
  for (let n=1; n<=totalP; n++) {
    if (show.has(n)) {
      paginacionNav.appendChild(mkBtn(String(n), n, false, n===pagina));
      last = n;
    } else {
      if (last !== -1) {
        const span = document.createElement("span");
        span.className = "ellipsis";
        span.textContent = "…";
        paginacionNav.appendChild(span);
        last = -1;
      }
    }
  }

  // Next
  paginacionNav.appendChild(mkBtn("»", Math.min(totalP, pagina+1), pagina===totalP));
}

function renderPagina() {
  contenedor.innerHTML = "";

  if (!propiedadesFiltradas.length) {
    contenedor.innerHTML = `<div id="no-results" style="text-align:center;padding:2rem;color:#666">
      No encontramos propiedades con esos filtros.
    </div>`;
    paginacionNav.innerHTML = "";
    return;
  }

  const inicio = (paginaActual - 1) * propiedadesPorPagina;
  const fin = inicio + propiedadesPorPagina;
  const slice = propiedadesFiltradas.slice(inicio, fin);

  slice.forEach((e, idx) => {
    const slides = e.photos?.length
      ? e.photos.map(ph => `<div class="swiper-slide"><img src="${ph.image}" loading="lazy" /></div>`).join("")
      : '<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>';

    const tipo = propertyTypeTranslations[e.type?.name] || e.type?.name || "Propiedad";
    const zona = e.location?.name || "Zona no especificada";
    const opRaw = e.operations?.[0]?.operation_type || "sale";
    const op = opToStd(opRaw);
    const precio = e.operations?.[0]?.prices?.[0]?.price ? `USD ${e.operations[0].prices[0].price}` : "Consultar";
    const swiperId = `swiper-${inicio + idx}`;

    const l = e.room_amount || 0, b = e.bathroom_amount || 0, t = e.toilet_amount || 0, m2 = e.total_surface || 0;
    let iconos = "";
    if (l>0) iconos += `<span><i class="fas fa-bed"></i> ${l}</span>`;
    if (b>0) iconos += `<span><i class="fas fa-bath"></i> ${b}</span>`;
    if (t>0) iconos += `<span><i class="fas fa-toilet"></i> ${t}</span>`;
    if (m2>0) iconos += `<span><i class="fas fa-ruler-combined"></i> ${m2} m²</span>`;

    const card = `
      <div class="tokko-card">
        <div class="swiper mySwiper" id="${swiperId}">
          <div class="card-tag" style="background-color:${op==='Sale' ? '#0e246a' : '#7eccff'};">${op==='Sale'?'Venta':(op==='Temporary Rent'?'Alq. Temp.':'Alquiler')}</div>
          <div class="swiper-wrapper">${slides}</div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>
        <div class="info">
          <h3><a href="propiedad.html?id=${e.id}">${tipo} en ${zona}</a></h3>
          <p>${e.publication_title || ""}</p>
          <p><strong>Zona:</strong> ${zona}</p>
          <p><strong>Precio:</strong> ${precio}</p>
        </div>
        ${iconos ? `<div class="iconos-card">${iconos}</div>` : ""}
      </div>
    `;
    contenedor.insertAdjacentHTML("beforeend", card);

    // init swiper por card
    setTimeout(() => {
      new Swiper(`#${swiperId}`, {
        loop: true,
        navigation: { nextEl: `#${swiperId} .swiper-button-next`, prevEl: `#${swiperId} .swiper-button-prev` },
        autoplay: false
      });
    }, 0);
  });

  construirControlesPaginacion(propiedadesFiltradas.length, paginaActual, propiedadesPorPagina);
}

function reiniciarListado() {
  propiedadesFiltradas = aplicarFiltros(todasLasPropiedades);
  paginaActual = 1;
  renderPagina();
}

// ============ Fetch Tokko ============
async function fetchTodasLasPropiedades() {
  let res = [];
  let url = API_URL;
  while (url) {
    const resp = await fetch(url.startsWith("http") ? url : `https://tokkobroker.com${url}`);
    const data = await resp.json();
    res = res.concat(data.objects || []);
    url = data.meta?.next;
  }
  return res;
}

async function cargarPropiedades() {
  contenedor.innerHTML = "<p>Cargando propiedades...</p>";
  todasLasPropiedades = await fetchTodasLasPropiedades();
  contenedor.innerHTML = "";

  poblarTipologiasUnicas(todasLasPropiedades);
  poblarZonasUnicas(todasLasPropiedades);

  reiniciarListado(); // -> aplica filtros + pagina 1
}

// ============ UI dropdowns ============
function toggleDropdown(nombre) {
  const box = document.getElementById("dropdown-" + nombre);
  if (box) box.style.display = (box.style.display === "block") ? "none" : "block";
}
document.querySelector('.multiselect-title[data-target="tipologia"]').addEventListener("click", () => toggleDropdown("tipologia"));
document.querySelector('.multiselect-title[data-target="zona"]').addEventListener("click", () => toggleDropdown("zona"));
document.addEventListener("click", e => {
  document.querySelectorAll(".multiselect-wrapper").forEach(w => {
    if (!w.contains(e.target)) {
      const opt = w.querySelector(".multiselect-options");
      if (opt) opt.style.display = "none";
    }
  });
});

// ============ Listeners ============
selectOperacion.addEventListener("change", reiniciarListado);
selectOrden.addEventListener("change", reiniciarListado);

let debounceT;
searchInput?.addEventListener("input", () => {
  clearTimeout(debounceT);
  debounceT = setTimeout(reiniciarListado, 250);
});

// ============ init ============
cargarPropiedades();
