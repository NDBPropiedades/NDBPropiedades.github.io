/* TOKKO LISTADO + TOM SELECT (multiselect en todos los filtros) */

let todasLasPropiedades = [],
    propiedadesFiltradas = [],
    paginaActual = 1;

const propiedadesPorPagina = 10;
const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
const API_URL = `https://tokkobroker.com/api/v1/property/?key=${API_KEY}&format=json&shared=true`;

const contenedor   = document.getElementById("lista-propiedades");
const searchInput  = document.getElementById("search-text");

// <select> reales (Tom Select se monta arriba de estos IDs)
const selOperacion = document.getElementById("filtro-operacion");
const selTipologia = document.getElementById("filtro-tipologia");
const selZona      = document.getElementById("filtro-zona");
const selOrden     = document.getElementById("filtro-orden");

const paginacionNav = document.getElementById("paginacion");

const propertyTypeTranslations = {
  Land:"Terreno", Apartment:"Departamento", House:"Casa", "Weekend House":"Casa de fin de semana",
  Office:"Oficina", Mooring:"Amarra", "Bussiness Premises":"Local comercial", "Commercial Building":"Edificio comercial",
  Countryside:"Campo", Garage:"Cochera", Hotel:"Hotel", "Industrial Ship":"Nave industrial", Condo:"PH",
  Storage:"Depósito", "Bussiness Permit":"Fondo de comercio", "Storage room":"Baulera", "Wine Cellar":"Bodega",
  Farm:"Granja", Ranch:"Estancia", "Nautical Bed":"Cama náutica"
};

const normalizar = (v)=>(v||"").toString().toLowerCase()
  .normalize("NFD").replace(/\p{Diacritic}/gu,"");

function opToStd(v){
  const a = (v||"").toString().toLowerCase();
  if (a.includes("temporary")) return "Temporary Rent";
  if (a.includes("rent") || a === "alquiler") return "Rent";
  return "Sale";
}

/* ===== Scroll lock cuando un dropdown está abierto ===== */
function lockScroll(){
  const y = window.scrollY || document.documentElement.scrollTop;
  document.documentElement.dataset.scrollY = y;
  document.documentElement.classList.add('no-scroll');
  document.body.classList.add('no-scroll');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${y}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}
function unlockScroll(){
  const y = parseInt(document.documentElement.dataset.scrollY || '0', 10);
  document.documentElement.classList.remove('no-scroll');
  document.body.classList.remove('no-scroll');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, y);
}

/* ===== Tom Select: inicializar TODOS como multiselect ===== */
let tsOperacion, tsTipologia, tsZona, tsOrden;

function initTomSelects(){
  if(!window.TomSelect){
    console.error('TomSelect no cargó');
    return;
  }

  const makeTS = (el, extra={})=>{
    if(!el) return null;
    const ts = new TomSelect(el, {
      plugins: ['remove_button'],
      create: false,
      persist: false,
      maxItems: null,            // multiselect sin límite
      closeAfterSelect: false,    // cierra al elegir (UX mobile)
      placeholder: el.getAttribute('placeholder') || '',
      ...extra
    });
    ts.on('dropdown_open', lockScroll);
    ts.on('dropdown_close', unlockScroll);
    ts.on('change', reiniciarListado);
    return ts;
  };

  // destruir si ya existían y montar
  try { tsOperacion?.destroy(); } catch {}
  try { tsTipologia?.destroy(); } catch {}
  try { tsZona?.destroy(); } catch {}
  try { tsOrden?.destroy(); } catch {}

  tsOperacion = makeTS(selOperacion);
  tsTipologia = makeTS(selTipologia);
  tsZona      = makeTS(selZona);
  tsOrden     = makeTS(selOrden, { searchField:['text','value'] });
}

/* ===== Carga de opciones en los selects desde los datos ===== */
function cargarOpcionesDesdeDatos(props){
  // Operaciones únicas presentes en los datos
  const ops = new Set();
  props.forEach(p => (p.operations||[]).forEach(o => ops.add(opToStd(o.operation_type))));
  const opsOptions = [...ops].map(v=>({value:v, text: v==="Sale"?"Venta":(v==="Rent"?"Alquiler":"Alquiler Temporal")}));

  tsOperacion?.clearOptions();
  tsOperacion?.addOptions(opsOptions);
  tsOperacion?.refreshOptions(false);

  // Tipologías únicas (usa p.type.name)
  const tipos = new Set();
  props.forEach(p => { const t = p.type?.name; if(t) tipos.add(t); });
  const tipoOptions = [...tipos].sort().map(v=>({value:v, text: propertyTypeTranslations[v]||v}));

  tsTipologia?.clearOptions();
  tsTipologia?.addOptions(tipoOptions);
  tsTipologia?.refreshOptions(false);

  // Zonas únicas (usa p.location.name)
  const zonas = new Set();
  props.forEach(p => { const z = p.location?.name; if(z) zonas.add(z); });
  const zonaOptions = [...zonas].sort().map(v=>({value:v, text:v}));

  tsZona?.clearOptions();
  tsZona?.addOptions(zonaOptions);
  tsZona?.refreshOptions(false);

  // Orden fijo
  const ordenOptions = [
    {value:"precio-desc", text:"Precio: Alto a Bajo"},
    {value:"precio-asc",  text:"Precio: Bajo a Alto"},
    {value:"titulo-asc",  text:"Título: A-Z"},
    {value:"titulo-desc", text:"Título: Z-A"},
    {value:"fecha-desc",  text:"Nuevas primero"},
    {value:"fecha-asc",   text:"Antiguas primero"},
  ];
  tsOrden?.clearOptions();
  tsOrden?.addOptions(ordenOptions);
  tsOrden?.refreshOptions(false);
}

