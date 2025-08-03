const API_BASE = "https://tokkobroker.com/api/v1/property/",
  API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173",
  contenedor = document.getElementById("lista-propiedades"),
  contenedorZonas = document.getElementById("dropdown-zona"),
  contenedorTipologias = document.getElementById("dropdown-tipologia"),
  propertyTypeTranslations = {
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
    Storage: "Dep\xf3sito",
    "Bussiness Permit": "Fondo de comercio",
    "Storage room": "Baulera",
    "Wine Cellar": "Bodega",
    Farm: "Granja",
    Ranch: "Estancia",
    "Nautical Bed": "Cama n\xe1utica",
  };
function getCheckedValues(e) {
  return Array.from(document.querySelectorAll(`${e} input:checked`)).map(
    (e) => e.value
  );
}
function poblarTipologiasUnicas(e) {
  let o = new Set();
  e.forEach((e) => {
    e.type?.name && o.add(e.type.name);
  }),
    (contenedorTipologias.innerHTML = ""),
    Array.from(o)
      .sort()
      .forEach((e) => {
        let o = propertyTypeTranslations[e] || e,
          a = document.createElement("label");
        (a.innerHTML = `<input type="checkbox" value="${e}" /> ${o}`),
          contenedorTipologias.appendChild(a);
      }),
    contenedorTipologias.querySelectorAll("input").forEach((e) => {
      e.addEventListener("change", cargarPropiedades);
    });
}
function poblarZonasUnicas(e) {
  let o = new Set();
  e.forEach((e) => {
    e.location?.name && o.add(e.location.name);
  }),
    (contenedorZonas.innerHTML = ""),
    Array.from(o)
      .sort()
      .forEach((e) => {
        let o = document.createElement("label");
        (o.innerHTML = `<input type="checkbox" value="${e}" /> ${e}`),
          contenedorZonas.appendChild(o);
      }),
    contenedorZonas.querySelectorAll("input").forEach((e) => {
      e.addEventListener("change", cargarPropiedades);
    });
}
function cargarPropiedades() {
  (contenedor.innerHTML = ""),
    fetch(
      "https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true"
    )
      .then((e) => e.json())
      .then((e) => {
        let o = e.objects;
        "" === contenedorTipologias.innerHTML.trim() &&
          poblarTipologiasUnicas(o),
          poblarZonasUnicas(o);
        let a = document.getElementById("filtro-operacion").value;
        a &&
          "default" !== a &&
          (o = o.filter((e) =>
            e.operations?.some((e) => e.operation_type === a)
          ));
        let t = getCheckedValues("#dropdown-tipologia");
        t.length > 0 && (o = o.filter((e) => t.includes(e.type?.name)));
        let n = getCheckedValues("#dropdown-zona");
        n.length > 0 && (o = o.filter((e) => n.includes(e.location?.name)));
        let i = document.getElementById("filtro-orden").value;
        i &&
          "default" !== i &&
          o.sort((e, o) => {
            let a = e.operations?.[0]?.prices?.[0]?.price || 0,
              t = o.operations?.[0]?.prices?.[0]?.price || 0;
            return "precio-asc" === i
              ? a - t
              : "precio-desc" === i
              ? t - a
              : "titulo-asc" === i
              ? (e.publication_title || "").localeCompare(
                  o.publication_title || ""
                )
              : "titulo-desc" === i
              ? (o.publication_title || "").localeCompare(
                  e.publication_title || ""
                )
              : "fecha-asc" === i
              ? new Date(e.created_on) - new Date(o.created_on)
              : "fecha-desc" === i
              ? new Date(o.created_on) - new Date(e.created_on)
              : void 0;
          }),
          (contenedor.innerHTML = ""),
          o.forEach((e, o) => {
            let a = e.photos?.length
              ? e.photos
                  .map(
                    (e) => `
              <div class="swiper-slide">
                <img src="${e.image}" alt="Imagen propiedad" loading="lazy" />
              </div>
            `
                  )
                  .join("")
              : '<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>';
            e.publication_title;
            let t =
                e.operations?.[0]?.operation_type === "Sale"
                  ? "Venta"
                  : "Alquiler",
              n = e.operations?.[0]?.prices?.[0]?.price
                ? `USD ${e.operations[0].prices[0].price}`
                : "Consultar",
              i = e.location?.name || "Zona no especificada",
              r = e.type?.name || "Propiedad",
              l = propertyTypeTranslations[r] || r,
              s = e.room_amount || 0,
              c = e.bathroom_amount || 0,
              d = e.toilet_amount || 0,
              p = e.total_surface || 0,
              u = "";
            s > 0 && (u += `<span><i class="fas fa-bed"></i> ${s}</span>`),
              c > 0 && (u += `<span><i class="fas fa-bath"></i> ${c}</span>`),
              d > 0 && (u += `<span><i class="fas fa-toilet"></i> ${d}</span>`),
              p > 0 &&
                (u += `<span><i class="fas fa-ruler-combined"></i> ${p} m\xb2</span>`);
            let g = `
          <div class="tokko-card">
            <div class="swiper mySwiper" id="swiper-${o}">
               <div class="card-tag" style="background-color: ${
                 "Venta" === t ? "#0e246a" : "#7eccff"
               };">${t}</div>
              <div class="swiper-wrapper">${a}</div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            </div>
            <div class="info">
              <h3><a href="propiedad.html?id=${e.id}">${l} en ${i}</a></h3>
                 <p>${e.publication_title || ""}</p>
                 <p><strong>Zona:</strong> ${i}</p>
              <p><strong>Precio:</strong> ${n}</p>
            </div>
            ${u ? `<div class="iconos-card">${u}</div>` : ""}
          </div>`;
            contenedor.innerHTML += g;
          }),
          o.forEach((e, o) => {
            new Swiper(`#swiper-${o}`, {
              loop: !0,
              navigation: {
                nextEl: `#swiper-${o} .swiper-button-next`,
                prevEl: `#swiper-${o} .swiper-button-prev`,
              },
              autoplay: { delay: 5e3, disableOnInteraction: !1 },
            });
          });
      })
      .catch((e) => {
        (contenedor.innerHTML = "<p>Error al cargar propiedades.</p>"),
          console.error(e);
      });
}
function toggleDropdown(e) {
  let o = document.getElementById("dropdown-" + e);
  o && (o.style.display = "block" === o.style.display ? "none" : "block");
}
document
  .getElementById("filtro-operacion")
  .addEventListener("change", cargarPropiedades),
  document
    .getElementById("filtro-orden")
    .addEventListener("change", cargarPropiedades),
  document
    .querySelector('.multiselect-title[data-target="tipologia"]')
    .addEventListener("click", () => toggleDropdown("tipologia")),
  document
    .querySelector('.multiselect-title[data-target="zona"]')
    .addEventListener("click", () => toggleDropdown("zona")),
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".multiselect-wrapper").forEach((o) => {
      if (!o.contains(e.target)) {
        let a = o.querySelector(".multiselect-options");
        a && (a.style.display = "none");
      }
    });
  }),
  cargarPropiedades();
