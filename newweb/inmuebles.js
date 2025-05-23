var currentYear = new Date().getFullYear();
document.getElementById("copyright").innerHTML =
  currentYear +
  " © Copyright NDB Propiedades. Todos los derechos reservados. Argentina, Buenos Aires.";
// --- Variables globales ---
const inmueblesContainer = document.getElementById("inmuebles-list");
const filtroOperacion = document.getElementById("filtro-operacion");
const filtroTipologia = document.getElementById("filtro-tipologia");
const filtroZona = document.getElementById("filtro-zona");
const filtroPartido = document.getElementById("filtro-partido");
const filtroLocalidad = document.getElementById("filtro-localidad");
const ordenSelect = document.getElementById("filtro-orden");
const contenedorPropiedades = document.getElementById("lista-propiedades");

let paginaActual = 1;
const propiedadesPorPagina = 9;
let propiedadesFiltradasGlobal = []; // Para infinite scroll

// --- Preprocesar propiedades ---
const propiedadesConDatos = propiedades.map((p) => ({
  ...p,
  zona: p.zona || "Zona Norte",
  partido: p.partido || "San Isidro",
  localidad: p.localidad || "San Isidro",
}));

// --- 0) Crear dinámicamente el contenedor de "no results" ---
let noResults = document.getElementById("no-results");
if (!noResults) {
  noResults = document.createElement("div");
  noResults.id = "no-results";
  noResults.textContent = "Lo siento, no encontramos propiedades disponibles.";
  Object.assign(noResults.style, {
    display: "none",
    textAlign: "center",
    padding: "2rem",
    fontSize: "1.25rem",
    color: "#666",
  });
  contenedorPropiedades.parentNode.insertBefore(
    noResults,
    contenedorPropiedades.nextSibling
  );
}

// --- 1) Función para leer URL y poblar selects ---
function poblarFiltrosDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("operacion")) filtroOperacion.value = params.get("operacion");
  if (params.get("tipologia")) filtroTipologia.value = params.get("tipologia");
  if (params.get("zona")) filtroZona.value = params.get("zona");
  if (params.get("partido")) filtroPartido.value = params.get("partido");
  if (params.get("localidad")) filtroLocalidad.value = params.get("localidad");
  if (params.get("orden")) ordenSelect.value = params.get("orden");
}

poblarFiltrosDesdeURL();

// --- Función: Crear HTML de cada card ---
function crearCardHTML(p, index) {
  const colorTag = p.tipoTransaccion === "Venta" ? "#38b6a3" : "#0099cc";

  const slidesHTML = (p.imagenes || [])
    .map(
      (img) => `
        <div class="swiper-slide">
          <img src="${img}" alt="${p.tipoPropiedad} en ${p.localidad}">
        </div>
      `
    )
    .join("");

  return `
      <div class="swiper-slide">
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
            <span><i class="fas fa-bath"></i> ${p.baños}</span>
             <span><i class="fas fa-toilet"></i> ${p.toilet}</span>
            <span><i class="fas fa-ruler-combined"></i> ${p.tamaño} m²</span>
          </div>
        </div>
      </div>
    `;
}
// --- Función: Cargar propiedades ---
function cargarPropiedades(lista) {
  const inicio = (paginaActual - 1) * propiedadesPorPagina;
  const fin = inicio + propiedadesPorPagina;
  const propsParaMostrar = lista.slice(inicio, fin);

  // const loader = document.getElementById("loader");
  // loader.style.display = "block";

  propsParaMostrar.forEach((propiedad, index) => {
    const cardHTML = crearCardHTML(propiedad, index);
    contenedorPropiedades.insertAdjacentHTML("beforeend", cardHTML);
  });

  inicializarSwipers();
  // loader.style.display = "none";
}

// --- Función: Inicializar todos los Swipers de las propiedades ---
function inicializarSwipers() {
  document.querySelectorAll(".mySwiper").forEach((swiper) => {
    if (!swiper.swiper) {
      // Evitar reinicializar
      new Swiper(swiper, {
        loop: true,
        pagination: {
          el: swiper.querySelector(".swiper-pagination"),
          clickable: true,
        },
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
      });
    }
  });
}

