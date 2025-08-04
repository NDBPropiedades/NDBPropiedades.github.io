window.addEventListener("scroll", () => {
  const nearBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

  if (nearBottom) {
    paginaActual++;
    renderPagina();
  }
});
// tokko-listado.js

let todasLasPropiedades = [];
let paginaActual = 1;
const propiedadesPorPagina = 9;

const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
const API_URL = `https://tokkobroker.com/api/v1/property/?key=${API_KEY}&format=json&shared=true`;

const contenedor = document.getElementById("lista-propiedades");
const contenedorZonas = document.getElementById("dropdown-zona");
const contenedorTipologias = document.getElementById("dropdown-tipologia");

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

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(`${selector} input:checked`)).map(
    (e) => e.value
  );
}

function poblarTipologiasUnicas(propiedades) {
  const tipos = new Set();
  propiedades.forEach((p) => p.type?.name && tipos.add(p.type.name));

  contenedorTipologias.innerHTML = "";
  Array.from(tipos)
    .sort()
    .forEach((tipo) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${tipo}" /> ${
        propertyTypeTranslations[tipo] || tipo
      }`;
      contenedorTipologias.appendChild(label);
    });

  contenedorTipologias.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", reiniciarListado);
  });
}

function poblarZonasUnicas(propiedades) {
  const zonas = new Set();
  propiedades.forEach((p) => p.location?.name && zonas.add(p.location.name));

  contenedorZonas.innerHTML = "";
  Array.from(zonas)
    .sort()
    .forEach((zona) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${zona}" /> ${zona}`;
      contenedorZonas.appendChild(label);
    });

  contenedorZonas.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", reiniciarListado);
  });
}

function aplicarFiltros(propiedades) {
  let filtradas = [...propiedades];
  const operacion = document.getElementById("filtro-operacion").value;
  const tipologias = getCheckedValues("#dropdown-tipologia");
  const zonas = getCheckedValues("#dropdown-zona");
  const orden = document.getElementById("filtro-orden").value;

  if (operacion !== "default") {
    filtradas = filtradas.filter((p) =>
      p.operations?.some((op) => op.operation_type === operacion)
    );
  }

  if (tipologias.length > 0) {
    filtradas = filtradas.filter((p) => tipologias.includes(p.type?.name));
  }

  if (zonas.length > 0) {
    filtradas = filtradas.filter((p) => zonas.includes(p.location?.name));
  }

  if (orden !== "default") {
    filtradas.sort((a, b) => {
      const precioA = a.operations?.[0]?.prices?.[0]?.price || 0;
      const precioB = b.operations?.[0]?.prices?.[0]?.price || 0;
      const tituloA = a.publication_title || "";
      const tituloB = b.publication_title || "";
      const fechaA = new Date(a.created_on);
      const fechaB = new Date(b.created_on);

      switch (orden) {
        case "precio-asc":
          return precioA - precioB;
        case "precio-desc":
          return precioB - precioA;
        case "titulo-asc":
          return tituloA.localeCompare(tituloB);
        case "titulo-desc":
          return tituloB.localeCompare(tituloA);
        case "fecha-asc":
          return fechaA - fechaB;
        case "fecha-desc":
          return fechaB - fechaA;
        default:
          return 0;
      }
    });
  }

  return filtradas;
}

