// Genera páginas estáticas indexables desde Tokko: una por propiedad (fichas/),
// una por zona (barrios/), el sitemap y el bloque de zonas de propiedades.html.
// Uso: node scripts/generar-seo.mjs

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const SITIO = "https://ndbpropiedades.com.ar";
const WHATSAPP = "5491172172121";
const LOGO = "/assets/img/img/Nicolas%20De%20Brasi%20-%20Logo%202%20Positivo%20RGB.png";
const LOGO_FOOTER = "/assets/img/img/Nicolas%20De%20Brasi%20-%20Logo%20Positivo%20RGB.png";
const FOTOS_POR_TARJETA = 5;
const ZONAS_DESTACADAS = 8;

const TIPOS = {
  Land: "Terreno",
  Apartment: "Departamento",
  House: "Casa",
  "Weekend House": "Casa de fin de semana",
  Office: "Oficina",
  "Bussiness Premises": "Local comercial",
  "Commercial Building": "Edificio comercial",
  Countryside: "Campo",
  Garage: "Cochera",
  "Industrial Ship": "Nave industrial",
  Condo: "PH",
  Storage: "Depósito",
};

const TIPOS_PLURAL = {
  Terreno: "terrenos",
  Departamento: "departamentos",
  Casa: "casas",
  Oficina: "oficinas",
  "Local comercial": "locales comerciales",
  Campo: "campos",
  Cochera: "cocheras",
  PH: "PH",
};

const OPERACIONES = { Sale: "Venta", Rent: "Alquiler" };

// Tokko abrevia varias zonas; acá se traducen solo para mostrarlas.
// El nombre original se sigue usando para slugs y para el filtro ?zona=.
const NOMBRES_ZONA = {
  "Acas.-Libert./Solis": "Acassuso (Libertador a Solís)",
  "Beccar-Vias/Libert.": "Beccar (Vías a Libertador)",
  "Beccar-Vias/Rolon": "Beccar (Vías a Rolón)",
  "Mart.-Libert./Rio": "Martínez (Libertador al Río)",
  "Mart.-Vias/Libert.": "Martínez (Vías a Libertador)",
  "Mart.-Vias/Santa Fe": "Martínez (Vías a Santa Fe)",
  "S.Fer.-Vias/Centro": "San Fernando (Vías al Centro)",
  "Florida Mitre/Este": "Florida (Mitre al Este)",
  "Countries/B.Cerrado (Pilar)": "Barrios cerrados de Pilar",
  Martinez: "Martínez",
  Nuñez: "Núñez",
  "Talar De Martinez": "Talar de Martínez",
  "San Cristobal": "San Cristóbal",
  "San Sebastian": "San Sebastián",
  "Exaltacion De La Cruz": "Exaltación de la Cruz",
};

const nombreZona = (z) => {
  const limpio = String(z ?? "").trim();
  return (
    NOMBRES_ZONA[limpio] ||
    limpio.replace(/ (De|Del|La|Las|Los)(?= )/g, (m) => m.toLowerCase())
  );
};

const esc = (v) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const slug = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const textoPlano = (v) =>
  String(v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

const jsonLd = (o) => JSON.stringify(o).replaceAll("<", "\\u003c");

const formatoPrecio = (p) => {
  if (!p || !(Number(p.price) > 0)) return "Consultar precio";
  const simbolo = p.currency === "ARS" ? "$" : p.currency;
  return `${simbolo} ${Number(p.price).toLocaleString("es-AR")}`;
};

const precio = (op) => formatoPrecio(op.prices?.[0]);

const etiquetaOperacion = (op) =>
  OPERACIONES[op.operation_type] || "Alquiler temporal";

const tipoDe = (p) => TIPOS[p.type?.name] || p.type?.name || "Propiedad";
const tituloDe = (p) =>
  p.publication_title || `${tipoDe(p)} en ${nombreZona(p.location?.name)}`;
const fotosDe = (p) => (p.photos || []).filter((f) => f?.image);
const rutaFicha = (p) => `/fichas/${p.id}-${slug(tituloDe(p))}.html`;
const rutaBarrio = (nombre) => `/barrios/${slug(nombre)}.html`;
const textoCantidad = (n) => (n === 1 ? "1 propiedad" : `${n} propiedades`);

const listaConY = (items) =>
  items.length > 1
    ? `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`
    : items[0] || "";

const linkWhatsapp = (p, url) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hola NDB Propiedades! Me interesa la propiedad "${tituloDe(p)}" (ID ${p.id}): ${url}`,
  )}`;

async function traerPropiedades() {
  const clave = readFileSync("propiedades.js", "utf8").match(
    /API_KEY = "([^"]+)"/,
  )[1];
  let url = `https://tokkobroker.com/api/v1/property/?key=${clave}&format=json&shared=true&limit=500`;
  const propiedades = [];

  while (url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Tokko respondió ${r.status}`);
    const datos = await r.json();
    propiedades.push(...(datos.objects || []));
    url = datos.meta?.next ? `https://tokkobroker.com${datos.meta.next}` : null;
  }

  if (!propiedades.length) throw new Error("Tokko no devolvió propiedades");
  return propiedades;
}

