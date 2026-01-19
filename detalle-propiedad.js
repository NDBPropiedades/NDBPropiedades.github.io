const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173",
  galeriaEl = document.getElementById("galeria-propiedad"),
  infoEl = document.getElementById("info-propiedad"),
  descripcionEl = document.getElementById("descripcion"),
  mapaEl = document.getElementById("mapa-propiedad"),
  caracteristicasEl = document.getElementById("caracteristicas"),
  linkFormulario = document.getElementById("formulario-link"),
  urlParams = new URLSearchParams(window.location.search),
  propiedadId = urlParams.get("id");

if (!propiedadId) {
  infoEl.innerHTML = "<p>Error: ID de propiedad no especificado.</p>";
} else {
  fetch(`https://tokkobroker.com/api/v1/property/${propiedadId}/?key=${API_KEY}&format=json&lang=es_ar`)
    .then((res) => res.json())
    .then((e) => {
      const slides =
        e.photos?.map(
          (ph) =>
            `<div class="swiper-slide"><img src="${ph.image}" alt="Imagen propiedad" loading="lazy" /></div>`,
        ).join("") ||
        `<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" loading="lazy" /></div>`;

      const thumbs =
        e.photos?.map(
          (ph) =>
            `<div class="swiper-slide"><img src="${ph.thumb}" alt="Miniatura propiedad" loading="lazy" /></div>`,
        ).join("") || "";

      const r = e.publication_title || "Propiedad sin título";

      // ====== PRECIO CORREGIDO (toma currency real) ======
      const op = e.operations?.find((o) => o.operation_type === "Alquiler") || e.operations?.[0];
      const priceObj = op?.prices?.[0];
      const currency = (priceObj?.currency || "").toUpperCase();
      const price = priceObj?.price;

      const symbol =
        currency === "ARS" ? "$ " :
        currency === "USD" ? "USD " :
        (currency ? `${currency} ` : "");

      const s = price != null ? `${symbol}${Number(price).toLocaleString("es-AR")}` : "Consultar";
      // ====================================================

      const o = e.location?.name || "Zona no especificada";
      const t = e.description?.trim() || "Sin descripción.";
      const l = e.real_address || e.address || "Dirección no disponible";
      const p = e.reference_code || "-";
      const d = e.expenses != null ? `$${Number(e.expenses).toLocaleString("es-AR")}` : "No informadas";
      const n = e.legally_checked_text || "-";
      const c = e.public_url || null;

      galeriaEl.innerHTML = `
        <div class="galeria-propiedad swiper mySwiper2">
          <div class="swiper-wrapper">${slides}</div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>
        <div class="swiper mySwiperThumbs">
          <div class="swiper-wrapper">${thumbs}</div>
        </div>
      `;

      new Swiper(".mySwiperThumbs", {
        spaceBetween: 10,
        slidesPerView: 5,
        freeMode: true,
        watchSlidesProgress: true,
        breakpoints: { 0: { slidesPerView: 3 }, 576: { slidesPerView: 4 }, 992: { slidesPerView: 5 } },
      });

      new Swiper(".mySwiper2", {
        spaceBetween: 10,
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        thumbs: { swiper: document.querySelector(".mySwiperThumbs")?.swiper },
      });

      infoEl.innerHTML = `
        <h1>${r}</h1>
        <p><strong>${s}</strong></p>
        <p><i class="fas fa-map-marker-alt"></i> ${l}</p>
        <p>${o}</p>
        <p><strong>Código de referencia:</strong> ${p}</p>
      `;

      descripcionEl.innerHTML = `
        <h2>Descripción</h2>
        <p>${t}</p>
        <p><strong>Expensas:</strong> ${d}</p>
        <p><strong>Estado legal:</strong> ${n}</p>
        ${c ? `<p><a href="${c}" target="_blank" rel="noopener noreferrer">Ver ficha completa en Tokko</a></p>` : ""}
      `;

      caracteristicasEl.innerHTML = `
        <div><i class="fas fa-vector-square"></i> ${e.total_surface || "-"} m² tot.</div>
        <div><i class="fas fa-vector-square"></i> ${e.roofed_surface || "-"} m² cub.</div>
        <div><i class="fas fa-door-open"></i> ${e.room_amount || "-"} ambientes</div>
        <div><i class="fas fa-bath"></i> ${e.bathroom_amount || "-"} baños</div>
        <div><i class="fas fa-toilet"></i> ${e.toilet_amount || "-"} toilette</div>
        <div><i class="fas fa-car"></i> ${e.parking_lot_amount || "-"} cochera(s)</div>
        <div><i class="fas fa-bed"></i> ${e.suite_amount || "-"} dormitorio(s)</div>
        <div><i class="fas fa-calendar-alt"></i> ${e.age || "-"} años</div>
        <div><i class="fas fa-compass"></i> ${e.orientation || "-"}</div>
      `;

      if (e.geo_lat && e.geo_long) {
        mapaEl.innerHTML = `
          <iframe
            src="https://www.google.com/maps?q=${e.geo_lat},${e.geo_long}&output=embed"
            width="100%" height="400" style="border:0;" allowfullscreen loading="lazy"
          ></iframe>
        `;
      }

      const m = e.branch;
      if (m) {
        const f = `${m.phone_country_code || ""}${m.phone_area || ""}${m.phone || ""}`;
        descripcionEl.innerHTML += `
          <div class="contacto-inmobiliaria" style="margin-top: 20px">
            <h3>Contacto Inmobiliaria</h3>
            <p><strong>${m.display_name || ""}</strong></p>
            <p><i class="fas fa-map-marker-alt"></i> ${m.address || ""}</p>
            ${f ? `<p><i class="fas fa-phone"></i> <a href="tel:${f}">${f}</a></p>` : ""}
            ${m.email ? `<p><i class="fas fa-envelope"></i> <a href="mailto:${m.email}">${m.email}</a></p>` : ""}
          </div>
        `;
      }

      linkFormulario.href =
        "https://docs.google.com/forms/d/e/1FAIpQLScPwRC1SL82-IPmpWedPcxj-guvqRl-gJj7fK3Ryi6RsHVxnw/viewform?usp=pp_url";

      if (e.videos && e.videos.length > 0) {
        const g = e.videos[0];
        const v = document.getElementById("video-propiedad");
        if (v && g?.player_url) {
          v.innerHTML = `
            <h3 style="margin-bottom: 15px;">Video de la propiedad</h3>
            <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
              <iframe src="${g.player_url}" frameborder="0" allowfullscreen
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
