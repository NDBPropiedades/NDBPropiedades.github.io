const API_KEY="76c2e21bd630d16cfdb33e96f43fc013eafc4173",galeriaEl=document.getElementById("galeria-propiedad"),infoEl=document.getElementById("info-propiedad"),descripcionEl=document.getElementById("descripcion"),mapaEl=document.getElementById("mapa-propiedad"),caracteristicasEl=document.getElementById("caracteristicas"),linkFormulario=document.getElementById("formulario-link"),urlParams=new URLSearchParams(window.location.search),propiedadId=urlParams.get("id");if(propiedadId){let e=`https://tokkobroker.com/api/v1/property/${propiedadId}/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173&format=json`;fetch(e).then(e=>e.json()).then(e=>{let i=e.photos?.map(e=>`<div class="swiper-slide"><img src="${e.image}" alt="Imagen propiedad" loading="lazy" /></div>`).join("")||'<div class="swiper-slide"><img src="assets/img/no-image.jpg" alt="Sin imagen" /></div>',a=e.photos?.map(e=>`<div class="swiper-slide"><img src="${e.thumb}" alt="Miniatura propiedad" loading="lazy" /></div>`).join("")||"",r=e.publication_title||"Propiedad sin t\xedtulo",s=e.operations?.[0]?.prices?.[0]?.price?`USD ${e.operations[0].prices[0].price}`:"Consultar",o=e.location?.name||"Zona no especificada",t=e.description?.trim()||"Sin descripci\xf3n.",l=e.real_address||e.address||"Direcci\xf3n no disponible",p=e.reference_code||"-",d=e.expenses?`$${e.expenses}`:"No informadas",n=e.legally_checked_text||"-",c=e.public_url||null;galeriaEl.innerHTML=`
    <div class="galeria-propiedad swiper mySwiper2">
      <div class="swiper-wrapper">${i}</div>
      <div class="swiper-button-next"></div>
      <div class="swiper-button-prev"></div>
    </div>
    <div class="swiper mySwiperThumbs">
      <div class="swiper-wrapper">${a}</div>
    </div>
  `,new Swiper(".mySwiperThumbs",{spaceBetween:10,slidesPerView:5,freeMode:!0,watchSlidesProgress:!0,breakpoints:{0:{slidesPerView:3},576:{slidesPerView:4},992:{slidesPerView:5}}}),new Swiper(".mySwiper2",{spaceBetween:10,navigation:{nextEl:".swiper-button-next",prevEl:".swiper-button-prev"},loop:!0,autoplay:{delay:4e3,disableOnInteraction:!1},thumbs:{swiper:document.querySelector(".mySwiperThumbs").swiper}}),infoEl.innerHTML=`
    <h1>${r}</h1>
    <p><strong>${s}</strong></p>
    <p><i class="fas fa-map-marker-alt"></i> ${l}</p>
    <p>${o}</p>
    <p><strong>C\xf3digo de referencia:</strong> ${p}</p>
  `,descripcionEl.innerHTML=`
    <h2>Descripci\xf3n</h2>
    <p>${t}</p>
    <p><strong>Expensas:</strong> ${d}</p>
    <p><strong>Estado legal:</strong> ${n}</p>
    ${c?`<p><a href="${c}" target="_blank" rel="noopener noreferrer">Ver ficha completa en Tokko</a></p>`:""}
  `,caracteristicasEl.innerHTML=`
    <div><i class="fas fa-vector-square"></i> ${e.total_surface||"-"} m\xb2 tot.</div>
    <div><i class="fas fa-vector-square"></i> ${e.roofed_surface||"-"} m\xb2 cub.</div>
    <div><i class="fas fa-door-open"></i> ${e.room_amount||"-"} ambientes</div>
    <div><i class="fas fa-bath"></i> ${e.bathroom_amount||"-"} ba\xf1os</div>
    <div><i class="fas fa-toilet"></i> ${e.toilet_amount||"-"} toilette</div>
    <div><i class="fas fa-car"></i> ${e.parking_lot_amount||"-"} cochera(s)</div>
    <div><i class="fas fa-bed"></i> ${e.suite_amount||"-"} dormitorio(s)</div>
    <div><i class="fas fa-calendar-alt"></i> ${e.age||"-"} a\xf1os</div>
    <div><i class="fas fa-compass"></i> ${e.orientation||"-"}</div>
  `,e.geo_lat&&e.geo_long&&(mapaEl.innerHTML=`
      <iframe
        src="https://www.google.com/maps?q=${e.geo_lat},${e.geo_long}&output=embed"
        width="100%" height="400" style="border:0;" allowfullscreen loading="lazy"
      ></iframe>
    `);let m=e.branch;if(m){let f=`${m.phone_country_code}${m.phone_area}${m.phone}`;descripcionEl.innerHTML+=`
      <div class="contacto-inmobiliaria" style="margin-top: 20px">
        <h3>Contacto Inmobiliaria</h3>
        <p><strong>${m.display_name}</strong></p>
        <p><i class="fas fa-map-marker-alt"></i> ${m.address}</p>
        <p><i class="fas fa-phone"></i> <a href="tel:${f}">${f}</a></p>
        <p><i class="fas fa-envelope"></i> <a href="mailto:${m.email}">${m.email}</a></p>
      </div>
    `}if(linkFormulario.href="https://docs.google.com/forms/d/e/1FAIpQLScPwRC1SL82-IPmpWedPcxj-guvqRl-gJj7fK3Ryi6RsHVxnw/viewform?usp=pp_url",e.videos&&e.videos.length>0){let g=e.videos[0],v=document.getElementById("video-propiedad");v&&(v.innerHTML=`
      <h3 style="margin-bottom: 15px;">Video de la propiedad</h3>
      <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
        <iframe src="${g.player_url}" frameborder="0" allowfullscreen
          style="position:absolute; top:0; left:0; width:100%; height:100%;">
        </iframe>
      </div>
    `)}}).catch(e=>{infoEl.innerHTML="<p>Error al cargar la propiedad.</p>",console.error(e)})}else infoEl.innerHTML="<p>Error: ID de propiedad no especificado.</p>";