function pagina({ titulo, descripcion, ruta, imagen, ld, cuerpo, script = "" }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(titulo)}</title>
    <meta name="description" content="${esc(descripcion)}" />
    <link rel="canonical" href="${SITIO}${ruta}" />
    <link rel="icon" href="/assets/img/favicon/favicon.ico" type="image/x-icon" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(titulo)}" />
    <meta property="og:description" content="${esc(descripcion)}" />
    <meta property="og:url" content="${SITIO}${ruta}" />
    <meta property="og:image" content="${esc(imagen)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
    <link rel="stylesheet" href="/general_styles.css" />
    <link rel="stylesheet" href="/fichas.css" />
    <script type="application/ld+json">${jsonLd(ld)}</script>
  </head>
  <body class="s-body">
    <div class="wasap">
      <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener noreferrer" aria-label="Escribinos por WhatsApp">
        <img src="/assets/img/svg/logo-wapp-01.svg" width="50" height="50" alt="" />
      </a>
    </div>

    <header class="header">
      <div class="container header-container">
        <a href="/index.html" class="logo" aria-label="Ir al inicio">
          <img src="${LOGO}" alt="NDB Propiedades" width="300" height="100" />
        </a>
        <nav class="nav-container" aria-label="Navegación principal">
          <ul class="nav">
            <li><a href="/index.html">INICIO</a></li>
            <li><a href="/propiedades.html" class="active">PROPIEDADES</a></li>
            <li><a href="/oficina.html">OFICINA</a></li>
            <li><a href="/zonas.html">ZONAS</a></li>
            <li><a href="/index.html#tasa">CONTACTO</a></li>
            <li><a href="/index.html#nosotros">NOSOTROS</a></li>
            <li><a href="/index.html#tasa" class="tasa-btn">TASÁ TU INMUEBLE</a></li>
          </ul>
          <button class="menu-toggle" aria-label="Abrir menú"><i class="fas fa-bars"></i></button>
        </nav>
      </div>
    </header>

    <main>
${cuerpo}
    </main>

    <footer class="footer">
      <div class="containers footer-container">
        <div class="footer-left">
          <img src="${LOGO_FOOTER}" alt="NDB Propiedades" class="footer-logo" width="200" height="80" loading="lazy" />
        </div>
        <div class="footer-center">
          <p class="footer-brand"><strong>NDB Propiedades</strong><span>Provincia de Buenos Aires y CABA</span></p>
          <p><i class="fas fa-phone"></i> +54 9 11 7217-2121</p>
          <p><i class="fas fa-envelope"></i> <a href="mailto:info@ndbpropiedades.com.ar">info@ndbpropiedades.com.ar</a></p>
          <p><i class="fas fa-map-marker-alt"></i> Rioja 3000, Olivos</p>
        </div>
        <div class="footer-right">
          <ul class="footer-menu">
            <li><a href="/index.html">INICIO</a></li>
            <li><a href="/propiedades.html">PROPIEDADES</a></li>
            <li><a href="/oficina.html">OFICINA</a></li>
            <li><a href="/zonas.html">ZONAS</a></li>
          </ul>
        </div>
      </div>
      <div class="containers footer-legal">
        <p><i class="fas fa-certificate"></i> CMCPSI 6944 · CUCICBA 10.077</p>
      </div>
    </footer>

    <script src="/navbar.js"></script>${script}
  </body>
