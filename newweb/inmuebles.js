// --- Variables globales ---
const inmueblesContainer = document.getElementById("inmuebles-list");
const filtroOperacion = document.getElementById("filtro-operacion");
const filtroTipologia = document.getElementById("filtro-tipologia");
const filtroZona = document.getElementById("filtro-zona");
const filtroPartido = document.getElementById("filtro-partido");
const filtroLocalidad = document.getElementById("filtro-localidad");
const ordenSelect = document.getElementById("filtro-orden");
const contenedorPropiedades = document.getElementById('lista-propiedades');

let paginaActual = 1;
const propiedadesPorPagina = 9;
let propiedadesFiltradasGlobal = []; // Para infinite scroll

// --- Preprocesar propiedades ---
const propiedadesConDatos = propiedades.map(p => ({
  ...p,
  zona: p.zona || "Zona Norte",
  partido: p.partido || "San Isidro",
  localidad: p.localidad || "San Isidro"
}));

    
// --- Función: Crear HTML de cada card ---
function crearCardHTML(p, index) {
    const colorTag = p.tipoTransaccion === "Venta" ? "#38b6a3" : "#0099cc";
  
    const slidesHTML = (p.imagenes || []).map(
      (img) => `
        <div class="swiper-slide">
          <img src="${img}" alt="${p.tipoPropiedad} en ${p.localidad}">
        </div>
      `
    ).join("");
  
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
            <span><i class="fas fa-shower"></i> ${p.baños}</span>
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
  
    const loader = document.getElementById("loader");
    loader.style.display = "block";
  
    propsParaMostrar.forEach((propiedad, index) => {
      const cardHTML = crearCardHTML(propiedad, index);
      contenedorPropiedades.insertAdjacentHTML('beforeend', cardHTML);
    });
  
    inicializarSwipers();
    loader.style.display = "none";
  }

// --- Función: Inicializar todos los Swipers de las propiedades ---
function inicializarSwipers() {
  document.querySelectorAll(".mySwiper").forEach(swiper => {
    if (!swiper.swiper) { // Evitar reinicializar
      new Swiper(swiper, {
        loop: true,
        pagination: {
          el: swiper.querySelector(".swiper-pagination"),
          clickable: true,
        },
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        }
      });
    }
  });
}

// --- Función: Aplicar filtros + ordenar ---
function aplicarFiltros() {
  let filtradas = [...propiedadesConDatos];

  if (filtroOperacion && filtroOperacion.value) {
    filtradas = filtradas.filter(p => p.tipoTransaccion === filtroOperacion.value);
  }
  if (filtroTipologia && filtroTipologia.value) {
    filtradas = filtradas.filter(p => p.tipoPropiedad === filtroTipologia.value);
  }
  if (filtroZona && filtroZona.value) {
    filtradas = filtradas.filter(p => p.zona === filtroZona.value);
  }
  if (filtroPartido && filtroPartido.value) {
    filtradas = filtradas.filter(p => p.partido === filtroPartido.value);
  }
  if (filtroLocalidad && filtroLocalidad.value) {
    filtradas = filtradas.filter(p => p.localidad === filtroLocalidad.value);
  }

  // Ordenar
  if (ordenSelect && ordenSelect.value) {
    filtradas = ordenarPropiedades(filtradas, ordenSelect.value);
  }

  propiedadesFiltradasGlobal = filtradas;
  paginaActual = 1;
  contenedorPropiedades.innerHTML = "";
  cargarPropiedades(propiedadesFiltradasGlobal);
}

// --- Función: Ordenar propiedades ---
function ordenarPropiedades(lista, criterio) {
  const extraccionNumero = (valor) => Number(valor.replace(/[^0-9.-]+/g, "")) || 0;

  switch (criterio) {
    case "precio-desc":
      return lista.sort((a, b) => extraccionNumero(b.valor) - extraccionNumero(a.valor));
    case "precio-asc":
      return lista.sort((a, b) => extraccionNumero(a.valor) - extraccionNumero(b.valor));
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
[filtroOperacion, filtroTipologia, filtroZona, filtroPartido, filtroLocalidad, ordenSelect].forEach(el => {
  if (el) {
    el.addEventListener("change", aplicarFiltros);
  }
});

// --- Inicialización ---
aplicarFiltros();