// --- Función: Aplicar filtros + ordenar ---
function aplicarFiltros() {
  let filtradas = [...propiedadesConDatos];

  // FILTRAR OPERACIÓN sólo si NO es la opción default
  if (filtroOperacion.value && filtroOperacion.value !== "default") {
    filtradas = filtradas.filter(
      (p) => p.tipoTransaccion === filtroOperacion.value
    );
  }

  // Obtener múltiples valores seleccionados en Tipología
  const tipologiasSeleccionadas = Array.from(
    document.querySelectorAll(
      '#dropdown-tipologia input[type="checkbox"]:checked'
    )
  ).map((el) => el.value);

  if (tipologiasSeleccionadas.length > 0) {
    filtradas = filtradas.filter((p) =>
      tipologiasSeleccionadas.includes(p.tipoPropiedad)
    );
  }

  // Obtener múltiples valores seleccionados en Zona
  const zonasSeleccionadas = Array.from(
    document.querySelectorAll('#dropdown-zona input[type="checkbox"]:checked')
  ).map((el) => el.value);

  if (zonasSeleccionadas.length > 0) {
    filtradas = filtradas.filter((p) => zonasSeleccionadas.includes(p.zona));
  }
  // FILTRAR PARTIDO
  // if (filtroPartido.value && filtroPartido.value !== 'default') {
  //   filtradas = filtradas.filter(
  //     p => p.partido === filtroPartido.value
  //   );
  // }

  // FILTRAR LOCALIDAD
  // if (filtroLocalidad.value && filtroLocalidad.value !== 'default') {
  //   filtradas = filtradas.filter(
  //     p => p.localidad === filtroLocalidad.value
  //   );
  // }

  // ORDENAR sólo si NO es default
  if (ordenSelect.value && ordenSelect.value !== "default") {
    filtradas = ordenarPropiedades(filtradas, ordenSelect.value);
  }

  propiedadesFiltradasGlobal = filtradas;
  paginaActual = 1;
  contenedorPropiedades.innerHTML = "";

  if (filtradas.length === 0) {
    // si no hay coincidencias, muestro mensaje y me voy
    noResults.style.display = "block";
    return;
  } else {
    // oculto el mensaje y cargo normalmente
    noResults.style.display = "none";
    cargarPropiedades(propiedadesFiltradasGlobal);
  }
}

// --- Función: Ordenar propiedades ---
function ordenarPropiedades(lista, criterio) {
  const extraccionNumero = (valor) =>
    Number(valor.replace(/[^0-9.-]+/g, "")) || 0;

  switch (criterio) {
    case "precio-desc":
      return lista.sort(
        (a, b) => extraccionNumero(b.valor) - extraccionNumero(a.valor)
      );
    case "precio-asc":
      return lista.sort(
        (a, b) => extraccionNumero(a.valor) - extraccionNumero(b.valor)
      );
    case "titulo-asc":
      return lista.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
    case "titulo-desc":
      return lista.sort((a, b) => b.descripcion.localeCompare(a.descripcion));
    case "fecha-desc":
      return lista.sort((a, b) => (b.id || 0) - (a.id || 0));
    case "fecha-asc":
      return lista.sort((a, b) => (a.id || 0) - (b.id || 0));
    default:
      return lista;
  }
}

// --- Función: Cargar más propiedades cuando scrolleás ---
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    paginaActual++;
    cargarPropiedades(propiedadesFiltradasGlobal);
  }
});

// --- Eventos de filtros ---
[
  filtroOperacion,
  filtroTipologia,
  filtroZona,
  filtroPartido,
  filtroLocalidad,
  ordenSelect,
].forEach((el) => {
  if (el) {
    el.addEventListener("change", aplicarFiltros);
  }
});

// --- Inicialización ---
aplicarFiltros();

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  // 1) Poblar cada select
  const campos = ["operacion", "tipologia", "zona"];
  campos.forEach((name) => {
    const val = params.get(name);
    if (val) {
      const sel = document.querySelector(`select[name="${name}"]`);
      if (sel) sel.value = val;
    }
  });

  // 2) Llamar al filtrado automático si hubo parámetros
  if (
    params.has("operacion") ||
    params.has("tipologia") ||
    params.has("zona")
  ) {
    // Asume que tu función de filtrado se llama filterProperties()
    if (typeof filterProperties === "function") {
      filterProperties();
    }
    // O dispara el click del botón buscar:
    // document.querySelector('.btn-buscar').click();
  }
});

document
  .querySelectorAll('.multiselect-options input[type="checkbox"]')
  .forEach((checkbox) => {
    checkbox.addEventListener("change", aplicarFiltros);
  });