</html>
`;
}

function ficha(p) {
  const titulo = tituloDe(p);
  const zonaOriginal = p.location?.name || "";
  const zona = nombreZona(zonaOriginal);
  const ruta = rutaFicha(p);
  const fotos = fotosDe(p);
  const ops = p.operations || [];
  const precios = ops.map((o) => `${etiquetaOperacion(o)}: ${precio(o)}`);
  const descripcionCompleta = textoPlano(p.description_only || p.description);
  const resumen = textoPlano(
    p.seo_description ||
      `${tipoDe(p)} en ${zona}. ${precios.join(" · ")}. ${descripcionCompleta}`,
  )
    .replace(/\s+/g, " ")
    .replace(/Las medidas, superficies[\s\S]*$/i, "")
    .trim()
    .slice(0, 155);

  const datos = [
    p.room_amount > 0 && `${p.room_amount} ambientes`,
    p.bedroom_amount > 0 && `${p.bedroom_amount} dormitorios`,
    p.bathroom_amount > 0 &&
      `${p.bathroom_amount} ${p.bathroom_amount === 1 ? "baño" : "baños"}`,
    Number(p.total_surface) > 0 && `${Number(p.total_surface)} m² totales`,
  ].filter(Boolean);

  const parrafos = descripcionCompleta
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `        <p>${esc(t)}</p>`)
    .join("\n");

  const ofertas = ops
    .map((o) => o.prices?.[0])
    .filter((q) => q && Number(q.price) > 0)
    .map((q) => ({
      "@type": "Offer",
      price: Number(q.price),
      priceCurrency: q.currency,
    }));

  const cuerpo = `      <div class="s-main">
      <nav class="s-migas"><a href="/propiedades.html">Propiedades</a> › <a href="${rutaBarrio(zonaOriginal)}">${esc(zona)}</a></nav>
      <h1>${esc(titulo)}</h1>
      <p class="s-zona">${esc(tipoDe(p))} en ${esc(zona)} · ID ${p.id}</p>
      <ul class="s-precios">