/* ===== Filtro principal (lee valores desde Tom Select) ===== */
function aplicarFiltros(lista){
  let arr = [...lista];

  // Operación (array)
  const operaciones = (tsOperacion?.getValue?.() || []).filter(Boolean); // ['Sale','Rent',...]
  if (operaciones.length){
    arr = arr.filter(p => (p.operations||[]).some(o => operaciones.includes(opToStd(o.operation_type))));
  }

  // Tipología (array)
  const tipologias = (tsTipologia?.getValue?.() || []).filter(Boolean);
  if (tipologias.length){
    arr = arr.filter(p => tipologias.includes(p.type?.name));
  }

  // Zona (array)
  const zonas = (tsZona?.getValue?.() || []).filter(Boolean);
  if (zonas.length){
    arr = arr.filter(p => zonas.includes(p.location?.name));
  }

  // Búsqueda libre
  const q = normalizar(searchInput?.value);
  if (q){
    arr = arr.filter(p=>{
      const price = p.operations?.[0]?.prices?.[0]?.price;
      const campos = [
        p.publication_title,
        p.location?.name,
        p.address,
        p.type?.name,
        price && `USD ${price}`
      ];
      return campos.some(v => normalizar(v).includes(q));
    });
  }

  // Orden (multiselect, tomamos el PRIMERO si seleccionaron varios)
  const ordenes = (tsOrden?.getValue?.() || []).filter(Boolean);
  const orden = ordenes[0] || "";
  if (orden){
    arr.sort((a,b)=>{
      const pa = a.operations?.[0]?.prices?.[0]?.price || 0;
      const pb = b.operations?.[0]?.prices?.[0]?.price || 0;
      const ta = a.publication_title || "";
      const tb = b.publication_title || "";
      const fa = new Date(a.created_on);
      const fb = new Date(b.created_on);
      switch(orden){
        case "precio-asc":  return pa - pb;
        case "precio-desc": return pb - pa;
        case "titulo-asc":  return ta.localeCompare(tb);
        case "titulo-desc": return tb.localeCompare(ta);
        case "fecha-asc":   return fa - fb;
        case "fecha-desc":  return fb - fa;
        default: return 0;
      }
    });
  }

  return arr;
}

/* ===== Helpers para card: elegir operación y precio coherentes ===== */
function elegirOperacionParaCard(p){
  const opsStd = (p.operations || []).map(o => opToStd(o.operation_type));
  const selectedOps = (tsOperacion?.getValue?.() || []).filter(Boolean);

  // 1) Si hay filtro del usuario, mostrar la que matchee
  let opS = selectedOps.find(op => opsStd.includes(op));

  // 2) Si no hay filtro, priorizar: Temporary > Rent > Sale
  if (!opS) {
    if (opsStd.includes('Temporary Rent')) opS = 'Temporary Rent';
    else if (opsStd.includes('Rent'))      opS = 'Rent';
    else                                   opS = 'Sale';
  }
  return opS;
}

function precioDeOperacion(p, opS){
  // busca la operación que matchea opS y toma su primer precio
  const op = (p.operations || []).find(o => opToStd(o.operation_type) === opS) || (p.operations || [])[0];
  const price = op?.prices?.[0]?.price;
  return price ? `USD ${price}` : 'Consultar';
}

