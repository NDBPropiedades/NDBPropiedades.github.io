var currentYear=new Date().getFullYear();document.getElementById("copyright").innerHTML=currentYear+" \xa9 Copyright NDB Propiedades. Todos los derechos reservados. Argentina, Buenos Aires.";const inmueblesContainer=document.getElementById("inmuebles-list"),filtroOperacion=document.getElementById("filtro-operacion"),filtroTipologia=document.getElementById("filtro-tipologia"),filtroZona=document.getElementById("filtro-zona"),filtroPartido=document.getElementById("filtro-partido"),filtroLocalidad=document.getElementById("filtro-localidad"),ordenSelect=document.getElementById("filtro-orden"),contenedorPropiedades=document.getElementById("lista-propiedades");let paginaActual=1;const propiedadesPorPagina=9;let propiedadesFiltradasGlobal=[];const propiedadesConDatos=propiedades.map(e=>({...e,zona:e.zona||"Zona Norte",partido:e.partido||"San Isidro",localidad:e.localidad||"San Isidro"}));let noResults=document.getElementById("no-results");function poblarFiltrosDesdeURL(){let e=new URLSearchParams(window.location.search);e.get("operacion")&&(filtroOperacion.value=e.get("operacion")),e.get("tipologia")&&(filtroTipologia.value=e.get("tipologia")),e.get("zona")&&(filtroZona.value=e.get("zona")),e.get("partido")&&(filtroPartido.value=e.get("partido")),e.get("localidad")&&(filtroLocalidad.value=e.get("localidad")),e.get("orden")&&(ordenSelect.value=e.get("orden"))}function crearCardHTML(e,o){let a;return`
      <div class="swiper-slide">
        <div class="card">
          <div class="swiper mySwiper" id="swiper-${o}" style="position: relative;">
            <div class="card-tag" style="background-color: ${"Venta"===e.tipoTransaccion?"#0e246a":"#7eccff"};">${e.tipoTransaccion}</div>
            <div class="swiper-wrapper">
              ${(e.imagenes_slider||[]).map(o=>`
        <div class="swiper-slide">
          <img src="${o}" alt="${e.tipoPropiedad} en ${e.localidad}" loading="lazy">
        </div>
      `).join("")}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
          </div>
  
            <h3>
              <a href="${e.html}" style="text-decoration: none; color: inherit;">
                ${e.tipoPropiedad} en ${e.localidad}
              </a>
            </h3>
          <p>${e.descripcion}</p>
          <p><strong>${e.valor}</strong></p>
  
          <div class="iconos-card">
            <span><i class="fas fa-bed"></i> ${e.dormitorios}</span>
            <span><i class="fas fa-bath"></i> ${e.baños}</span>
             <span><i class="fas fa-toilet"></i> ${e.toilet}</span>
            <span><i class="fas fa-ruler-combined"></i> ${e.tamaño} m\xb2</span>
          </div>
        </div>
      </div>
    `}function cargarPropiedades(e){let o=(paginaActual-1)*9;e.slice(o,o+9).forEach((e,o)=>{let a=crearCardHTML(e,o);contenedorPropiedades.insertAdjacentHTML("beforeend",a)}),inicializarSwipers()}function inicializarSwipers(){document.querySelectorAll(".mySwiper").forEach(e=>{e.swiper||new Swiper(e,{loop:!0,pagination:{el:e.querySelector(".swiper-pagination"),clickable:!0},autoplay:{delay:4e3,disableOnInteraction:!1},navigation:{nextEl:e.querySelector(".swiper-button-next"),prevEl:e.querySelector(".swiper-button-prev")}})})}function aplicarFiltros(){let e=[...propiedadesConDatos];filtroOperacion.value&&"default"!==filtroOperacion.value&&(e=e.filter(e=>e.tipoTransaccion===filtroOperacion.value));let o=Array.from(document.querySelectorAll('#dropdown-tipologia input[type="checkbox"]:checked')).map(e=>e.value);o.length>0&&(e=e.filter(e=>o.includes(e.tipoPropiedad)));let a=Array.from(document.querySelectorAll('#dropdown-zona input[type="checkbox"]:checked')).map(e=>e.value);if(a.length>0&&(e=e.filter(e=>a.includes(e.zona))),ordenSelect.value&&"default"!==ordenSelect.value&&(e=ordenarPropiedades(e,ordenSelect.value)),propiedadesFiltradasGlobal=e,paginaActual=1,contenedorPropiedades.innerHTML="",0===e.length){noResults.style.display="block";return}noResults.style.display="none",cargarPropiedades(propiedadesFiltradasGlobal)}function ordenarPropiedades(e,o){let a=e=>Number(e.replace(/[^0-9.-]+/g,""))||0;switch(o){case"precio-desc":return e.sort((e,o)=>a(o.valor)-a(e.valor));case"precio-asc":return e.sort((e,o)=>a(e.valor)-a(o.valor));case"titulo-asc":return e.sort((e,o)=>e.descripcion.localeCompare(o.descripcion));case"titulo-desc":return e.sort((e,o)=>o.descripcion.localeCompare(e.descripcion));case"fecha-desc":return e.sort((e,o)=>(o.id||0)-(e.id||0));case"fecha-asc":return e.sort((e,o)=>(e.id||0)-(o.id||0));default:return e}}function toggleDropdown(e){let o=document.getElementById("dropdown-"+e);o&&(o.style.display="block"===o.style.display?"none":"block")}noResults||((noResults=document.createElement("div")).id="no-results",noResults.textContent="Lo siento, no encontramos propiedades disponibles.",Object.assign(noResults.style,{display:"none",textAlign:"center",padding:"2rem",fontSize:"1.25rem",color:"#666"}),contenedorPropiedades.parentNode.insertBefore(noResults,contenedorPropiedades.nextSibling)),poblarFiltrosDesdeURL(),window.addEventListener("scroll",()=>{window.innerHeight+window.scrollY>=document.body.offsetHeight-100&&(paginaActual++,cargarPropiedades(propiedadesFiltradasGlobal))}),[filtroOperacion,filtroTipologia,filtroZona,filtroPartido,filtroLocalidad,ordenSelect,].forEach(e=>{e&&e.addEventListener("change",aplicarFiltros)}),aplicarFiltros(),document.addEventListener("DOMContentLoaded",()=>{let e=new URLSearchParams(window.location.search);["operacion","tipologia","zona"].forEach(o=>{let a=e.get(o);if(a){let t=document.querySelector(`select[name="${o}"]`);t&&(t.value=a)}}),(e.has("operacion")||e.has("tipologia")||e.has("zona"))&&"function"==typeof filterProperties&&filterProperties()}),document.querySelectorAll('.multiselect-options input[type="checkbox"]').forEach(e=>{e.addEventListener("change",aplicarFiltros)}),document.addEventListener("click",function(e){document.querySelectorAll(".multiselect-wrapper").forEach(o=>{let a=o.querySelector(".multiselect-options");a&&!o.contains(e.target)&&(a.style.display="none")})});