${precios.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>
      ${datos.length ? `<p class="s-datos">${esc(datos.join(" · "))}</p>` : ""}
      <p class="s-acciones">
        <a class="z-btn z-btn--primario" href="/propiedad.html?id=${p.id}">Ver fotos y ficha completa</a>
        <a class="z-btn z-btn--wa" href="${linkWhatsapp(p, SITIO + ruta)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</a>
      </p>
      <div class="s-fotos">
${fotos
  .slice(0, 6)
  .map(
    (f, i) =>
      `        <img src="${esc(f.image)}" alt="${esc(titulo)} - foto ${i + 1}" width="640" height="480" ${i ? 'loading="lazy"' : ""} />`,
  )
  .join("\n")}
      </div>
      <section class="s-descripcion">
        <h2>Descripción</h2>
${parrafos}
      </section>
      </div>`;

  return pagina({
    titulo: `${titulo} | NDB Propiedades`,
    descripcion: resumen,
    ruta,
    imagen: fotos[0]?.image || `${SITIO}${LOGO}`,
    ld: {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: titulo,
      url: `${SITIO}${ruta}`,
      image: fotos.slice(0, 6).map((f) => f.image),
      description: resumen,
      offers: ofertas,
    },
    cuerpo,
  });
}

function tarjeta(p, indice) {
  const titulo = tituloDe(p);
  const fotos = fotosDe(p).slice(0, FOTOS_POR_TARJETA);
  const totalFotos = fotosDe(p).length;
  const ops = p.operations || [];
  const primerPrecio = ops[0]?.prices?.[0];
  const urlCompleta = `/propiedad.html?id=${p.id}`;

  const imagenes = fotos.length
    ? fotos
        .map(
          (f, i) =>
            `<img src="${esc(f.image)}" alt="${esc(titulo)} - foto ${i + 1}" width="640" height="480" ${indice < 3 && i === 0 ? "" : 'loading="lazy"'} decoding="async" />`,
        )
        .join("")
    : `<img src="/assets/img/no-image.jpg" alt="${esc(titulo)}" width="640" height="480" />`;

  const barras =
    fotos.length > 1
      ? `<div class="z-card__barras" aria-hidden="true">${fotos
          .map((_, i) => `<span${i === 0 ? ' class="activa"' : ""}></span>`)
          .join("")}</div>`
      : "";

  const datos = [
    p.room_amount > 0 && `<span><i class="fas fa-couch"></i> ${p.room_amount} amb.</span>`,
    p.bedroom_amount > 0 && `<span><i class="fas fa-bed"></i> ${p.bedroom_amount} dorm.</span>`,
    p.bathroom_amount > 0 &&
      `<span><i class="fas fa-bath"></i> ${p.bathroom_amount} ${p.bathroom_amount === 1 ? "baño" : "baños"}</span>`,
    Number(p.total_surface) > 0 &&
      `<span><i class="fas fa-ruler-combined"></i> ${Number(p.total_surface)} m²</span>`,
  ]
    .filter(Boolean)
    .join("");

  return `        <article class="z-card" data-op="${esc(ops.map((o) => o.operation_type).join(" "))}" data-tipo="${esc(tipoDe(p))}" data-precio="${Number(primerPrecio?.price) || 0}" data-moneda="${esc(primerPrecio?.currency || "")}">
          <div class="z-card__media">
            <a class="z-card__fotos" href="${urlCompleta}" aria-label="Ver ${esc(titulo)}">${imagenes}</a>
            <div class="z-card__etiquetas">${ops
              .map((o) => `<span>${esc(etiquetaOperacion(o))}</span>`)
              .join("")}</div>
            ${totalFotos > 1 ? `<span class="z-card__contador"><i class="fas fa-camera"></i> ${totalFotos}</span>` : ""}
            ${barras}
          </div>
          <div class="z-card__cuerpo">
            <div class="z-card__precios">${ops
              .map(
                (o) =>
                  `<p><small>${esc(etiquetaOperacion(o))}</small> ${esc(precio(o))}</p>`,
              )
              .join("")}</div>
            <h2 class="z-card__titulo"><a href="${rutaFicha(p)}">${esc(titulo)}</a></h2>
            ${datos ? `<div class="z-card__datos">${datos}</div>` : ""}
            <div class="z-card__acciones">
              <a class="z-btn z-btn--wa" href="${linkWhatsapp(p, SITIO + urlCompleta)}" target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp: ${esc(titulo)}"><i class="fab fa-whatsapp"></i> Consultar</a>
              <a class="z-btn z-btn--primario" href="${urlCompleta}">Ver propiedad</a>
            </div>
          </div>
        </article>`;
}

function barrio(zonaOriginal, lista, otrasZonas) {
  const nombre = nombreZona(zonaOriginal);
  const ruta = rutaBarrio(zonaOriginal);
  const fotoPortada = fotosDe(lista[0])[0]?.image;

  const tipos = [...new Set(lista.map(tipoDe))];
  const ops = [
    ...new Set(lista.flatMap((p) => (p.operations || []).map((o) => o.operation_type))),
  ];
  const textoOps = listaConY(
    ops.map((o) => (OPERACIONES[o] || "Alquiler temporal").toLowerCase()),
  );
  const textoTipos = listaConY(
    tipos.slice(0, 3).map((t) => TIPOS_PLURAL[t] || t.toLowerCase()),
  );
  const descripcion = `${textoCantidad(lista.length)} en ${nombre}: ${textoTipos} en ${textoOps}. Consultá con NDB Propiedades.`;

  // Las cocheras no representan el precio de entrada de una zona
  const preciosVenta = lista
    .filter((p) => p.type?.name !== "Garage")
    .flatMap((p) => p.operations || [])
    .filter((o) => o.operation_type === "Sale")
    .map((o) => o.prices?.[0])
    .filter((q) => q?.currency === "USD" && Number(q.price) > 0)
    .map((q) => Number(q.price));
  const desde = preciosVenta.length
    ? formatoPrecio({ currency: "USD", price: Math.min(...preciosVenta) })
    : "";

  const chip = (grupo, valor, etiqueta) =>
    `<button type="button" class="z-chip" data-grupo="${grupo}" data-valor="${esc(valor)}" aria-pressed="false">${esc(etiqueta)}</button>`;

  const chips = [
    ...(ops.length > 1
      ? ops.map((o) => chip("op", o, OPERACIONES[o] || "Alquiler temporal"))
      : []),
    ...(tipos.length > 1 ? tipos.map((t) => chip("tipo", t, t)) : []),
  ];

  const barraHerramientas =
    lista.length > 1
      ? `      <div class="z-barra" data-barra hidden>
        <div class="z-chips" role="group" aria-label="Filtrar propiedades">
          ${chips.length ? `<button type="button" class="z-chip" data-grupo="todas" aria-pressed="true">Todas</button>${chips.join("")}` : ""}
        </div>
        <label class="z-orden">
          <span>Ordenar</span>
          <select data-orden>
            <option value="">Destacadas</option>
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
          </select>
        </label>
      </div>
      <p class="z-vacio" data-vacio hidden>No hay propiedades con esa combinación. Probá con otro filtro.</p>
`
      : "";

  const otras = otrasZonas
    .map(
      (z) =>
        `          <li><a class="z-pill" href="${rutaBarrio(z)}">${esc(nombreZona(z))}</a></li>`,
    )
    .join("\n");

  return pagina({
    titulo: `Propiedades en ${nombre} | NDB Propiedades`,
    descripcion,
    ruta,
    imagen: fotoPortada || `${SITIO}${LOGO}`,
    ld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Propiedades en ${nombre}`,
      url: `${SITIO}${ruta}`,
    },
    script: `\n    <script src="/barrios.js"></script>`,
    cuerpo: `      <section class="z-hero">
        ${fotoPortada ? `<img class="z-hero__foto" src="${esc(fotoPortada)}" alt="" />` : ""}
        <div class="z-contenedor z-hero__texto">
          <nav class="z-migas" aria-label="Migas de pan"><a href="/propiedades.html">Propiedades</a> <span>›</span> ${esc(nombre)}</nav>
          <h1>Propiedades en ${esc(nombre)}</h1>
          <p class="z-hero__datos"><strong data-conteo>${textoCantidad(lista.length)}</strong>${desde ? ` <span>Venta desde ${esc(desde)}</span>` : ""}</p>
        </div>
      </section>

      <div class="z-contenedor">
${barraHerramientas}      <div class="z-grilla" data-grilla>
${lista.map(tarjeta).join("\n")}
      </div>

      <section class="z-otras">
        <h2>Otras zonas</h2>
        <ul>
${otras}
          <li><a class="z-pill z-pill--todas" href="/propiedades.html">Ver todas las propiedades →</a></li>
        </ul>
      </section>
      </div>`,
  });
}

