/* Tasador NDB — herramienta interna de tasación.
 * Todo corre en el navegador: los datos y fotos se guardan en IndexedDB de este dispositivo.
 * El login es una barrera de acceso básica (sitio estático): no protege información sensible. */
(() => {
  "use strict";

  // ---------- Acceso ----------
  const CRED_HASH = "98bf7856ddfff26871b58c87fb47cbf008615c37460c99e710ebd7f44cc26a07";
  const AUTH_KEY = "ndb_tasador_auth";

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const isLogged = () => localStorage.getItem(AUTH_KEY) === CRED_HASH || sessionStorage.getItem(AUTH_KEY) === CRED_HASH;

  // ---------- Constantes de tasación ----------
  // Coeficiente de Heidecke según estado de conservación (escala 1 a 5).
  const ESTADOS = [
    { v: 1, h: 0, t: "Nuevo", d: "A estrenar, sin uso ni desgaste." },
    { v: 1.5, h: 0.0032, t: "Muy bueno", d: "Excelente mantenimiento, desgaste mínimo." },
    { v: 2, h: 0.0252, t: "Bueno", d: "Mantenimiento normal, solo detalles de pintura." },
    { v: 2.5, h: 0.0809, t: "Regular +", d: "Necesita pintura y arreglos menores." },
    { v: 3, h: 0.181, t: "Regular", d: "Reparaciones sencillas: pisos, sanitarios, revoques puntuales." },
    { v: 3.5, h: 0.332, t: "Regular −", d: "Reparaciones importantes en algunos sectores." },
    { v: 4, h: 0.526, t: "Malo", d: "Reparaciones importantes: techos, instalaciones, estructura menor." },
    { v: 4.5, h: 0.752, t: "Muy malo", d: "Requiere reciclaje integral." },
    { v: 5, h: 1, t: "Demolición", d: "Sin valor de edificio, vale el terreno." },
  ];
  const VIDA_UTIL = { casa: 70, depto: 80, ph: 70, local: 70, oficina: 80, terreno: 70 };
  const COSTO_M2 = { economica: 800, estandar: 1050, buena: 1300, muybuena: 1650, premium: 2100 };
  const CALIDAD_TXT = { economica: "Económica", estandar: "Estándar", buena: "Buena", muybuena: "Muy buena", premium: "Premium" };
  const TIPO_TXT = { casa: "Casa", depto: "Departamento", ph: "PH", terreno: "Terreno", local: "Local comercial", oficina: "Oficina" };
  // Peso del edificio sobre el valor total, para que la depreciación no castigue también al terreno.
  const PESO_EDIFICIO = 0.7;

  const AMENITIES = [
    { k: "pileta", t: "Pileta", i: "fa-swimming-pool", p: 5 },
    { k: "quincho", t: "Quincho", i: "fa-home", p: 2 },
    { k: "parrilla", t: "Parrilla", i: "fa-fire", p: 1 },
    { k: "jardin", t: "Jardín amplio", i: "fa-tree", p: 3 },
    { k: "cochera", t: "Cochera", i: "fa-car", p: 4 },
    { k: "esquina", t: "Lote en esquina", i: "fa-map-signs", p: 2 },
    { k: "vista", t: "Vista abierta / río", i: "fa-binoculars", p: 4 },
    { k: "amenities", t: "Amenities (SUM, gym)", i: "fa-dumbbell", p: 3 },
    { k: "seguridad", t: "Seguridad 24 h", i: "fa-shield-alt", p: 2 },
    { k: "calefaccion", t: "Losa radiante / central", i: "fa-thermometer-half", p: 2 },
    { k: "aire", t: "Aire acondicionado", i: "fa-snowflake", p: 1 },
    { k: "solar", t: "Paneles / termotanque solar", i: "fa-solar-panel", p: 1 },
    { k: "credito", t: "Apto crédito", i: "fa-university", p: 3 },
    { k: "profesional", t: "Apto profesional", i: "fa-briefcase", p: 1 },
    { k: "avenida", t: "Sobre avenida / ruido", i: "fa-volume-up", p: -5 },
    { k: "sinAscensor", t: "Piso alto sin ascensor", i: "fa-walking", p: -6 },
    { k: "ocupado", t: "Ocupado / inquilino", i: "fa-user-lock", p: -8 },
    { k: "documentacion", t: "Sucesión / docs pendientes", i: "fa-file-signature", p: -7 },
  ];

  // Valores orientativos USD/m² (venta) por localidad. Editables desde "Valores zona".
  const REFS_DEFAULT = {
    olivos: { n: "Olivos", casa: 1900, depto: 2600, ph: 1800, terreno: 900 },
    vicentelopez: { n: "Vicente López", casa: 2200, depto: 2900, ph: 2000, terreno: 1100 },
    lalucila: { n: "La Lucila", casa: 2300, depto: 2800, ph: 2000, terreno: 1100 },
    florida: { n: "Florida", casa: 1600, depto: 2200, ph: 1500, terreno: 700 },
    munro: { n: "Munro", casa: 1300, depto: 1800, ph: 1250, terreno: 550 },
    carapachay: { n: "Carapachay", casa: 1250, depto: 1600, ph: 1150, terreno: 480 },
    villamartelli: { n: "Villa Martelli", casa: 1350, depto: 1800, ph: 1250, terreno: 550 },
    villaadelina: { n: "Villa Adelina", casa: 1300, depto: 1700, ph: 1200, terreno: 500 },
    martinez: { n: "Martínez", casa: 2000, depto: 2700, ph: 1800, terreno: 900 },
    acassuso: { n: "Acassuso", casa: 2100, depto: 2700, ph: 1900, terreno: 950 },
    sanisidro: { n: "San Isidro", casa: 2200, depto: 2800, ph: 1900, terreno: 950 },
    beccar: { n: "Beccar", casa: 1800, depto: 2300, ph: 1600, terreno: 750 },
    nunez: { n: "Núñez", casa: 2400, depto: 3000, ph: 2100, terreno: 1300 },
    saavedra: { n: "Saavedra", casa: 1900, depto: 2500, ph: 1800, terreno: 1000 },
    belgrano: { n: "Belgrano", casa: 2600, depto: 3200, ph: 2200, terreno: 1500 },
    nordelta: { n: "Nordelta", casa: 2000, depto: 2700, ph: 1800, terreno: 600 },
  };
  const REFS_KEY = "ndb_tasador_refs";
  let REFS = loadRefs();
  function loadRefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(REFS_KEY) || "null");
      if (saved && typeof saved === "object") return { ...structuredClone(REFS_DEFAULT), ...saved };
    } catch (e) {}
    return structuredClone(REFS_DEFAULT);
  }
  const refColumn = (tipo) => (tipo === "casa" || tipo === "ph" || tipo === "terreno" ? tipo : "depto");

  // ---------- Estado ----------
  const DEFAULTS = {
    tipo: "casa", direccion: "", localidad: "olivos", localidadOtra: "", barrio: "", propietario: "", telefono: "",
    fechaVisita: "", barrioCerrado: false,
    terreno: "", frente: "", fondo: "", cubierta: "", semicubierta: "", descubierta: "", coefSemi: "0.5", coefDesc: "0.25",
    ambientes: "", dormitorios: "", banos: "", toilettes: "", cocheras: "", plantas: "1", piso: "",
    orientacion: "", disposicion: "", luminosidad: "",
    antiguedad: "", anioRefaccion: "", vidaUtil: "70", calidad: "estandar", estado: 2,
    descOferta: "10", baseStat: "promedio", ajusteSup: true,
    usarCosto: false, valorTerrenoM2: "", costoM2: String(COSTO_M2.estandar), complementarias: "", factorComerc: "1",
    pesoComparativo: "70",
    margenPublicacion: "7", descVentaRapida: "10", dolar: "", honorarios: "3", rentabilidad: "4", valorManual: "",
    fuertes: "", debiles: "", notas: "",
  };
  const newState = () => ({
    id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    creada: Date.now(),
    actualizada: Date.now(),
    f: { ...DEFAULTS, fechaVisita: new Date().toISOString().slice(0, 10) },
    amen: Object.fromEntries(AMENITIES.map((a) => [a.k, { on: false, p: a.p }])),
    comps: [],
    fotos: [],
  });
  let S = newState();
  let dirty = false;

  // ---------- Utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const num = (v) => {
    const n = parseFloat(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
  const usd = (v) => (v > 0 ? "USD " + nf0.format(v) : "—");
  const ars = (v) => (v > 0 ? "$ " + nf0.format(v) : "—");
  const m2 = (v) => (v > 0 ? nf1.format(v) + " m²" : "—");
  const pct = (v, d = 1) => (Number.isFinite(v) ? (v > 0 ? "+" : "") + v.toFixed(d).replace(".", ",") + "%" : "—");
  const round1000 = (v) => Math.round(v / 1000) * 1000;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const localidadNombre = (f) => (f.localidad === "otra" ? f.localidadOtra : REFS[f.localidad]?.n || "");

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------- IndexedDB ----------
  const DB_NAME = "ndb_tasador";
  let dbp = null;
  function db() {
    if (!dbp)
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore("tasaciones", { keyPath: "id" });
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    return dbp;
  }
  async function store(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction("tasaciones", mode);
      const req = fn(tx.objectStore("tasaciones"));
      tx.oncomplete = () => res(req?.result);
      tx.onerror = () => rej(tx.error);
    });
  }
  const dbPut = (o) => store("readwrite", (s) => s.put(o));
  const dbGet = (id) => store("readonly", (s) => s.get(id));
  const dbAll = () => store("readonly", (s) => s.getAll());
  const dbDel = (id) => store("readwrite", (s) => s.delete(id));

  // ---------- Cálculo ----------
  function depreciacion(edad, estado, vidaUtil) {
    const x = Math.min(Math.max(edad, 0) / Math.max(vidaUtil, 1), 1);
    const ross = (x + x * x) / 2;
    const h = (ESTADOS.find((e) => e.v === Number(estado)) || ESTADOS[2]).h;
    return Math.min(ross + (1 - ross) * h, 1);
  }

  function supHom(cub, semi, desc, f) {
    return num(cub) + num(semi) * num(f.coefSemi) + num(desc) * num(f.coefDesc);
  }

  function calc() {
    const f = S.f;
    const esTerreno = f.tipo === "terreno";
    const r = {};
    const anio = new Date().getFullYear();

    r.supHom = esTerreno ? num(f.terreno) : supHom(f.cubierta, f.semicubierta, f.descubierta, f);
    r.supTot = num(f.cubierta) + num(f.semicubierta) + num(f.descubierta);
    const plantas = Math.max(num(f.plantas), 1);
    r.fos = num(f.terreno) > 0 && num(f.cubierta) > 0 ? (num(f.cubierta) / plantas + num(f.semicubierta)) / num(f.terreno) : 0;

    // Edad efectiva: una refacción integral rejuvenece la mitad de la diferencia.
    const antig = num(f.antiguedad);
    const desdeRef = num(f.anioRefaccion) ? anio - num(f.anioRefaccion) : null;
    r.edad = desdeRef !== null && desdeRef >= 0 && desdeRef < antig ? (antig + desdeRef) / 2 : antig;
    r.vidaUtil = num(f.vidaUtil) || VIDA_UTIL[f.tipo];
    r.dep = esTerreno ? 0 : depreciacion(r.edad, f.estado, r.vidaUtil);

    // Comparables
    const descOferta = num(f.descOferta) / 100;
    const kSubj = 1 - PESO_EDIFICIO * r.dep;
    r.comps = S.comps.map((c) => {
      const s = esTerreno ? num(c.terreno) : supHom(c.cub, c.semi, c.desc, f);
      const precio = num(c.precio);
      if (!(s > 0 && precio > 0)) return { id: c.id, ok: false };
      const fOferta = c.tipo === "cierre" ? 1 : 1 - descOferta;
      const depC = esTerreno ? 0 : depreciacion(num(c.edad), c.estado || 2, r.vidaUtil);
      const fEdad = esTerreno ? 1 : kSubj / (1 - PESO_EDIFICIO * depC);
      const fSup = f.ajusteSup && r.supHom > 0 ? Math.pow(s / r.supHom, 0.1) : 1;
      const fUbic = num(c.ubic) || 1;
      const fOtros = 1 + num(c.otros) / 100;
      const bruto = precio / s;
      const ajustado = bruto * fOferta * fEdad * fSup * fUbic * fOtros;
      return { id: c.id, ok: true, incl: c.incl !== false, s, bruto, ajustado, fOferta, fEdad, fSup, fUbic, fOtros };
    });
    const vals = r.comps.filter((c) => c.ok && c.incl).map((c) => c.ajustado);
    r.n = vals.length;
    if (r.n) {
      const mean = vals.reduce((a, b) => a + b, 0) / r.n;
      const sorted = [...vals].sort((a, b) => a - b);
      const med = r.n % 2 ? sorted[(r.n - 1) / 2] : (sorted[r.n / 2 - 1] + sorted[r.n / 2]) / 2;
      const sd = r.n > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (r.n - 1)) : 0;
      Object.assign(r, { mean, med, sd, cv: mean ? (sd / mean) * 100 : 0, min: sorted[0], max: sorted[r.n - 1] });
      r.base = f.baseStat === "mediana" ? med : mean;
      r.fuente = "comparables";
      r.comps.forEach((c) => {
        if (c.ok && c.incl && r.n >= 3) c.outlier = Math.abs(c.ajustado - mean) > 1.5 * sd && sd > 0;
      });
    } else {
      const ref = REFS[f.localidad];
      const refM2 = ref ? num(ref[refColumn(f.tipo)]) : 0;
      if (refM2 > 0) {
        // La referencia de zona supone un inmueble en estado "bueno" de antigüedad media.
        const depRef = esTerreno ? 0 : depreciacion(r.vidaUtil * 0.3, 2, r.vidaUtil);
        r.base = refM2 * (esTerreno ? 1 : kSubj / (1 - PESO_EDIFICIO * depRef));
        r.refM2 = refM2;
        r.fuente = "referencia";
      }
    }

    // Extras
    r.extrasPct = AMENITIES.reduce((a, am) => a + (S.amen[am.k]?.on ? num(S.amen[am.k].p) : 0), 0);
    r.comparativo = r.base && r.supHom ? r.base * r.supHom * (1 + r.extrasPct / 100) : 0;

    // Costo de reposición
    if (f.usarCosto) {
      r.cTerreno = num(f.terreno) * num(f.valorTerrenoM2);
      r.cEdif = esTerreno ? 0 : r.supHom * num(f.costoM2) * (1 - r.dep) + num(f.complementarias);
      r.costo = (r.cTerreno + r.cEdif) * (num(f.factorComerc) || 1);
    }

    // Valor final
    const w = num(f.pesoComparativo) / 100;
    if (r.comparativo && r.costo) r.valorCalc = r.comparativo * w + r.costo * (1 - w);
    else r.valorCalc = r.comparativo || r.costo || 0;
    r.valor = num(f.valorManual) > 0 ? num(f.valorManual) : round1000(r.valorCalc);
    r.manual = num(f.valorManual) > 0;
    r.m2 = r.valor && r.supHom ? r.valor / r.supHom : 0;

    // Rango y confianza
    if (r.fuente === "comparables" && r.n >= 3 && r.cv < 10) r.conf = ["Alta", "#3ddc84"];
    else if (r.fuente === "comparables" && r.n >= 2 && r.cv < 20) r.conf = ["Media", "#ffc857"];
    else if (r.valor) r.conf = ["Baja", "#ff7b6b"];
    const spread = r.fuente === "comparables" && r.n >= 2 ? Math.min(Math.max(r.cv / 2, 4), 12) : 8;
    r.spread = spread;
    r.rMin = round1000(r.valor * (1 - spread / 100));
    r.rMax = round1000(r.valor * (1 + spread / 100));

    r.publicar = round1000(r.valor * (1 + num(f.margenPublicacion) / 100));
    r.rapida = round1000(r.valor * (1 - num(f.descVentaRapida) / 100));
    r.pesos = r.valor * num(f.dolar);
    r.honor = r.valor * (num(f.honorarios) / 100);
    r.alquiler = (r.valor * (num(f.rentabilidad) / 100)) / 12;
    return r;
  }

  // ---------- Render ----------
  let R = {};
  function render() {
    R = calc();
    const f = S.f;
    const set = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };
    set("outSupHom", m2(R.supHom));
    set("outSupTot", m2(R.supTot));
    set("outFos", R.fos ? Math.round(R.fos * 100) + "%" : "—");
    set("outEdad", f.antiguedad !== "" ? nf1.format(R.edad) + " años" : "—");
    set("outDep", (R.dep * 100).toFixed(1).replace(".", ",") + "%");
    set("outResid", Math.round((1 - R.dep) * 100) + "%");

    // Comparables: resultados por tarjeta
    R.comps.forEach((c) => {
      const out = document.querySelector(`.comp[data-id="${c.id}"] .comp-out`);
      if (!out) return;
      const card = out.closest(".comp");
      card.classList.toggle("off", c.ok && !c.incl);
      if (!c.ok) {
        out.innerHTML = "Cargá precio y superficie para calcular.";
        return;
      }
      const fx = (v) => v.toFixed(3).replace(".", ",");
      out.innerHTML =
        `<span>USD/m² ajustado <strong>${nf0.format(c.ajustado)}</strong></span>` +
        `<span>bruto ${nf0.format(c.bruto)} · ${m2(c.s)} hom.</span>` +
        `<span title="Oferta · Edad/estado · Superficie · Ubicación · Otros">factores ${fx(c.fOferta)} · ${fx(c.fEdad)} · ${fx(c.fSup)} · ${fx(c.fUbic)} · ${fx(c.fOtros)}</span>` +
        (c.outlier ? `<span class="outlier"><i class="fas fa-exclamation-triangle"></i> Se aleja mucho del resto</span>` : "");
    });
    const stats = $("#compStats");
    stats.innerHTML = R.n
      ? `<div><small>Promedio USD/m²</small><strong>${nf0.format(R.mean)}</strong></div>
         <div><small>Mediana USD/m²</small><strong>${nf0.format(R.med)}</strong></div>
         <div><small>Rango</small><strong>${nf0.format(R.min)} – ${nf0.format(R.max)}</strong></div>
         <div><small>Dispersión (CV)</small><strong style="color:${R.cv < 10 ? "var(--ok)" : R.cv < 20 ? "var(--warn)" : "var(--bad)"}">${nf1.format(R.cv)}%</strong></div>`
      : "";
    const callout = $("#refCallout");
    if (R.fuente === "referencia") {
      callout.hidden = false;
      callout.innerHTML = `<i class="fas fa-info-circle"></i> Sin comparables: se usa la <strong>referencia de zona</strong> (${nf0.format(R.refM2)} USD/m² para ${esc(TIPO_TXT[f.tipo])} en ${esc(localidadNombre(f))}), ajustada por estado y antigüedad. Sumá al menos 3 comparables para una tasación firme.`;
    } else if (!R.n && f.localidad === "otra") {
      callout.hidden = false;
      callout.innerHTML = `<i class="fas fa-info-circle"></i> No hay referencia para esta localidad: cargá comparables para obtener el valor.`;
    } else callout.hidden = true;

    // Costo
    set("outCTerreno", usd(R.cTerreno));
    set("outCEdif", usd(R.cEdif));
    set("outCosto", usd(R.costo));
    set("outCosto2", usd(R.costo));
    set("outPeso", f.pesoComparativo + "%");

    // Resultado
    set("outValor", R.valor ? usd(R.valor) : "USD —");
    set("outValorMobile", R.valor ? usd(R.valor) : "USD —");
    set("outRango", R.valor ? `Rango ${usd(R.rMin)} – ${nf0.format(R.rMax)}${R.manual ? " · valor manual" : ""}` : "Completá superficies y comparables");
    $("#outConf").innerHTML = R.conf
      ? `<span class="dot" style="background:${R.conf[1]}"></span> Confianza ${R.conf[0]} · ${R.fuente === "comparables" ? R.n + " comparable" + (R.n > 1 ? "s" : "") : "referencia de zona"}`
      : "";
    set("outM2", R.m2 ? "USD " + nf0.format(R.m2) : "—");
    set("outComparativo", usd(R.comparativo));
    set("outExtras", R.extrasPct ? pct(R.extrasPct, 0) : "—");
    set("outPublicar", usd(R.publicar));
    set("outCierre", usd(R.valor));
    set("outRapida", usd(R.rapida));
    set("outPesos", ars(R.pesos));
    set("outHonor", usd(R.honor));
    set("outAlquiler", R.alquiler ? usd(R.alquiler) + (num(f.dolar) ? ` (${ars(R.alquiler * num(f.dolar))})` : "") : "—");

    applyVisibility();
  }

  function applyVisibility() {
    const test = (expr) => {
      const [k, vals] = expr.split("=");
      const v = S.f[k];
      const sv = typeof v === "boolean" ? (v ? "1" : "0") : String(v);
      return vals.split("|").includes(sv);
    };
    $$("[data-show]").forEach((el) => (el.hidden = !test(el.dataset.show)));
    $$("[data-hide]").forEach((el) => (el.hidden = test(el.dataset.hide)));
  }

  // ---------- Formulario ----------
  function fillForm() {
    $$("[data-f]").forEach((el) => {
      const v = S.f[el.dataset.f];
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = v ?? "";
    });
    renderEstado();
    renderAmenities();
    renderComps();
    renderFotos();
    updateMap(true);
    render();
  }

  function onFieldChange(e) {
    const el = e.target.closest("[data-f]");
    if (!el) return;
    const k = el.dataset.f;
    const prevTipo = S.f.tipo;
    S.f[k] = el.type === "checkbox" ? el.checked : el.value;
    if (k === "tipo" && prevTipo !== S.f.tipo) {
      S.f.vidaUtil = String(VIDA_UTIL[S.f.tipo]);
      $('[data-f="vidaUtil"]').value = S.f.vidaUtil;
      renderComps();
    }
    if (k === "calidad") {
      S.f.costoM2 = String(COSTO_M2[S.f.calidad]);
      $('[data-f="costoM2"]').value = S.f.costoM2;
    }
    if ((k === "localidad" || k === "usarCosto") && S.f.usarCosto && !num(S.f.valorTerrenoM2)) {
      const ref = REFS[S.f.localidad];
      if (ref) {
        S.f.valorTerrenoM2 = String(ref.terreno);
        $('[data-f="valorTerrenoM2"]').value = S.f.valorTerrenoM2;
      }
    }
    if (k === "direccion" || k === "localidad" || k === "localidadOtra") updateMap();
    changed();
  }

  function changed() {
    dirty = true;
    $("#saveStatus").textContent = "Cambios sin guardar…";
    render();
    clearTimeout(changed._t);
    changed._t = setTimeout(() => save(true), 1200);
  }

  function updateMap(now) {
    clearTimeout(updateMap._t);
    updateMap._t = setTimeout(
      () => {
        const dir = S.f.direccion.trim();
        const wrap = $("#mapWrap");
        if (dir.length < 4) {
          wrap.hidden = true;
          return;
        }
        const q = [dir, localidadNombre(S.f), "Buenos Aires, Argentina"].filter(Boolean).join(", ");
        const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
        const fr = $("#mapFrame");
        if (fr.getAttribute("src") !== src) fr.setAttribute("src", src);
        wrap.hidden = false;
      },
      now ? 0 : 900,
    );
  }

  function renderEstado() {
    const cont = $("#estadoScale");
    cont.innerHTML = ESTADOS.map(
      (e) => `<button type="button" role="radio" aria-checked="${Number(S.f.estado) === e.v}" data-estado="${e.v}" title="${esc(e.d)}"><b>${String(e.v).replace(".", ",")}</b><small>${e.t}</small></button>`,
    ).join("");
    let desc = cont.nextElementSibling;
    if (!desc || !desc.classList.contains("estado-desc")) {
      desc = document.createElement("p");
      desc.className = "estado-desc";
      cont.after(desc);
    }
    const cur = ESTADOS.find((e) => e.v === Number(S.f.estado));
    desc.innerHTML = cur ? `<strong>${cur.t}:</strong> ${cur.d}` : "";
  }

  function renderAmenities() {
    $("#amenGrid").innerHTML = AMENITIES.map((a) => {
      const st = S.amen[a.k] || { on: false, p: a.p };
      return `<div class="amen ${st.on ? "on" : ""}" data-amen="${a.k}">
        <label><input type="checkbox" ${st.on ? "checked" : ""} data-amen-on /> <i class="fas ${a.i}"></i> ${a.t}</label>
        <input type="number" step="0.5" value="${esc(st.p)}" data-amen-p aria-label="Ajuste % ${a.t}" /><span class="pct">%</span>
      </div>`;
    }).join("");
  }

  // ---------- Comparables ----------
  const compEstadoOpts = (sel) => ESTADOS.map((e) => `<option value="${e.v}" ${Number(sel) === e.v ? "selected" : ""}>${String(e.v).replace(".", ",")} · ${e.t}</option>`).join("");
  function compHTML(c, i) {
    const inp = (k, label, extra = "") =>
      `<label class="fld"><span>${label}</span><input type="number" step="any" min="0" inputmode="decimal" data-c="${k}" value="${esc(c[k] ?? "")}" ${extra}/></label>`;
    return `<div class="comp" data-id="${c.id}">
      <div class="comp-head">
        <strong>#${i + 1}</strong>
        <label class="chk" style="padding:0"><input type="checkbox" data-c="incl" ${c.incl !== false ? "checked" : ""}/> Incluir</label>
        <span class="spacer"></span>
        ${c.link ? `<a class="btn btn-icon" href="${esc(c.link)}" target="_blank" rel="noopener" title="Abrir aviso"><i class="fas fa-external-link-alt"></i></a>` : ""}
        <button type="button" class="btn btn-icon btn-danger" data-del-comp title="Eliminar"><i class="fas fa-trash"></i></button>
      </div>
      <div class="grid">
        <label class="fld span-2"><span>Dirección / descripción</span><input type="text" data-c="dir" value="${esc(c.dir)}" placeholder="Ej: Corrientes 1200"/></label>
        <label class="fld span-2"><span>Link del aviso</span><input type="url" data-c="link" value="${esc(c.link)}" placeholder="https://"/></label>
        <label class="fld"><span>Tipo de dato</span><select data-c="tipo"><option value="oferta" ${c.tipo !== "cierre" ? "selected" : ""}>Oferta publicada</option><option value="cierre" ${c.tipo === "cierre" ? "selected" : ""}>Venta cerrada</option></select></label>
        ${inp("precio", "Precio USD")}
        ${S.f.tipo === "terreno" ? "" : inp("cub", "Cubierta m²") + inp("semi", "Semicub. m²") + inp("desc", "Descub. m²")}
        ${inp("terreno", "Terreno m²")}
        ${S.f.tipo === "terreno" ? "" : inp("edad", "Antigüedad") + `<label class="fld"><span>Estado</span><select data-c="estado">${compEstadoOpts(c.estado || 2)}</select></label>`}
        <label class="fld"><span title="Mayor a 1 si la ubicación de la propiedad tasada es mejor que la del comparable">Coef. ubicación</span><input type="number" step="0.01" min="0.5" max="1.5" data-c="ubic" value="${esc(c.ubic ?? "1")}"/></label>
        <label class="fld"><span title="Ajuste por diferencias: amenities, vista, cochera, calidad…">Otros ajustes %</span><input type="number" step="0.5" data-c="otros" value="${esc(c.otros ?? "")}" placeholder="0"/></label>
      </div>
      <div class="comp-out"></div>
    </div>`;
  }
  function renderComps() {
    const list = $("#compList");
    list.innerHTML = S.comps.length
      ? S.comps.map(compHTML).join("")
      : `<div class="empty"><i class="fas fa-search-location"></i> Agregá propiedades similares de la zona (Zonaprop, Argenprop, cierres propios). Con 3 a 6 comparables la tasación queda firme.</div>`;
  }
  function addComp() {
    S.comps.push({ id: uid(), dir: "", link: "", tipo: "oferta", precio: "", cub: "", semi: "", desc: "", terreno: "", edad: "", estado: 2, ubic: "1", otros: "", incl: true });
    renderComps();
    changed();
    const last = $("#compList .comp:last-child input[data-c=dir]");
    last?.focus();
    last?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---------- Fotos ----------
  async function compress(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      const MAX = 1600;
      const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.82);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function addFotos(files) {
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    toast(`Procesando ${imgs.length} foto${imgs.length > 1 ? "s" : ""}…`);
    for (const file of imgs) {
      try {
        S.fotos.push({ id: uid(), data: await compress(file), cap: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") });
      } catch (e) {
        toast("No se pudo leer " + file.name);
      }
    }
    renderFotos();
    changed();
  }
  function renderFotos() {
    $("#fotoGrid").innerHTML = S.fotos
      .map(
        (p, i) => `<div class="foto" data-foto="${p.id}">
        <img src="${p.data}" alt="${esc(p.cap)}" loading="lazy"/>
        ${i === 0 ? `<span class="badge">PORTADA</span>` : ""}
        <div class="foto-tools">
          ${i > 0 ? `<button type="button" data-foto-act="up" title="Mover antes / hacer portada"><i class="fas fa-arrow-left"></i></button>` : ""}
          <button type="button" data-foto-act="del" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
        <input type="text" value="${esc(p.cap)}" placeholder="Descripción (living, cocina…)" data-foto-cap/>
      </div>`,
      )
      .join("");
  }

  // ---------- Guardado ----------
  async function save(silent) {
    S.actualizada = Date.now();
    S.resumen = { valor: R.valor || 0, titulo: tituloTasacion() };
    try {
      await dbPut(structuredClone(S));
      localStorage.setItem("ndb_tasador_last", S.id);
      dirty = false;
      $("#saveStatus").textContent = "Guardado " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      if (!silent) toast("Tasación guardada");
    } catch (e) {
      console.error(e);
      $("#saveStatus").textContent = "Error al guardar";
      toast("No se pudo guardar (¿espacio lleno?)");
    }
  }
  const tituloTasacion = (st = S) => {
    const loc = st.f.localidad === "otra" ? st.f.localidadOtra : REFS[st.f.localidad]?.n;
    return [st.f.direccion || "Sin dirección", loc].filter(Boolean).join(", ");
  };
  async function load(id) {
    const t = await dbGet(id);
    if (!t) return false;
    S = normalize(t);
    fillForm();
    localStorage.setItem("ndb_tasador_last", S.id);
    dirty = false;
    $("#saveStatus").textContent = "Abierta: " + tituloTasacion();
    return true;
  }
  function normalize(t) {
    const base = newState();
    return {
      ...base,
      ...t,
      f: { ...base.f, ...t.f },
      amen: { ...base.amen, ...(t.amen || {}) },
      comps: t.comps || [],
      fotos: t.fotos || [],
    };
  }
  async function nueva() {
    if (dirty) await save(true);
    S = newState();
    fillForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
    $("#saveStatus").textContent = "Nueva tasación";
    $('[data-f="direccion"]').focus();
  }

  // ---------- Lista ----------
  async function openLista() {
    if (dirty) await save(true);
    $("#listaBuscar").value = "";
    await renderLista();
    $("#dlgLista").showModal();
  }
  async function renderLista() {
    const q = $("#listaBuscar").value.trim().toLowerCase();
    const all = (await dbAll()).sort((a, b) => b.actualizada - a.actualizada);
    const items = all.filter((t) => !q || [tituloTasacion(t), t.f.propietario, t.f.barrio].join(" ").toLowerCase().includes(q));
    $("#listaItems").innerHTML = items.length
      ? items
          .map(
            (t) => `<div class="lista-item ${t.id === S.id ? "actual" : ""}" data-open="${t.id}">
          ${t.fotos?.[0] ? `<img src="${t.fotos[0].data}" alt=""/>` : `<span class="ph"><i class="fas fa-home"></i></span>`}
          <div class="info"><strong>${esc(tituloTasacion(t))}</strong>
          <small>${esc(TIPO_TXT[t.f.tipo] || "")} · ${new Date(t.actualizada).toLocaleDateString("es-AR")}${t.f.propietario ? " · " + esc(t.f.propietario) : ""}</small></div>
          <span class="val">${t.resumen?.valor ? usd(t.resumen.valor) : ""}</span>
          <button type="button" class="btn btn-icon" data-dup="${t.id}" title="Duplicar"><i class="fas fa-copy"></i></button>
          <button type="button" class="btn btn-icon btn-danger" data-del="${t.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`,
          )
          .join("")
      : `<div class="empty">${q ? "Sin resultados." : "Todavía no hay tasaciones guardadas."}</div>`;
  }

  // ---------- Referencias ----------
  function renderRefs() {
    const cols = [["casa", "Casa"], ["depto", "Depto / oficina / local"], ["ph", "PH"], ["terreno", "Terreno"]];
    $("#refsTable").innerHTML =
      `<thead><tr><th>Localidad</th>${cols.map((c) => `<th>${c[1]}</th>`).join("")}</tr></thead><tbody>` +
      Object.entries(REFS)
        .map(([k, r]) => `<tr><td>${esc(r.n)}</td>${cols.map(([c]) => `<td><input type="number" min="0" step="50" data-ref="${k}" data-col="${c}" value="${esc(r[c])}"/></td>`).join("")}</tr>`)
        .join("") +
      "</tbody>";
  }
  function fillLocalidades() {
    $("#selLocalidad").innerHTML =
      Object.entries(REFS)
        .map(([k, r]) => `<option value="${k}">${esc(r.n)}</option>`)
        .join("") + `<option value="otra">Otra…</option>`;
    $("#selLocalidad").value = S.f.localidad;
  }

  // ---------- Informe ----------
  function informeHTML() {
    const f = S.f;
    const r = R;
    const esTerreno = f.tipo === "terreno";
    const hoy = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    const row = (label, val) => (val !== "" && val != null && val !== "—" && val !== 0 ? `<div><span>${label}</span><strong>${esc(val)}</strong></div>` : "");
    const amen = AMENITIES.filter((a) => S.amen[a.k]?.on && a.p > 0).map((a) => `<span>${esc(a.t)}</span>`).join("");
    const estado = ESTADOS.find((e) => e.v === Number(f.estado));
    const portada = S.fotos[0];
    const comps = S.comps
      .map((c, i) => ({ c, o: r.comps[i] }))
      .filter(({ o }) => o && o.ok && o.incl);

    return `
    <header class="inf-head">
      <img src="assets/img/img/Nicolas De Brasi - Logo Positivo RGB.png" alt="NDB Propiedades"/>
      <div class="meta">Informe de tasación<br/>${hoy}<br/>Rioja 3000, Olivos · info@ndbpropiedades.com.ar</div>
    </header>
    <h1 class="inf-title">${esc(f.direccion || "Propiedad")}</h1>
    <p class="inf-sub">${esc(TIPO_TXT[f.tipo])} · ${esc([f.barrio, localidadNombre(f)].filter(Boolean).join(", "))}${f.barrioCerrado ? " · Barrio cerrado" : ""}${f.propietario ? " · Propietario: " + esc(f.propietario) : ""}</p>

    <div class="inf-hero ${portada ? "" : "solo"}">
      ${portada ? `<img src="${portada.data}" alt="${esc(portada.cap)}"/>` : ""}
      <div class="inf-valor">
        <small>Valor de mercado estimado</small>
        <strong>${usd(r.valor)}</strong>
        <span>Rango: ${usd(r.rMin)} – ${nf0.format(r.rMax)}</span>
        ${r.m2 ? `<span>${nf0.format(r.m2)} USD/m² homogeneizado</span>` : ""}
      </div>
    </div>

    <h3>Superficies</h3>
    <div class="inf-dl">
      ${row("Terreno", m2(num(f.terreno)))}
      ${row("Frente × fondo", num(f.frente) && num(f.fondo) ? `${nf1.format(num(f.frente))} × ${nf1.format(num(f.fondo))} m` : "")}
      ${esTerreno ? "" : row("Cubierta", m2(num(f.cubierta))) + row("Semicubierta", m2(num(f.semicubierta))) + row("Descubierta", m2(num(f.descubierta)))}
      ${row("Homogeneizada", m2(r.supHom))}
    </div>

    ${
      esTerreno
        ? ""
        : `<h3>Características</h3>
    <div class="inf-dl">
      ${row("Ambientes", f.ambientes)}${row("Dormitorios", f.dormitorios)}${row("Baños", f.banos)}${row("Toilettes", f.toilettes)}
      ${row("Cocheras", f.cocheras)}${row("Plantas", f.plantas)}${row("Piso", f.piso)}${row("Orientación", f.orientacion)}
      ${row("Disposición", f.disposicion)}${row("Luminosidad", f.luminosidad)}${row("Antigüedad", f.antiguedad !== "" ? f.antiguedad + " años" : "")}
      ${row("Refacción", f.anioRefaccion)}${row("Calidad", CALIDAD_TXT[f.calidad])}${row("Estado", estado ? `${estado.t} (${String(estado.v).replace(".", ",")})` : "")}
    </div>`
    }
    ${amen ? `<h3>Destacados</h3><div class="inf-tags">${amen}</div>` : ""}

    <h3>Estrategia de precio sugerida</h3>
    <div class="inf-tiers">
      <div><small>Precio de publicación</small><strong>${usd(r.publicar)}</strong></div>
      <div class="hl"><small>Valor de cierre esperado</small><strong>${usd(r.valor)}</strong></div>
      <div><small>Venta rápida</small><strong>${usd(r.rapida)}</strong></div>
    </div>

    ${
      comps.length
        ? `<h3>Comparables de mercado</h3>
    <table class="inf-table"><thead><tr><th>Propiedad</th><th>Tipo</th><th>Precio</th><th>Sup. hom.</th><th>USD/m²</th><th>USD/m² ajust.</th></tr></thead><tbody>
    ${comps.map(({ c, o }) => `<tr><td>${esc(c.dir || "—")}</td><td>${c.tipo === "cierre" ? "Cierre" : "Oferta"}</td><td>${usd(num(c.precio))}</td><td>${m2(o.s)}</td><td>${nf0.format(o.bruto)}</td><td><strong>${nf0.format(o.ajustado)}</strong></td></tr>`).join("")}
    </tbody></table>
    <p class="inf-legal">Valores homogeneizados por negociación (${esc(f.descOferta)}% sobre ofertas), antigüedad y estado (Ross-Heidecke), superficie, ubicación y otras diferencias. ${f.baseStat === "mediana" ? "Mediana" : "Promedio"}: ${nf0.format(r.base)} USD/m².</p>`
        : ""
    }

    <h3>Metodología</h3>
    <p>${
      r.fuente === "comparables"
        ? `Método comparativo de mercado sobre ${r.n} antecedente${r.n > 1 ? "s" : ""} homogeneizado${r.n > 1 ? "s" : ""}`
        : "Valores de referencia de la zona"
    }${r.costo ? `, ponderado ${f.pesoComparativo}% con el método del costo de reposición (${usd(r.costo)})` : ""}. Superficies homogeneizadas: cubierta 100%, semicubierta ${Math.round(num(f.coefSemi) * 100)}%, descubierta ${Math.round(num(f.coefDesc) * 100)}%.${
      r.extrasPct ? ` Ajuste por características particulares: ${pct(r.extrasPct, 0)}.` : ""
    }</p>

    ${f.fuertes ? `<h3>Puntos fuertes</h3><p class="inf-text">${esc(f.fuertes)}</p>` : ""}
    ${f.debiles ? `<h3>A considerar</h3><p class="inf-text">${esc(f.debiles)}</p>` : ""}

    ${
      S.fotos.length > 1
        ? `<h3>Relevamiento fotográfico</h3><div class="inf-fotos">${S.fotos
            .slice(1)
            .map((p) => `<figure><img src="${p.data}" alt="${esc(p.cap)}"/>${p.cap ? `<figcaption>${esc(p.cap)}</figcaption>` : ""}</figure>`)
            .join("")}</div>`
        : ""
    }

    <div class="inf-firma"><div></div>Nicolás De Brasi<br/><small>NDB Propiedades</small></div>
    <p class="inf-legal">La presente tasación es una estimación del valor de mercado a la fecha, basada en la inspección del inmueble y en la información de mercado disponible. No constituye una tasación oficial ni garantiza el precio final de la operación. Validez sugerida: 90 días.</p>
    <footer class="inf-foot"><span>NDB Propiedades · ndbpropiedades.com.ar</span><span>${hoy}</span></footer>`;
  }
  function openInforme() {
    render();
    if (!R.valor) {
      toast("Completá superficies y comparables para obtener un valor");
      return;
    }
    $("#informe").innerHTML = informeHTML();
    $("#informeWrap").hidden = false;
    document.body.style.overflow = "hidden";
    $("#informeWrap").scrollTop = 0;
  }
  function closeInforme() {
    $("#informeWrap").hidden = true;
    document.body.style.overflow = "";
  }

  function whatsapp() {
    render();
    if (!R.valor) return toast("Todavía no hay un valor calculado");
    const f = S.f;
    const lines = [
      `*Tasación NDB Propiedades*`,
      `${TIPO_TXT[f.tipo]} — ${tituloTasacion()}`,
      R.supHom ? `Superficie homogeneizada: ${m2(R.supHom)}` : "",
      num(f.terreno) ? `Terreno: ${m2(num(f.terreno))}` : "",
      ``,
      `Valor de mercado: *${usd(R.valor)}*`,
      `Rango: ${usd(R.rMin)} – ${nf0.format(R.rMax)}`,
      `Publicar en: ${usd(R.publicar)}`,
      `Venta rápida: ${usd(R.rapida)}`,
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "");
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  }

  // ---------- Eventos ----------
  function bind() {
    const col = $(".layout");
    col.addEventListener("input", (e) => {
      if (e.target.matches("[data-f]")) onFieldChange(e);
      else if (e.target.matches("[data-c]")) onCompInput(e);
      else if (e.target.matches("[data-amen-p]")) {
        const k = e.target.closest("[data-amen]").dataset.amen;
        S.amen[k].p = e.target.value;
        changed();
      } else if (e.target.matches("[data-foto-cap]")) {
        const p = S.fotos.find((x) => x.id === e.target.closest("[data-foto]").dataset.foto);
        if (p) p.cap = e.target.value;
        changed();
      }
    });
    col.addEventListener("change", (e) => {
      if (e.target.matches("select[data-f], input[type=checkbox][data-f]")) onFieldChange(e);
      else if (e.target.matches("[data-c]")) onCompInput(e);
      else if (e.target.matches("[data-amen-on]")) {
        const box = e.target.closest("[data-amen]");
        S.amen[box.dataset.amen].on = e.target.checked;
        box.classList.toggle("on", e.target.checked);
        changed();
      }
    });
    col.addEventListener("click", (e) => {
      const est = e.target.closest("[data-estado]");
      if (est) {
        S.f.estado = Number(est.dataset.estado);
        renderEstado();
        changed();
        return;
      }
      if (e.target.closest("[data-del-comp]")) {
        const id = e.target.closest(".comp").dataset.id;
        S.comps = S.comps.filter((c) => c.id !== id);
        renderComps();
        changed();
        return;
      }
      const act = e.target.closest("[data-foto-act]");
      if (act) {
        const id = act.closest("[data-foto]").dataset.foto;
        const i = S.fotos.findIndex((p) => p.id === id);
        if (act.dataset.fotoAct === "del") {
          if (!confirm("¿Eliminar esta foto?")) return;
          S.fotos.splice(i, 1);
        } else if (i > 0) [S.fotos[i - 1], S.fotos[i]] = [S.fotos[i], S.fotos[i - 1]];
        renderFotos();
        changed();
      }
    });

    $("#btnAddComp").addEventListener("click", addComp);
    $("#btnCalcDesc").addEventListener("click", () => {
      const f = S.f;
      const huella = num(f.cubierta) / Math.max(num(f.plantas), 1) + num(f.semicubierta);
      const libre = num(f.terreno) - huella;
      if (!num(f.terreno) || libre <= 0) return toast("Cargá terreno, cubierta y plantas primero");
      f.descubierta = String(Math.round(libre));
      $('[data-f="descubierta"]').value = f.descubierta;
      changed();
      toast(`Descubierta: ${f.descubierta} m² (terreno − huella en planta baja)`);
    });

    // Fotos
    const dz = $("#dropzone");
    $("#fotoInput").addEventListener("change", (e) => {
      addFotos(e.target.files);
      e.target.value = "";
    });
    ["dragenter", "dragover"].forEach((ev) =>
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        dz.classList.add("drag");
      }),
    );
    ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, () => dz.classList.remove("drag")));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      addFotos(e.dataTransfer.files);
    });
    document.addEventListener("paste", (e) => {
      if (e.clipboardData?.files?.length && !$("#app").hidden) addFotos(e.clipboardData.files);
    });

    // Topbar y acciones
    $("#btnNueva").addEventListener("click", nueva);
    $("#btnLista").addEventListener("click", openLista);
    $("#btnGuardar").addEventListener("click", () => save(false));
    $("#btnInforme").addEventListener("click", openInforme);
    $("#btnInforme2").addEventListener("click", openInforme);
    $("#btnWa").addEventListener("click", whatsapp);
    $("#btnCerrarInforme").addEventListener("click", closeInforme);
    $("#btnImprimir").addEventListener("click", () => {
      const prev = document.title;
      document.title = "Tasación - " + tituloTasacion();
      window.print();
      document.title = prev;
    });
    $("#btnSalir").addEventListener("click", async () => {
      if (dirty) await save(true);
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_KEY);
      location.reload();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("#app").hidden) {
        e.preventDefault();
        save(false);
      }
      if (e.key === "Escape" && !$("#informeWrap").hidden) closeInforme();
    });
    window.addEventListener("beforeunload", () => {
      if (dirty) save(true);
    });

    // Diálogos
    $$("dialog").forEach((d) => {
      d.addEventListener("click", (e) => {
        if (e.target === d || e.target.closest("[data-close]")) d.close();
      });
    });
    $("#listaBuscar").addEventListener("input", renderLista);
    $("#listaItems").addEventListener("click", async (e) => {
      const del = e.target.closest("[data-del]");
      const dup = e.target.closest("[data-dup]");
      if (del) {
        e.stopPropagation();
        if (!confirm("¿Eliminar esta tasación? No se puede deshacer.")) return;
        await dbDel(del.dataset.del);
        if (del.dataset.del === S.id) {
          S = newState();
          dirty = false;
          fillForm();
        }
        renderLista();
        return;
      }
      if (dup) {
        e.stopPropagation();
        const t = await dbGet(dup.dataset.dup);
        const copy = normalize({ ...structuredClone(t), id: newState().id, creada: Date.now(), actualizada: Date.now() });
        copy.f.direccion = (copy.f.direccion || "") + " (copia)";
        await dbPut(copy);
        renderLista();
        toast("Tasación duplicada");
        return;
      }
      const open = e.target.closest("[data-open]");
      if (open) {
        await load(open.dataset.open);
        $("#dlgLista").close();
        window.scrollTo({ top: 0 });
      }
    });
    $("#btnExport").addEventListener("click", async () => {
      const data = JSON.stringify({ app: "tasador-ndb", v: 1, refs: REFS, tasaciones: await dbAll() });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      a.download = `tasaciones-ndb-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $("#importInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.app !== "tasador-ndb" || !Array.isArray(data.tasaciones)) throw new Error("formato");
        for (const t of data.tasaciones) await dbPut(normalize(t));
        if (data.refs) {
          REFS = { ...REFS, ...data.refs };
          localStorage.setItem(REFS_KEY, JSON.stringify(REFS));
          fillLocalidades();
        }
        renderLista();
        toast(`${data.tasaciones.length} tasaciones importadas`);
      } catch (err) {
        toast("El archivo no es un backup válido del tasador");
      }
    });

    $("#btnRefs").addEventListener("click", () => {
      renderRefs();
      $("#dlgRefs").showModal();
    });
    $("#refsTable").addEventListener("input", (e) => {
      const el = e.target;
      if (!el.dataset.ref) return;
      REFS[el.dataset.ref][el.dataset.col] = num(el.value);
      localStorage.setItem(REFS_KEY, JSON.stringify(REFS));
      render();
    });
    $("#btnRefsReset").addEventListener("click", () => {
      if (!confirm("¿Restaurar los valores de referencia iniciales?")) return;
      REFS = structuredClone(REFS_DEFAULT);
      localStorage.removeItem(REFS_KEY);
      renderRefs();
      render();
    });
  }

  function onCompInput(e) {
    const el = e.target;
    const card = el.closest(".comp");
    const c = S.comps.find((x) => x.id === card.dataset.id);
    if (!c) return;
    const k = el.dataset.c;
    c[k] = el.type === "checkbox" ? el.checked : k === "estado" ? Number(el.value) : el.value;
    if (k === "link" && e.type === "change") renderComps();
    changed();
  }

  // ---------- Inicio ----------
  async function startApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    fillLocalidades();
    bind();
    const last = localStorage.getItem("ndb_tasador_last");
    let ok = false;
    if (last) ok = await load(last).catch(() => false);
    if (!ok) fillForm();
  }

  function startLogin() {
    $("#login").hidden = false;
    const form = $("#loginForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#loginEmail").value.trim().toLowerCase();
      const pass = $("#loginPass").value;
      const h = await sha256(email + ":" + pass);
      if (h === CRED_HASH) {
        ($("#loginRemember").checked ? localStorage : sessionStorage).setItem(AUTH_KEY, h);
        startApp();
      } else {
        $("#loginError").hidden = false;
        form.classList.remove("shake");
        void form.offsetWidth;
        form.classList.add("shake");
        $("#loginPass").select();
      }
    });
    $("#loginEmail").focus();
  }

  if (isLogged()) startApp();
  else startLogin();
})();
