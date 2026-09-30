/* =========================
   Copyright
   ========================= */
const copyright = document.getElementById("copyright");
if (copyright) {
  copyright.innerHTML =
    new Date().getFullYear() +
    " © Copyright NDB Propiedades. Todos los derechos reservados. Argentina, Buenos Aires.";
}

/* =========================
   Fade-in observer
   ========================= */
const animables = document.querySelectorAll(".fade-in");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  animables.forEach((el) => observer.observe(el));
} else {
  animables.forEach((el) => el.classList.add("visible"));
}

/* =========================
   Filtros de la galería
   ========================= */
const items = Array.from(document.querySelectorAll(".of-item"));
const filtros = document.querySelectorAll(".of-filter");

filtros.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filtro = btn.dataset.filter;

    filtros.forEach((b) => {
      const activo = b === btn;
      b.classList.toggle("is-active", activo);
      b.setAttribute("aria-pressed", activo);
    });

    items.forEach((item) => {
      const visible = filtro === "all" || item.dataset.cat === filtro;
      item.classList.toggle("is-hidden", !visible);
    });
  });
});

/* =========================
   Lightbox
   ========================= */
const lightbox = document.getElementById("lightbox");

if (lightbox && typeof lightbox.showModal === "function") {
  const lbImg = lightbox.querySelector(".of-lightbox__img");
  const lbTitle = lightbox.querySelector(".of-lightbox__title");
  const lbCount = lightbox.querySelector(".of-lightbox__count");
  const btnPrev = lightbox.querySelector(".of-lightbox__nav--prev");
  const btnNext = lightbox.querySelector(".of-lightbox__nav--next");
  const btnClose = lightbox.querySelector(".of-lightbox__close");

  let visibles = [];
  let actual = 0;

  const precargar = (i) => {
    const item = visibles[(i + visibles.length) % visibles.length];
    if (item) new Image().src = item.href;
  };

  const mostrar = (i) => {
    actual = (i + visibles.length) % visibles.length;
    const item = visibles[actual];
    const thumb = item.querySelector("img");

    lbImg.classList.add("is-loading");
    lbImg.onload = () => lbImg.classList.remove("is-loading");
    lbImg.src = item.href;
    lbImg.alt = thumb.alt;
    lbTitle.textContent = item.querySelector(".of-item__cap").textContent;
    lbCount.textContent = `${actual + 1} / ${visibles.length}`;

    precargar(actual + 1);
    precargar(actual - 1);
  };

  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      visibles = items.filter((it) => !it.classList.contains("is-hidden"));
      mostrar(visibles.indexOf(item));
      lightbox.showModal();
      document.body.style.overflow = "hidden";
    });
  });

  lightbox.addEventListener("close", () => {
    document.body.style.overflow = "";
    const item = visibles[actual];
    if (item) item.focus();
  });

  btnPrev.addEventListener("click", () => mostrar(actual - 1));
  btnNext.addEventListener("click", () => mostrar(actual + 1));
  btnClose.addEventListener("click", () => lightbox.close());

  // Cerrar al tocar el fondo
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") mostrar(actual - 1);
    if (e.key === "ArrowRight") mostrar(actual + 1);
  });

  // Swipe en mobile
  let inicioX = null;
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      inicioX = e.touches[0].clientX;
    },
    { passive: true },
  );
  lightbox.addEventListener("touchend", (e) => {
    if (inicioX === null) return;
    const delta = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(delta) > 50) mostrar(delta > 0 ? actual - 1 : actual + 1);
    inicioX = null;
  });
}
