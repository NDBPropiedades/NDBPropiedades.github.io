const API_URL="https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true",contenedorCards=document.getElementById("propiedades-list"),propertyTypeTranslations={Land:"Terreno",Apartment:"Departamento",House:"Casa","Weekend House":"Casa de fin de semana",Office:"Oficina",Mooring:"Amarra","Bussiness Premises":"Local comercial","Commercial Building":"Edificio comercial",Countryside:"Campo",Garage:"Cochera",Hotel:"Hotel","Industrial Ship":"Nave industrial",Condo:"PH",Storage:"Dep\xf3sito","Bussiness Permit":"Fondo de comercio","Storage room":"Baulera","Wine Cellar":"Bodega",Farm:"Granja",Ranch:"Estancia","Nautical Bed":"Cama n\xe1utica"};var currentYear=new Date().getFullYear();function cargarPropiedades(){fetch("https://tokkobroker.com/api/v1/property/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json&shared=true").then(e=>e.json()).then(e=>{contenedorCards.innerHTML="",e.objects.forEach((e,a)=>{let r=document.createElement("div");r.className="swiper-slide";let t=(e.photos||[]).map(a=>`
          <div class="swiper-slide">
            <img src="${a.image}" alt="${e.publication_title}" loading="lazy">
          </div>
        `).join(""),s=e.operations?.[0]?.operation_type==="Sale"?"Venta":"Alquiler",i=propertyTypeTranslations[e.type?.name]||e.type?.name||"Propiedad",o=e.location?.name||"Ubicaci\xf3n no especificada",n=e.operations?.[0]?.prices?.[0]?.price?`USD ${e.operations[0].prices[0].price}`:"Consultar",l=e.room_amount||0,c=e.bathroom_amount||0,p=e.toilet_amount||0,d=e.total_surface||0,u=`
        ${l>0?`<span><i class="fas fa-bed"></i> ${l}</span>`:""}
        ${c>0?`<span><i class="fas fa-bath"></i> ${c}</span>`:""}
        ${p>0?`<span><i class="fas fa-toilet"></i> ${p}</span>`:""}
        ${d>0?`<span><i class="fas fa-ruler-combined"></i> ${d} m\xb2</span>`:""}
      `;r.innerHTML=`
        <div class="card">
          <div class="swiper mySwiper" id="swiper-${a}" style="position: relative;">
           <div class="card-tag" style="background-color: ${"Venta"===s?"#0e246a":"#7eccff"};">${s}</div>
            <div class="swiper-wrapper">
              ${t||'<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen"></div>'}
            </div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
          </div>

          <h3>
            <a href="propiedad.html?id=${e.id}" style="text-decoration: none; color: inherit;">
              ${i} en ${o}
            </a>
          </h3>
          <p>${e.publication_title||""}</p>
         
          <p><strong>Precio:</strong> ${n}</p>

           <div class="iconos-card">
            ${u}
          </div>
        </div>
      `,contenedorCards.appendChild(r)}),inicializarSwipers(),inicializarSwiperGeneral()}).catch(e=>{console.error("Error al cargar propiedades destacadas:",e),contenedorCards.innerHTML="<p>Error al cargar propiedades.</p>"})}function inicializarSwipers(){let e=document.querySelectorAll(".mySwiper");e.forEach(e=>{new Swiper(e,{loop:!0,autoplay:!1,navigation:{nextEl:e.querySelector(".swiper-button-next"),prevEl:e.querySelector(".swiper-button-prev")}})})}function inicializarSwiperGeneral(){new Swiper(".myMainSwiper",{loop:!0,grabCursor:!0,slidesPerView:3,slidesPerGroup:3,spaceBetween:30,breakpoints:{0:{slidesPerView:1,slidesPerGroup:1},768:{slidesPerView:2,slidesPerGroup:2},1024:{slidesPerView:3,slidesPerGroup:3}}})}document.getElementById("copyright").innerHTML=currentYear+" \xa9 Copyright NDB Propiedades. Todos los derechos reservados. Argentina, Buenos Aires.",document.addEventListener("DOMContentLoaded",()=>{cargarPropiedades()});const animables=document.querySelectorAll(".fade-in"),observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add("visible"),observer.unobserve(e.target))})},{threshold:.2});animables.forEach(e=>observer.observe(e));const pasos=document.querySelectorAll(".step"),path=document.getElementById("snake-path"),trail=document.getElementById("snake-trail"),totalLength=path.getTotalLength(),pasosCount=pasos.length,stepLength=totalLength/pasosCount;let pasoActual=0;function moverCabeza(e){let a=stepLength*e-5,r=path.getPointAtLength(a),t=path.getPointAtLength(a+5);t.x,r.x,t.y,r.y,trail.setAttribute("stroke-dashoffset",totalLength-(stepLength*e-5))}function activarPaso(){pasos.forEach((e,a)=>{e.classList.toggle("active",a===pasoActual)}),moverCabeza(pasoActual),pasoActual=(pasoActual+1)%pasosCount}activarPaso(),setInterval(activarPaso,1800);