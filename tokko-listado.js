const API_BASE = "https://tokkobroker.com/api/v1/property/";
const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
const contenedor = document.getElementById("lista-propiedades");
const contenedorZonas = document.getElementById("dropdown-zona");
const contenedorTipologias = document.getElementById("dropdown-tipologia");

const propertyTypeTranslations = {
  "Land": "Terreno",
  "Apartment": "Departamento",
  "House": "Casa",
  "Weekend House": "Casa de fin de semana",
  "Office": "Oficina",
  "Mooring": "Amarra",
  "Bussiness Premises": "Local comercial",
  "Commercial Building": "Edificio comercial",
  "Countryside": "Campo",
  "Garage": "Cochera",
  "Hotel": "Hotel",
  "Industrial Ship": "Nave industrial",
  "Condo": "PH",
  "Storage": "Depósito",
  "Bussiness Permit": "Fondo de comercio",
  "Storage room": "Baulera",
  "Wine Cellar": "Bodega",
  "Farm": "Granja",
  "Ranch": "Estancia",
  "Nautical Bed": "Cama náutica"
};

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(`${selector} input:checked`)).map(el => el.value);
}

function poblarTipologiasUnicas(propiedades) {
  const tiposSet = new Set();
  propiedades.forEach(p => { if (p.type?.name) tiposSet.add(p.type.name); });
  contenedorTipologias.innerHTML = "";
  Array.from(tiposSet).sort().forEach(tipo => {
    const nombreES = propertyTypeTranslations[tipo] || tipo;
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${tipo}" /> ${nombreES}`;
    contenedorTipologias.appendChild(label);
  });
  contenedorTipologias.querySelectorAll("input").forEach(cb => {
    cb.addEventListener("change", cargarPropiedades);
  });
}

function poblarZonasUnicas(propiedades) {
  const zonasSet = new Set();
  propiedades.forEach(p => { if (p.location?.name) zonasSet.add(p.location.name); });
  contenedorZonas.innerHTML = "";
  Array.from(zonasSet).sort().forEach(zona => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${zona}" /> ${zona}`;
    contenedorZonas.appendChild(label);
  });
  contenedorZonas.querySelectorAll("input").forEach(cb => {
    cb.addEventListener("change", cargarPropiedades);
  });
}

function cargarPropiedades() {
  const url = `${API_BASE}?key=${API_KEY}&format=json&shared=true`;
  contenedor.innerHTML = "";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      let propiedades = data.objects;

      if (contenedorTipologias.innerHTML.trim() === "") {
        poblarTipologiasUnicas(propiedades);
      }

      poblarZonasUnicas(propiedades);

      const operacion = document.getElementById("filtro-operacion").value;
      if (operacion && operacion !== "default") {
        propiedades = propiedades.filter(prop =>
          prop.operations?.some(op => op.operation_type === operacion)
        );
      }

      const tipologias = getCheckedValues("#dropdown-tipologia");
      if (tipologias.length > 0) {
        propiedades = propiedades.filter(prop =>
          tipologias.includes(prop.type?.name)
        );
      }

      const zonas = getCheckedValues("#dropdown-zona");
      if (zonas.length > 0) {
        propiedades = propiedades.filter(prop =>
          zonas.includes(prop.location?.name)
        );
      }

      const orden = document.getElementById("filtro-orden").value;
      if (orden && orden !== "default") {
        propiedades.sort((a, b) => {
          const precioA = a.operations?.[0]?.prices?.[0]?.price || 0;
          const precioB = b.operations?.[0]?.prices?.[0]?.price || 0;
          if (orden === "precio-asc") return precioA - precioB;
          if (orden === "precio-desc") return precioB - precioA;
          if (orden === "titulo-asc") return (a.publication_title || "").localeCompare(b.publication_title || "");
          if (orden === "titulo-desc") return (b.publication_title || "").localeCompare(a.publication_title || "");
          if (orden === "fecha-asc") return new Date(a.created_on) - new Date(b.created_on);
          if (orden === "fecha-desc") return new Date(b.created_on) - new Date(a.created_on);
        });
      }

      contenedor.innerHTML = "";
      propiedades.forEach((prop, index) => {
        const imagenes = prop.photos?.length
          ? prop.photos.map(photo => `
              <div class="swiper-slide">
                <img src="${photo.image}" alt="Imagen propiedad" loading="lazy" />
              </div>
            `).join("")
          : `<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>`;

        const titulo = prop.publication_title || "Sin título";
        const precio = prop.operations?.[0]?.prices?.[0]?.price ? `USD ${prop.operations[0].prices[0].price}` : "Consultar";
        const zona = prop.location?.name || "Zona no especificada";

        const tipoPropiedadEN = prop.type?.name || "Propiedad";
        const tipoPropiedadES = propertyTypeTranslations[tipoPropiedadEN] || tipoPropiedadEN;

        const dormitorios = prop.room_amount || 0;
        const baños = prop.bathroom_amount || 0;
        const toiletes = prop.toilet_amount || 0;
        const tamaño = prop.total_surface || 0;

        let iconosHTML = "";
        if (dormitorios > 0) iconosHTML += `<span><i class="fas fa-bed"></i> ${dormitorios}</span>`;
        if (baños > 0) iconosHTML += `<span><i class="fas fa-bath"></i> ${baños}</span>`;
        if (toiletes > 0) iconosHTML += `<span><i class="fas fa-toilet"></i> ${toiletes}</span>`;
        if (tamaño > 0) iconosHTML += `<span><i class="fas fa-ruler-combined"></i> ${tamaño} m²</span>`;

        const html = `
          <div class="tokko-card">
            <div class="swiper mySwiper" id="swiper-${index}">
              <div class="swiper-wrapper">${imagenes}</div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            </div>
            <div class="info">
              <h3><a href="propiedad.html?id=${prop.id}">${tipoPropiedadES} en ${zona}</a></h3>
                 <p>${prop.publication_title || ""}</p>
                 <p><strong>Zona:</strong> ${zona}</p>
              <p><strong>Precio:</strong> ${precio}</p>
            </div>
            ${iconosHTML ? `<div class="iconos-card">${iconosHTML}</div>` : ""}
          </div>`;

        contenedor.innerHTML += html;
      });

      propiedades.forEach((_, index) => {
        new Swiper(`#swiper-${index}`, {
          loop: true,
          navigation: {
            nextEl: `#swiper-${index} .swiper-button-next`,
            prevEl: `#swiper-${index} .swiper-button-prev`
          },
          autoplay: { delay: 5000, disableOnInteraction: false }
        });
      });
    })
    .catch(err => {
      contenedor.innerHTML = "<p>Error al cargar propiedades.</p>";
      console.error(err);
    });
}

document.getElementById("filtro-operacion").addEventListener("change", cargarPropiedades);
document.getElementById("filtro-orden").addEventListener("change", cargarPropiedades);

document.querySelector('.multiselect-title[data-target="tipologia"]').addEventListener('click', () => toggleDropdown('tipologia'));
document.querySelector('.multiselect-title[data-target="zona"]').addEventListener('click', () => toggleDropdown('zona'));

document.addEventListener("click", (event) => {
  document.querySelectorAll(".multiselect-wrapper").forEach(wrapper => {
    if (!wrapper.contains(event.target)) {
      const options = wrapper.querySelector(".multiselect-options");
      if (options) options.style.display = "none";
    }
  });
});

cargarPropiedades();