function actualizarBloqueZonas(zonas, porZona) {
  const archivo = "propiedades.html";
  const original = readFileSync(archivo, "utf8");
  const crlf = original.includes("\r\n");
  const html = original.replaceAll("\r\n", "\n");

  const destacadas = zonas.slice(0, ZONAS_DESTACADAS);
  const resto = zonas
    .slice(ZONAS_DESTACADAS)
    .sort((a, b) => nombreZona(a).localeCompare(nombreZona(b), "es"));

  const tile = (z) => {
    const lista = porZona.get(z);
    const foto = lista.map((p) => fotosDe(p)[0]?.image).find(Boolean);
    return `          <a class="zona-tile" href="${rutaBarrio(z)}">
            <img src="${esc(foto)}" alt="" width="400" height="300" loading="lazy" decoding="async" />
            <span class="zona-tile__texto"><strong>${esc(nombreZona(z))}</strong><small>${textoCantidad(lista.length)}</small></span>
          </a>`;
  };

  const bloque = `<!-- seo-barrios:start -->
      <section class="zonas-explorar container" aria-labelledby="zonas-titulo">
        <h2 id="zonas-titulo">Explorá por zona</h2>
        <div class="zonas-tiles">
${destacadas.map(tile).join("\n")}
        </div>
        <details class="zonas-mas">
          <summary>Ver las ${zonas.length} zonas</summary>
          <ul>
${resto.map((z) => `            <li><a href="${rutaBarrio(z)}">${esc(nombreZona(z))}</a></li>`).join("\n")}
          </ul>
        </details>
      </section>
      <!-- seo-barrios:end -->`;

  const nuevo = html.replace(
    /<!-- seo-barrios:start -->[\s\S]*<!-- seo-barrios:end -->/,
    () => bloque,
  );
  writeFileSync(archivo, crlf ? nuevo.replaceAll("\n", "\r\n") : nuevo);
}

