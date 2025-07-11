const API_URL = `https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true`;
const contenedorCards = document.getElementById("propiedades-list");

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

var currentYear = new Date().getFullYear();
document.getElementById("copyright").innerHTML =
  currentYear +
  " © Copyright NDB Propiedades. Todos los derechos reservados. Argentina, Buenos Aires.";

function cargarPropiedades() {
  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      contenedorCards.innerHTML = "";

      data.objects.forEach((p, index) => {
        const card = document.createElement("div");
        card.className = "swiper-slide";

        const slidesHTML = (p.photos || [])
          .map(
            (img) => `
          <div class="swiper-slide">
            <img src="${img.image}" alt="${p.publication_title}" loading="lazy">
          </div>
        `
          )
          .join("");

        const tipoTransaccion =
          p.operations?.[0]?.operation_type === "Sale" ? "Venta" : "Alquiler";
        const colorTag = tipoTransaccion === "Venta" ? "#0e246a" : "#7eccff";

        const tipoPropiedad =
          propertyTypeTranslations[p.type?.name] || p.type?.name || "Propiedad";
        const localidad = p.location?.name || "Ubicación no especificada";
        // const zona = p.location?.name || "Zona no especificada";
        const valor = p.operations?.[0]?.prices?.[0]?.price
          ? `USD ${p.operations[0].prices[0].price}`
          : "Consultar";

        const dormitorios = p.room_amount || 0;
        const baños = p.bathroom_amount || 0;
        const toiletes = p.toilet_amount || 0;
        const tamaño = p.total_surface || 0;

        const iconos = `
        ${
          dormitorios > 0
            ? `<span><i class="fas fa-bed"></i> ${dormitorios}</span>`
            : ""
        }
        ${baños > 0 ? `<span><i class="fas fa-bath"></i> ${baños}</span>` : ""}
        ${
          toiletes > 0
            ? `<span><i class="fas fa-toilet"></i> ${toiletes}</span>`
            : ""
        }
        ${
          tamaño > 0
            ? `<span><i class="fas fa-ruler-combined"></i> ${tamaño} m²</span>`
            : ""
        }
      `;

        card.innerHTML = `
        <div class="card">
          <div class="swiper mySwiper" id="swiper-${index}" style="position: relative;">
           <div class="card-tag" style="background-color: ${colorTag};">${tipoTransaccion}</div>
            <div class="swiper-wrapper">
              ${
                slidesHTML ||
                `<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen"></div>`
              }
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
          </div>

          <h3>
            <a href="propiedad.html?id=${
              p.id
            }" style="text-decoration: none; color: inherit;">
              ${tipoPropiedad} en ${localidad}
            </a>
          </h3>
          <p>${p.publication_title || ""}</p>
         
          <p><strong>Precio:</strong> ${valor}</p>

           <div class="iconos-card">
            ${iconos}
          </div>
        </div>
      `;

        contenedorCards.appendChild(card);
      });

      inicializarSwipers();
      inicializarSwiperGeneral();
    })
    .catch((err) => {
      console.error("Error al cargar propiedades destacadas:", err);
      contenedorCards.innerHTML = "<p>Error al cargar propiedades.</p>";
    });
}

function inicializarSwipers() {
  const swipers = document.querySelectorAll(".mySwiper");

  swipers.forEach((swiperElement) => {
    new Swiper(swiperElement, {
      loop: true,
      autoplay: false,
      navigation: {
        nextEl: swiperElement.querySelector(".swiper-button-next"),
        prevEl: swiperElement.querySelector(".swiper-button-prev"),
      },
    });
  });
}

function inicializarSwiperGeneral() {
  new Swiper(".myMainSwiper", {
    loop: true,
    grabCursor: true,
    slidesPerView: 3,
    slidesPerGroup: 3,
    spaceBetween: 30,
    breakpoints: {
      0: { slidesPerView: 1, slidesPerGroup: 1 },
      768: { slidesPerView: 2, slidesPerGroup: 2 },
      1024: { slidesPerView: 3, slidesPerGroup: 3 },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cargarPropiedades();
});


const animables = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // solo una vez
      }
    });
  },
  {
    threshold: 0.2,
  }
);

animables.forEach((el) => observer.observe(el));

document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = this.name.value.trim();
  const cellphone = this.telefono.value.trim();
  const email = this.email.value.trim();
  const localidad = this.localidad.value.trim();
  const operacion = this.tipo_operacion.value.trim();
  const tipoInmueble = this.tipo_inmueble.value.trim();
  const mensaje = this.mensaje.value.trim();

  // 🔧 Concatenamos info adicional en `text`
  const text = `
    Localidad: ${localidad}
    Operación: ${operacion}
    Tipo de Inmueble: ${tipoInmueble}
    Mensaje: ${mensaje}
  `.trim();

  const payload = {
    name: name,
    cellphone: cellphone,
    phone: cellphone, // opcional, usamos mismo input
    email: email,
    text: text,
    agent_mail: "info@ndbpropiedades.com.ar"
    // properties: "[1234]",  // opcional, agregar si querés asociar propiedades
    // tags: "['Tasacion', 'Web']",  // opcional, agregar etiquetas
  };

  fetch('https://tokkobroker.com/api/v1/webcontact/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Api-Key TU_API_KEY_AQUI'  // 🔑 IMPORTANTE: Colocar tu API Key real aquí
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      console.error('Error en respuesta de la API', response.status, response.statusText);
      throw new Error('No se pudo enviar el formulario');
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ Contacto enviado correctamente a Tokko Broker', data);
    alert('Gracias por tu consulta, pronto te contactaremos.');
    this.reset();
  })
  .catch(err => {
    console.error('❌ Error al enviar a Tokko Broker:', err);
    alert('Ocurrió un error al enviar el formulario. Por favor, intentá nuevamente.');
  });
});
// document.querySelector('.btn-reset').addEventListener('click', () => {
//   document
//     .querySelectorAll('.buscador-avanzado select')
//     .forEach(sel => sel.selectedIndex = 0);
// });
const pasos = document.querySelectorAll(".step");
const path = document.getElementById("snake-path");
const trail = document.getElementById("snake-trail");

const totalLength = path.getTotalLength();
const pasosCount = pasos.length;
const stepLength = totalLength / pasosCount;

let pasoActual = 0;

function moverCabeza(pasoIndex) {
  const len = stepLength * pasoIndex - 5;

  const pos = path.getPointAtLength(len);
  const next = path.getPointAtLength(len + 5);

  const dx = next.x - pos.x;
  const dy = next.y - pos.y;
  // const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const offset = totalLength - (stepLength * pasoIndex - 5);
  // Posiciona y rota la flecha

  // Extiende el trail
  trail.setAttribute("stroke-dashoffset", offset);
}

function activarPaso() {
  pasos.forEach((p, i) => {
    p.classList.toggle("active", i === pasoActual);
  });

  moverCabeza(pasoActual);

  pasoActual = (pasoActual + 1) % pasosCount;
}

activarPaso();
setInterval(activarPaso, 1800);