/* ===== Paginación y render ===== */
function construirControlesPaginacion(total, actual, porPagina){
  paginacionNav.innerHTML = "";

  const btn = (label, pagina, disabled=false, activo=false)=>{
    const b = document.createElement("button");
    b.textContent = label;
    if (disabled) b.disabled = true;
    if (activo)   b.classList.add("activo");
    b.addEventListener("click", ()=>{
      if (!disabled && !activo){
        paginaActual = pagina;
        renderPagina();
      }
    });
    return b;
  };

  paginacionNav.appendChild(btn("«", Math.max(1, actual-1), actual===1));

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const mostrar = new Set([1,2,totalPaginas,totalPaginas-1,actual,actual-1,actual+1,actual-2,actual+2]);
  let previoMostrado = 0;
  for (let i=1;i<=totalPaginas;i++){
    if (mostrar.has(i)){
      paginacionNav.appendChild(btn(String(i), i, false, i===actual));
      previoMostrado = i;
    }else if (previoMostrado !== -1){
      const sp = document.createElement("span");
      sp.className = "ellipsis";
      sp.textContent = "…";
      paginacionNav.appendChild(sp);
      previoMostrado = -1;
    }
  }

  paginacionNav.appendChild(btn("»", Math.min(totalPaginas, actual+1), actual===totalPaginas));
}

function renderPagina(){
  contenedor.innerHTML = "";

  if (!propiedadesFiltradas.length){
    contenedor.innerHTML = `<div id="no-results" style="text-align:center;padding:2rem;color:#666">
      No encontramos propiedades con esos filtros.
    </div>`;
    paginacionNav.innerHTML = "";
    return;
  }

  const start = (paginaActual-1) * propiedadesPorPagina;
  const items = propiedadesFiltradas.slice(start, start + propiedadesPorPagina);

  items.forEach((p, idx)=>{
    const fotos = p.photos?.length
      ? p.photos.map(ph => `<div class="swiper-slide"><img src="${ph.image}" loading="lazy" /></div>`).join("")
      : '<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>';

    const tipo = propertyTypeTranslations[p.type?.name] || p.type?.name || "Propiedad";
    const zona = p.location?.name || "Zona no especificada";

    // === Operación a mostrar en la card ===
    const opS    = elegirOperacionParaCard(p);
    const tagTxt = (opS === 'Sale') ? 'Venta' : 'Alquiler';
    const tagBg  = (opS === 'Sale') ? '#0e246a' : '#7eccff';

    // Precio coherente con la operación elegida
    const precio = precioDeOperacion(p, opS);

    const swiperId = `swiper-${start + idx}`;

    const beds = p.room_amount || 0;
    const baths = p.bathroom_amount || 0;
    const toil  = p.toilet_amount || 0;
    const surf  = p.total_surface || 0;

    let iconos = "";
    if (beds>0) iconos += `<span><i class="fas fa-bed"></i> ${beds}</span>`;
    if (baths>0) iconos += `<span><i class="fas fa-bath"></i> ${baths}</span>`;
    if (toil>0) iconos += `<span><i class="fas fa-toilet"></i> ${toil}</span>`;
    if (surf>0) iconos += `<span><i class="fas fa-ruler-combined"></i> ${surf} m²</span>`;

    const card = `
      <div class="tokko-card">
        <div class="swiper mySwiper" id="${swiperId}">
          <div class="card-tag" style="background-color:${tagBg};">
            ${tagTxt}
          </div>
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
        ${iconos?`<div class="iconos-card">${iconos}</div>`:""}
      </div>
    `;
    contenedor.insertAdjacentHTML("beforeend", card);

    setTimeout(()=>{
      new Swiper(`#${swiperId}`, {
        loop: true,
        navigation: {
          nextEl: `#${swiperId} .swiper-button-next`,
          prevEl: `#${swiperId} .swiper-button-prev`
        },
        autoplay: false
      });
    }, 0);
  });

  construirControlesPaginacion(propiedadesFiltradas.length, paginaActual, propiedadesPorPagina);
}

function reiniciarListado(){
  propiedadesFiltradas = aplicarFiltros(todasLasPropiedades);
  paginaActual = 1;
  renderPagina();
}

/* ===== Fetch ===== */
async function fetchTodasLasPropiedades(){
  let res = [];
  let url = API_URL;
  while (url){
    const r = await fetch(url.startsWith("http") ? url : `https://tokkobroker.com${url}`);
    const j = await r.json();
    res = res.concat(j.objects || []);
    url = j.meta?.next;
  }
  return res;
}

async function cargarPropiedades(){
  contenedor.innerHTML = "<p>Cargando propiedades...</p>";
  todasLasPropiedades = await fetchTodasLasPropiedades();
  contenedor.innerHTML = "";

  // Poblamos selects con lo que vino de Tokko
  cargarOpcionesDesdeDatos(todasLasPropiedades);

  // Render inicial
  reiniciarListado();
}

/* ===== Listeners ===== */
let debounceT;
searchInput?.addEventListener("input", ()=>{
  clearTimeout(debounceT);
  debounceT = setTimeout(reiniciarListado, 250);
});

/* ===== Boot ===== */
(function boot(){
  initTomSelects();     // monta TS y listeners (incluye scroll lock)
  cargarPropiedades();  // trae data y renderiza
})();