// Etiquetas de zonas.html sin página propia en Tokko, o que pueden quedarse
// sin ella: se prueba con estas subzonas, en orden.
const SUBZONAS_ETIQUETA = {
  Florida: ["Florida Mitre/Este"],
  Acassuso: ["Acas.-Libert./Solis"],
  Martínez: ["Mart.-Vias/Libert.", "Mart.-Libert./Rio", "Mart.-Vias/Santa Fe"],
  Beccar: ["Beccar-Vias/Libert.", "Beccar-Vias/Rolon", "Beccar Alto"],
  "San Fernando": ["S.Fer.-Vias/Centro"],
};

function actualizarEtiquetasZonas(zonas) {
  const archivo = "zonas.html";
  const original = readFileSync(archivo, "utf8");
  const crlf = original.includes("\r\n");
  const html = original.replaceAll("\r\n", "\n");

  const zonaDeEtiqueta = (texto) =>
    zonas.find((z) => nombreZona(z) === texto) ||
    (SUBZONAS_ETIQUETA[texto] || []).find((z) => zonas.includes(z));

  const nuevo = html.replace(
    /<ul class="zn-chips">[\s\S]*?<\/ul>/g,
    (lista) =>
      lista.replace(
        /<li(?: class="zn-chips__link")?>(?:<a href="[^"]*">)?([^<]+)(?:<\/a>)?<\/li>/g,
        (_, texto) => {
          const zona = zonaDeEtiqueta(texto.trim());
          return zona
            ? `<li class="zn-chips__link"><a href="${rutaBarrio(zona)}">${texto}</a></li>`
            : `<li>${texto}</li>`;
        },
      ),
  );

  writeFileSync(archivo, crlf ? nuevo.replaceAll("\n", "\r\n") : nuevo);
}

function sitemap(rutas) {
  const fijas = [
    ["/index.html", "1.0"],
    ["/propiedades.html", "0.9"],
    ["/zonas.html", "0.8"],
    ["/oficina.html", "0.7"],
  ];
  const urls = [...fijas, ...rutas.map((r) => [r, "0.7"])]
    .map(
      ([r, prioridad]) =>
        `  <url>\n    <loc>${SITIO}${r}</loc>\n    <priority>${prioridad}</priority>\n  </url>`,
    )
    .join("\n");

  writeFileSync(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
}

const propiedades = await traerPropiedades();

for (const dir of ["fichas", "barrios"]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
}

const porZona = new Map();
for (const p of propiedades) {
  writeFileSync(`.${rutaFicha(p)}`, ficha(p));
  const zona = p.location?.name;
  if (zona) porZona.set(zona, [...(porZona.get(zona) || []), p]);
}

// Primero las zonas con más propiedades
const zonas = [...porZona.keys()].sort(
  (a, b) =>
    porZona.get(b).length - porZona.get(a).length ||
    nombreZona(a).localeCompare(nombreZona(b), "es"),
);

for (const z of zonas) {
  const otras = zonas.filter((x) => x !== z).slice(0, 10);
  writeFileSync(`.${rutaBarrio(z)}`, barrio(z, porZona.get(z), otras));
}

actualizarBloqueZonas(zonas, porZona);
actualizarEtiquetasZonas(zonas);
sitemap([...zonas.map(rutaBarrio), ...propiedades.map(rutaFicha)]);

console.log(`${propiedades.length} fichas y ${zonas.length} zonas generadas`);