function renderPagina() {
  const propiedadesFiltradas = aplicarFiltros(todasLasPropiedades);
  const inicio = (paginaActual - 1) * propiedadesPorPagina;
  const fin = paginaActual * propiedadesPorPagina;
  const propiedades = propiedadesFiltradas.slice(inicio, fin);

  if (propiedades.length === 0) return;

  propiedades.forEach((p, index) => {
    const fotos = p.photos?.length
      ? p.photos
          .map(
            (foto) =>
              `<div class="swiper-slide"><img src="${foto.image}" loading="lazy" /></div>`
          )
          .join("")
      : '<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>';

    const tipo =
      propertyTypeTranslations[p.type?.name] || p.type?.name || "Propiedad";
    const zona = p.location?.name || "Zona no especificada";
    const operacionTipo = p.operations?.[0]?.operation_type || "sale";
    const operacion =
      operacionTipo.toLowerCase() === "sale" ? "Venta" : "Alquiler";
    const precio = p.operations?.[0]?.prices?.[0]?.price
      ? `USD ${p.operations[0].prices[0].price}`
      : "Consultar";
    const swiperId = `swiper-${
      (paginaActual - 1) * propiedadesPorPagina + index
    }`;

    // Iconos
    const ambientes = p.room_amount || 0;
    const banos = p.bathroom_amount || 0;
    const toiletes = p.toilet_amount || 0;
    const superficie = p.total_surface || 0;
    let iconos = "";
    if (ambientes > 0)
      iconos += `<span><i class="fas fa-bed"></i> ${ambientes}</span>`;
    if (banos > 0)
      iconos += `<span><i class="fas fa-bath"></i> ${banos}</span>`;
    if (toiletes > 0)
      iconos += `<span><i class="fas fa-toilet"></i> ${toiletes}</span>`;
    if (superficie > 0)
      iconos += `<span><i class="fas fa-ruler-combined"></i> ${superficie} m²</span>`;

    const html = `
      <div class="tokko-card">
        <div class="swiper mySwiper" id="${swiperId}">
          <div class="card-tag" style="background-color: ${
            operacion === "Venta" ? "#0e246a" : "#7eccff"
          };">${operacion}</div>
          <div class="swiper-wrapper">${fotos}</div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>
        <div class="info">
          <h3><a href="propiedad.html?id=${p.id}">${tipo} en ${zona}</a></h3>
          <p>${p.publication_title || ""}</p>
          <p><strong>Zona:</strong> ${zona}</p>
          <p><strong>Precio:</strong> ${precio}</p>
        </div>
        ${iconos ? `<div class="iconos-card">${iconos}</div>` : ""}
      </div>`;

    contenedor.insertAdjacentHTML("beforeend", html);

    setTimeout(() => {
      new Swiper(`#${swiperId}`, {
        loop: true,
        navigation: {
          nextEl: `#${swiperId} .swiper-button-next`,
          prevEl: `#${swiperId} .swiper-button-prev`,
        },
        autoplay: { delay: 5000, disableOnInteraction: false },
      });
    }, 100);
  });
  paginaActual++; 
}

function reiniciarListado() {
  contenedor.innerHTML = "";
  paginaActual = 1;
  renderPagina();
}

async function fetchTodasLasPropiedades() {
  let todas = [];
  let next = API_URL;

  while (next) {
    const res = await fetch(
      next.startsWith("http") ? next : `https://tokkobroker.com${next}`
    );
    const data = await res.json();
    todas = todas.concat(data.objects);
    next = data.meta?.next;
  }

  return todas;
}

async function cargarPropiedades() {
  contenedor.innerHTML = "<p>Cargando propiedades...</p>";
  todasLasPropiedades = await fetchTodasLasPropiedades();
  contenedor.innerHTML = "";
  poblarTipologiasUnicas(todasLasPropiedades);
  poblarZonasUnicas(todasLasPropiedades);
  renderPagina();
}

document
  .getElementById("filtro-operacion")
  .addEventListener("change", reiniciarListado);
document
  .getElementById("filtro-orden")
  .addEventListener("change", reiniciarListado);

document
  .querySelector('.multiselect-title[data-target="tipologia"]')
  .addEventListener("click", () => toggleDropdown("tipologia"));
document
  .querySelector('.multiselect-title[data-target="zona"]')
  .addEventListener("click", () => toggleDropdown("zona"));
document.addEventListener("click", (e) => {
  document.querySelectorAll(".multiselect-wrapper").forEach((wrapper) => {
    if (!wrapper.contains(e.target)) {
      const options = wrapper.querySelector(".multiselect-options");
      if (options) options.style.display = "none";
    }
  });
});

function toggleDropdown(target) {
  const dropdown = document.getElementById("dropdown-" + target);
  if (dropdown)
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
}

cargarPropiedades();

