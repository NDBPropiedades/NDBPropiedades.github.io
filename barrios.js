/* Landings de barrios: fotos con hover/deslizar, filtros y orden */

document.querySelectorAll(".z-card").forEach((card) => {
  const tira = card.querySelector(".z-card__fotos");
  const imagenes = [...tira.querySelectorAll("img")];
  const barras = [...card.querySelectorAll(".z-card__barras span")];
  if (imagenes.length < 2) return;

  let conMouse = false;

  const marcarBarra = (i) => {
    barras.forEach((b, n) => b.classList.toggle("activa", n === i));
  };

  const irA = (i) => {
    tira.scrollLeft = i * tira.clientWidth;
    marcarBarra(i);
  };

  // Solo cambia cuando la foto ya está descargada, para no mostrar un hueco
  const mostrar = (i) => {
    const img = imagenes[i];
    if (img.complete && img.naturalWidth) {
      irA(i);
      return;
    }
    img.addEventListener(
      "load",
      () => {
        if (conMouse) irA(i);
      },
      { once: true },
    );
  };

  card.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "mouse") return;
    conMouse = true;
    imagenes.forEach((img) => {
      img.loading = "eager";
    });
    mostrar(1);
  });

  card.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    conMouse = false;
    irA(0);
  });

  tira.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const zona = tira.getBoundingClientRect();
    const proporcion = (e.clientX - zona.left) / zona.width;
    mostrar(Math.min(imagenes.length - 1, Math.floor(proporcion * imagenes.length)));
  });

  // Celular: la tira se desliza con el dedo
  tira.addEventListener(
    "scroll",
    () => {
      if (!conMouse) marcarBarra(Math.round(tira.scrollLeft / tira.clientWidth));
    },
    { passive: true },
  );
});

(function iniciarFiltros() {
  const barra = document.querySelector("[data-barra]");
  const grilla = document.querySelector("[data-grilla]");
  if (!barra || !grilla) return;

  barra.hidden = false;

  const tarjetas = [...grilla.querySelectorAll(".z-card")];
  const chips = [...barra.querySelectorAll(".z-chip")];
  const orden = barra.querySelector("[data-orden]");
  const conteo = document.querySelector("[data-conteo]");
  const vacio = document.querySelector("[data-vacio]");
  const estado = { op: "", tipo: "" };

  const aplicar = () => {
    let visibles = 0;

    tarjetas.forEach((t) => {
      const ok =
        (!estado.op || t.dataset.op.split(" ").includes(estado.op)) &&
        (!estado.tipo || t.dataset.tipo === estado.tipo);
      t.hidden = !ok;
      if (ok) visibles += 1;
    });

    chips.forEach((c) => {
      const activo =
        c.dataset.grupo === "todas"
          ? !estado.op && !estado.tipo
          : estado[c.dataset.grupo] === c.dataset.valor;
      c.setAttribute("aria-pressed", String(activo));
    });

    conteo.textContent = visibles === 1 ? "1 propiedad" : `${visibles} propiedades`;
    vacio.hidden = visibles > 0;
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const { grupo, valor } = chip.dataset;

      if (grupo === "todas") {
        estado.op = "";
        estado.tipo = "";
      } else {
        estado[grupo] = estado[grupo] === valor ? "" : valor;
      }

      aplicar();
    });
  });

  const originales = [...tarjetas];

  orden.addEventListener("change", () => {
    const direccion = orden.value === "desc" ? -1 : 1;

    const ordenadas = !orden.value
      ? originales
      : [...tarjetas].sort((a, b) => {
          const pa = Number(a.dataset.precio);
          const pb = Number(b.dataset.precio);
          if (!pa !== !pb) return pa ? -1 : 1;
          if (a.dataset.moneda !== b.dataset.moneda) {
            return a.dataset.moneda === "USD" ? -1 : 1;
          }
          return direccion * (pa - pb);
        });

    ordenadas.forEach((t) => grilla.appendChild(t));
  });
})();
