const API_URL = "https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true";
const contenedor = document.getElementById("lista-propiedades");

fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    const propiedades = data.objects;

    propiedades.forEach((prop, index) => {
      const imagenes = prop.photos?.length
        ? prop.photos.map(photo => `
            <div class="swiper-slide">
              <img src="${photo.image}" alt="Imagen propiedad" loading="lazy" />
            </div>
          `).join("")
        : `
          <div class="swiper-slide">
            <img src="assets/img/no-image.jpg" alt="Sin imagen" />
          </div>
        `;

      const titulo = prop.publication_title || "Sin título";
      const precio = prop.operations?.[0]?.prices?.[0]?.price
        ? `USD ${prop.operations[0].prices[0].price}`
        : "Consultar";
      const zona = prop.location?.name || "Zona no especificada";

      const html = `
        <div class="tokko-card">
          <div class="swiper mySwiper" id="swiper-${index}">
            <div class="swiper-wrapper">
              ${imagenes}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
          </div>
          <div class="info">
            <h3><a href="propiedad.html?id=${prop.id}">${titulo}</a></h3>
            <p><strong>Zona:</strong> ${zona}</p>
            <p><strong>Precio:</strong> ${precio}</p>
          </div>
        </div>
      `;

      contenedor.innerHTML += html;
    });

    // Inicializar todos los sliders
    propiedades.forEach((_, index) => {
      new Swiper(`#swiper-${index}`, {
        loop: true,
        navigation: {
          nextEl: `#swiper-${index} .swiper-button-next`,
          prevEl: `#swiper-${index} .swiper-button-prev`,
        },
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
      });
    });
  })
  .catch(err => {
    contenedor.innerHTML = "<p>Error al cargar propiedades.</p>";
    console.error(err);
  });