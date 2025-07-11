const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";

// Obtener contenedores del DOM
const galeriaEl = document.getElementById("galeria-propiedad");
const infoEl = document.getElementById("info-propiedad");
const descripcionEl = document.getElementById("descripcion");
const mapaEl = document.getElementById("mapa-propiedad");
const caracteristicasEl = document.getElementById("caracteristicas");
const linkFormulario = document.getElementById("formulario-link");

// Obtener el ID desde la URL
const urlParams = new URLSearchParams(window.location.search);
const propiedadId = urlParams.get("id");

if (!propiedadId) {
  infoEl.innerHTML = "<p>Error: ID de propiedad no especificado.</p>";
} else {
  const API_URL = `https://tokkobroker.com/api/v1/property/${propiedadId}/?key=${API_KEY}&format=json`;

  fetch(API_URL)
    .then((res) => res.json())
    .then((prop) => {
      const imagenes =
        prop.photos
          ?.map(
            (f) =>
              `<div class="swiper-slide"><img src="${f.image}" alt="Imagen propiedad" loading="lazy" /></div>`
          )
          .join("") ||
        `<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>`;

      const miniaturas =
        prop.photos
          ?.map(
            (f) =>
              `<div class="swiper-slide"><img src="${f.thumb}" alt="Miniatura propiedad" loading="lazy" /></div>`
          )
          .join("") || "";

      const titulo = prop.publication_title || "Propiedad sin título";
      const precio = prop.operations?.[0]?.prices?.[0]?.price
        ? `USD ${prop.operations[0].prices[0].price}`
        : "Consultar";
      const zona = prop.location?.name || "Zona no especificada";
      const descripcion = prop.description?.trim() || "Sin descripción.";
      const direccion =
        prop.real_address || prop.address || "Dirección no disponible";
      const referencia = prop.reference_code || "-";
      const expensas = prop.expenses ? `$${prop.expenses}` : "No informadas";
      const estadoLegal = prop.legally_checked_text || "-";
      const fichaTokko = prop.public_url || null;

      // Galería principal
      galeriaEl.innerHTML = `
    <div class="galeria-propiedad swiper mySwiper2">
      <div class="swiper-wrapper">${imagenes}</div>
      <div class="swiper-button-next"></div>
      <div class="swiper-button-prev"></div>
    </div>
    <div class="swiper mySwiperThumbs">
      <div class="swiper-wrapper">${miniaturas}</div>
    </div>
  `;

      new Swiper(".mySwiperThumbs", {
        spaceBetween: 10,
        slidesPerView: 5,
        freeMode: true,
        watchSlidesProgress: true,
        breakpoints: {
          0: { slidesPerView: 3 },
          576: { slidesPerView: 4 },
          992: { slidesPerView: 5 },
        },
      });

      new Swiper(".mySwiper2", {
        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        thumbs: {
          swiper: document.querySelector(".mySwiperThumbs").swiper,
        },
      });

      // Info principal
      infoEl.innerHTML = `
    <h1>${titulo}</h1>
    <p><strong>${precio}</strong></p>
    <p><i class="fas fa-map-marker-alt"></i> ${direccion}</p>
    <p>${zona}</p>
    <p><strong>Código de referencia:</strong> ${referencia}</p>
  `;

      // Descripción y extras
      descripcionEl.innerHTML = `
    <h2>Descripción</h2>
    <p>${descripcion}</p>
    <p><strong>Expensas:</strong> ${expensas}</p>
    <p><strong>Estado legal:</strong> ${estadoLegal}</p>
    ${
      fichaTokko
        ? `<p><a href="${fichaTokko}" target="_blank" rel="noopener noreferrer">Ver ficha completa en Tokko</a></p>`
        : ""
    }
  `;

      // Características rápidas
      caracteristicasEl.innerHTML = `
    <div><i class="fas fa-vector-square"></i> ${
      prop.total_surface || "-"
    } m² tot.</div>
    <div><i class="fas fa-vector-square"></i> ${
      prop.roofed_surface || "-"
    } m² cub.</div>
    <div><i class="fas fa-door-open"></i> ${
      prop.room_amount || "-"
    } ambientes</div>
    <div><i class="fas fa-bath"></i> ${prop.bathroom_amount || "-"} baños</div>
    <div><i class="fas fa-toilet"></i> ${
      prop.toilet_amount || "-"
    } toilette</div>
    <div><i class="fas fa-car"></i> ${
      prop.parking_lot_amount || "-"
    } cochera(s)</div>
    <div><i class="fas fa-bed"></i> ${
      prop.suite_amount || "-"
    } dormitorio(s)</div>
    <div><i class="fas fa-calendar-alt"></i> ${prop.age || "-"} años</div>
    <div><i class="fas fa-compass"></i> ${prop.orientation || "-"}</div>
  `;

      // Mapa con dirección
      if (prop.geo_lat && prop.geo_long) {
        mapaEl.innerHTML = `
      <iframe
        src="https://www.google.com/maps?q=${prop.geo_lat},${prop.geo_long}&output=embed"
        width="100%" height="400" style="border:0;" allowfullscreen loading="lazy"
      ></iframe>
    `;
      }

      // Contacto inmobiliaria (opcional)
      const contacto = prop.branch;
      if (contacto) {
        const tel = `${contacto.phone_country_code}${contacto.phone_area}${contacto.phone}`;
        descripcionEl.innerHTML += `
      <div class="contacto-inmobiliaria" style="margin-top: 20px">
        <h3>Contacto Inmobiliaria</h3>
        <p><strong>${contacto.display_name}</strong></p>
        <p><i class="fas fa-map-marker-alt"></i> ${contacto.address}</p>
        <p><i class="fas fa-phone"></i> <a href="tel:${tel}">${tel}</a></p>
        <p><i class="fas fa-envelope"></i> <a href="mailto:${contacto.email}">${contacto.email}</a></p>
      </div>
    `;
      }

      // Link al formulario
      linkFormulario.href =
        "https://docs.google.com/forms/d/e/1FAIpQLScPwRC1SL82-IPmpWedPcxj-guvqRl-gJj7fK3Ryi6RsHVxnw/viewform?usp=pp_url";

      if (prop.videos && prop.videos.length > 0) {
        const video = prop.videos[0]; 
        const videoContainer = document.getElementById("video-propiedad");

        if (videoContainer) {
          videoContainer.innerHTML = `
      <h3 style="margin-bottom: 15px;">Video de la propiedad</h3>
      <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
        <iframe src="${video.player_url}" frameborder="0" allowfullscreen
          style="position:absolute; top:0; left:0; width:100%; height:100%;">
        </iframe>
      </div>
    `;
        }
      }
    })
    .catch((err) => {
      infoEl.innerHTML = "<p>Error al cargar la propiedad.</p>";
      console.error(err);
    });
}
