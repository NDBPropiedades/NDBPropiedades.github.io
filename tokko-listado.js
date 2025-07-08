const API_URL = "https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true";
const contenedor = document.getElementById("lista-propiedades");

fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    const propiedades = data.objects;

    propiedades.forEach(prop => {
      const imagen = prop.photos?.[0]?.image || "assets/img/no-image.jpg";
      const titulo = prop.publication_title || "Sin título";
      const precio = prop.operations?.[0]?.prices?.[0]?.price
        ? `USD ${prop.operations[0].prices[0].price}`
        : "Consultar";
      const zona = prop.location?.name || "Zona no especificada";

      const html = `
        <div class="tokko-card">
          <img src="${imagen}" alt="${titulo}" />
          <div class="info">
            <h3><a href="propiedad.html?id=${prop.id}">${titulo}</a></h3>
            <p><strong>Zona:</strong> ${zona}</p>
            <p><strong>Precio:</strong> ${precio}</p>
          </div>
        </div>
      `;

      contenedor.innerHTML += html;
    });
  })
  .catch(err => {
    contenedor.innerHTML = "<p>Error al cargar propiedades.</p>";
    console.error(err);
  });