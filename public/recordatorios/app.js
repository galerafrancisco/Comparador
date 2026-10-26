import { interpretar, TIPOS, fechaISO, sumarDias } from "./parser.js";
import { AREAS_INICIALES, LUGARES_INICIALES, CHECKINS_INICIALES, MOMENTOS, REPETICIONES } from "./datos.js";

const CLAVE = "recordatorios.v1";
const APP_URL = location.origin + "/recordatorios";

// ---------- Estado ----------

let S = cargar();
let vista = "hoy";
let detalle = null; // { tipo: "lugar" | "area", id }
let deshacer = null;
let repaso = null;

function estadoInicial() {
  return {
    version: 1,
    tasks: [],
    areas: structuredClone(AREAS_INICIALES),
    places: structuredClone(LUGARES_INICIALES),
    settings: {
      checkins: structuredClone(CHECKINS_INICIALES),
      checkinsHechos: { fecha: "", ids: [] },
      avisados: { fecha: "", claves: [] },
      autoRepaso: true,
      ocultarConsejo: false,
    },
  };
}

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return { ...estadoInicial(), ...JSON.parse(raw) };
  } catch {
    // sin almacenamiento disponible: se trabaja en memoria
  }
  return estadoInicial();
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(S));
  } catch {
    toast("No se pudo guardar en este navegador");
  }
}

function instantanea() {
  deshacer = JSON.stringify(S.tasks);
}

function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Utilidades de fecha ----------

const hoyISO = () => fechaISO(new Date());
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function aFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diasHasta(iso) {
  const hoy = aFecha(hoyISO());
  return Math.round((aFecha(iso) - hoy) / 86400000);
}

function etiquetaFecha(iso) {
  const n = diasHasta(iso);
  const d = aFecha(iso);
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  if (n === -1) return "Ayer";
  if (n < 0) return `Hace ${-n} días`;
  if (n < 7) return DIAS_LARGOS[d.getDay()];
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

function minutosAhora() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function aMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function siguienteFecha(t) {
  const base = t.due && diasHasta(t.due) >= 0 ? aFecha(t.due) : aFecha(hoyISO());
  if (t.repeat === "diario") return fechaISO(sumarDias(base, 1));
  if (t.repeat === "semanal") return fechaISO(sumarDias(base, 7));
  if (t.repeat === "laborables") {
    let d = sumarDias(base, 1);
    while (d.getDay() === 0 || d.getDay() === 6) d = sumarDias(d, 1);
    return fechaISO(d);
  }
  if (t.repeat === "mensual") {
    const dia = t.due ? aFecha(t.due).getDate() : base.getDate();
    const ultimo = new Date(base.getFullYear(), base.getMonth() + 2, 0).getDate();
    return fechaISO(new Date(base.getFullYear(), base.getMonth() + 1, Math.min(dia, ultimo)));
  }
  return null;
}

// ---------- Consultas ----------

const pendientes = () => S.tasks.filter((t) => !t.done);
const area = (id) => S.areas.find((a) => a.id === id);
const lugar = (id) => S.places.find((p) => p.id === id);

function ordenar(lista) {
  return [...lista].sort((a, b) => {
    if (a.due !== b.due) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    }
    if (a.time !== b.time) {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time < b.time ? -1 : 1;
    }
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.createdAt - b.createdAt;
  });
}

function atrasadas() {
  const h = hoyISO();
  return ordenar(pendientes().filter((t) => t.due && t.due < h));
}

function deHoy() {
  const h = hoyISO();
  return ordenar(pendientes().filter((t) => t.due === h));
}

function hechasHoy() {
  const h = hoyISO();
  return S.tasks.filter((t) => t.done && t.doneAt && fechaISO(new Date(t.doneAt)) === h);
}

const ES_SALIDA = ["llevar", "traer", "buscar"];

// ---------- Acciones sobre tareas ----------

function agregarDesdeTexto(texto) {
  const borradores = interpretar(texto, { areas: S.areas, places: S.places });
  if (!borradores.length) return [];
  instantanea();
  const creadas = borradores.map((b) => ({
    id: nuevoId(),
    title: b.title,
    notes: "",
    type: b.type,
    area: b.area,
    place: b.place,
    due: b.due,
    time: b.time,
    moment: b.moment,
    priority: b.priority,
    repeat: b.repeat,
    subs: [],
    done: false,
    doneAt: null,
    createdAt: Date.now(),
  }));
  S.tasks.push(...creadas);
  guardar();
  return creadas;
}

function completar(id, hecho = true) {
  const t = S.tasks.find((x) => x.id === id);
  if (!t) return;
  instantanea();
  if (hecho && t.repeat) {
    // Se guarda una copia como hecha (historial) y la original pasa a la próxima fecha
    S.tasks.push({ ...structuredClone(t), id: nuevoId(), repeat: null, done: true, doneAt: Date.now() });
    t.due = siguienteFecha(t);
    t.subs.forEach((s) => (s.done = false));
    toast(`🔁 Próxima vez: ${etiquetaFecha(t.due).toLowerCase()}`, true);
  } else {
    t.done = hecho;
    t.doneAt = hecho ? Date.now() : null;
    if (hecho) toast("✅ Hecho", true);
  }
  guardar();
}

function moverA(id, iso) {
  const t = S.tasks.find((x) => x.id === id);
  if (!t) return;
  t.due = iso;
  guardar();
}

function eliminar(id) {
  instantanea();
  S.tasks = S.tasks.filter((t) => t.id !== id);
  guardar();
  toast("🗑 Eliminada", true);
}

// ---------- Render ----------

const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function htmlTarea(t, opciones = {}) {
  const a = area(t.area);
  const p = lugar(t.place);
  const meta = [];
  if (a && !opciones.sinArea) meta.push(`<span class="punto" style="--c:${esc(a.color)}">${esc(a.name)}</span>`);
  if (t.type !== "hacer") meta.push(`<span>${TIPOS[t.type]?.icon ?? ""} ${esc(TIPOS[t.type]?.label ?? t.type)}</span>`);
  if (p && !opciones.sinLugar) meta.push(`<span>📍 ${esc(p.name)}</span>`);
  if (t.due && !opciones.sinFecha) {
    const n = diasHasta(t.due);
    const clase = t.done ? "" : n < 0 ? "rojo" : n === 0 ? "naranja" : "";
    meta.push(`<span class="${clase}">📅 ${etiquetaFecha(t.due)}</span>`);
  }
  if (t.time) meta.push(`<span>⏰ ${esc(t.time)}</span>`);
  else if (t.moment && !opciones.sinMomento) meta.push(`<span>${MOMENTOS[t.moment].icon} ${MOMENTOS[t.moment].label}</span>`);
  if (t.repeat) meta.push(`<span>🔁 ${REPETICIONES[t.repeat]}</span>`);
  if (t.subs?.length) meta.push(`<span>☑️ ${t.subs.filter((s) => s.done).length}/${t.subs.length}</span>`);
  if (t.notes) meta.push(`<span>📝</span>`);
  return `<li class="tarea ${t.done ? "hecha" : ""} ${t.priority && !t.done ? "prio" : ""}">
    <button class="check" data-action="toggle" data-id="${t.id}" aria-label="${t.done ? "Marcar pendiente" : "Marcar hecha"}">✓</button>
    <div class="cuerpo" data-action="editar" data-id="${t.id}">
      <div class="titulo">${esc(t.title)}</div>
      ${meta.length ? `<div class="meta">${meta.join("")}</div>` : ""}
    </div>
  </li>`;
}

function seccion(titulo, tareas, opciones = {}) {
  if (!tareas.length) return "";
  return `<section class="seccion">
    <h3 class="seccion-titulo ${opciones.clase ?? ""}"><span>${titulo}</span>${opciones.extra ?? `<span>${tareas.length}</span>`}</h3>
    <ul class="lista">${tareas.map((t) => htmlTarea(t, opciones)).join("")}</ul>
  </section>`;
}

function render() {
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("activo", b.dataset.vista === vista));
  const ahora = new Date();
  $("#subtitulo").textContent = ahora.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const titulos = { hoy: saludo(), proximo: "Próximo", lugares: "Voy a…", listas: "Listas" };
  $("#titulo").textContent = titulos[vista];
  const vistas = { hoy: vistaHoy, proximo: vistaProximo, lugares: vistaLugares, listas: vistaListas };
  $("#vista").innerHTML = vistas[vista]();
}

function saludo() {
  const h = new Date().getHours();
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function checkinPendiente() {
  const h = hoyISO();
  const hechos = S.settings.checkinsHechos.fecha === h ? S.settings.checkinsHechos.ids : [];
  const ahora = minutosAhora();
  const vencidos = S.settings.checkins.filter((c) => c.enabled && aMinutos(c.time) <= ahora && !hechos.includes(c.id));
  return vencidos.sort((a, b) => aMinutos(b.time) - aMinutos(a.time))[0] ?? null;
}

function vistaHoy() {
  const atr = atrasadas();
  const hoy = deHoy();
  const hechas = hechasHoy();
  const total = hoy.length + atr.length + hechas.length;
  const pct = total ? Math.round((hechas.length / total) * 100) : 0;
  let html = "";

  const ck = checkinPendiente();
  if (ck && atr.length + hoy.length > 0) {
    html += `<div class="tarjeta aviso">
      <div class="aviso-cuerpo"><strong>${esc(ck.label)}</strong><p>${atr.length + hoy.length} cosas para revisar y tildar</p></div>
      <button class="boton" data-action="repaso">Empezar</button>
    </div>`;
  }

  html += `<div class="tarjeta resumen">
    <div class="anillo" style="--p:${pct}"><span>${pct}%</span></div>
    <div>
      <strong>${hoy.length + atr.length === 0 ? (hechas.length ? "¡Día completo! 🎉" : "Nada pendiente para hoy") : `${hoy.length + atr.length} pendientes`}</strong>
      <p>${hechas.length} hecha${hechas.length === 1 ? "" : "s"} hoy${atr.length ? ` · <span class="rojo">${atr.length} atrasadas</span>` : ""}</p>
    </div>
  </div>`;

  const salida = [...atr, ...hoy].filter((t) => ES_SALIDA.includes(t.type));
  if (salida.length) {
    html += `<div class="tarjeta llevar"><strong>🎒 Antes de salir</strong>
      <ul>${salida.map((t) => `<li>${esc(t.title)}${lugar(t.place) ? ` <span class="sub">→ ${esc(lugar(t.place).name)}</span>` : ""}</li>`).join("")}</ul>
    </div>`;
  }

  if (!S.settings.ocultarConsejo && S.tasks.length < 3) {
    html += `<div class="tarjeta"><strong>👋 Cómo usarla</strong>
      <p>Escribí o dictá como hablás: <em>“comprar tornillos y silicona para la obra el jueves”</em>, <em>“traer la escalera de lo de mis papás el sábado”</em>, <em>“pagar expensas todos los 10”</em>. La app detecta fecha, hora, ámbito y lugar, y separa las listas en ítems.</p>
      <p>Tres veces por día te propone un <strong>repaso</strong> para tildar lo hecho y reprogramar lo que no. En ⚙️ podés cambiar los horarios y agregar las alarmas a tu calendario para que suenen aunque la app esté cerrada.</p>
      <div class="fila-botones"><button class="boton chico" data-action="ajustes">Configurar avisos</button><button class="boton chico" data-action="ocultar-consejo">Entendido</button></div>
    </div>`;
  }

  html += seccion("Atrasadas", atr, { clase: "rojo" });
  const conHora = hoy.filter((t) => t.time);
  html += seccion("Hoy con horario", conHora, { sinFecha: true });
  for (const [id, m] of Object.entries(MOMENTOS)) {
    html += seccion(`${m.icon} ${m.label}`, hoy.filter((t) => !t.time && t.moment === id), { sinFecha: true, sinMomento: true });
  }
  html += seccion("Hoy, cuando puedas", hoy.filter((t) => !t.time && !t.moment), { sinFecha: true });

  const importantes = ordenar(pendientes().filter((t) => !t.due && t.priority));
  html += seccion("⭐ Importantes sin fecha", importantes);

  const proximos = ordenar(pendientes().filter((t) => t.due && diasHasta(t.due) >= 1 && diasHasta(t.due) <= 2));
  html += seccion("Se viene", proximos);

  if (hechas.length) {
    html += `<details class="seccion"><summary class="seccion-titulo"><span>Hechas hoy</span><span>${hechas.length}</span></summary>
      <ul class="lista">${hechas.map((t) => htmlTarea(t)).join("")}</ul></details>`;
  }

  if (!atr.length && !hoy.length && !importantes.length && !proximos.length && S.tasks.length >= 3) {
    html += `<div class="seccion vacio">Nada urgente por ahora.<br />Mirá <strong>Próximo</strong> o anotá lo que se te venga a la cabeza.</div>`;
  }
  return html;
}

function vistaProximo() {
  let html = "";
  const p = pendientes();
  html += seccion("Atrasadas", atrasadas(), { clase: "rojo" });
  for (let i = 0; i <= 14; i++) {
    const iso = fechaISO(sumarDias(new Date(), i));
    const d = aFecha(iso);
    const tit = i === 0 ? "Hoy" : i === 1 ? "Mañana" : `${DIAS_LARGOS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    html += seccion(tit, ordenar(p.filter((t) => t.due === iso)), { sinFecha: true });
  }
  const limite = fechaISO(sumarDias(new Date(), 14));
  html += seccion("Más adelante", ordenar(p.filter((t) => t.due && t.due > limite)));
  html += seccion("Sin fecha", ordenar(p.filter((t) => !t.due)));
  if (!p.length) html += `<div class="seccion vacio">No tenés nada pendiente. 🙌</div>`;
  return html;
}

function tareasDeLugar(id) {
  const p = pendientes();
  if (id === "_salida") return ordenar(p.filter((t) => ES_SALIDA.includes(t.type)));
  if (id === "_sin") return ordenar(p.filter((t) => !t.place));
  return ordenar(p.filter((t) => t.place === id));
}

function vistaLugares() {
  if (detalle?.tipo === "lugar") return vistaDetalleLugar(detalle.id);
  const salida = tareasDeLugar("_salida");
  let html = `<p class="sub" style="margin:6px 4px 12px">Elegí a dónde vas y mirá todo lo que podés resolver de pasada.</p><div class="grilla">`;
  html += celda("_salida", "🎒", "Antes de salir", "Llevar, traer, buscar", salida.length, "var(--warn)");
  for (const pl of S.places) {
    const n = tareasDeLugar(pl.id).length + (pl.destino ? extrasDeDestino(pl.id).length : 0);
    html += celda(pl.id, pl.emoji, pl.name, null, n);
  }
  const sin = tareasDeLugar("_sin").length;
  if (sin) html += celda("_sin", "❔", "Sin lugar", null, sin);
  return html + "</div>";
}

function celda(id, emoji, nombre, desc, n, color) {
  return `<button class="celda ${n ? "" : "vacia"}" data-action="abrir-lugar" data-id="${id}" ${color ? `style="--c:${color}"` : ""}>
    <span class="emoji">${emoji}</span>
    <span class="nombre">${esc(nombre)}</span>
    <span class="cuenta">${n ? `${n} pendiente${n > 1 ? "s" : ""}` : desc ? esc(desc) : "Nada por ahora"}</span>
  </button>`;
}

// Al ir a Cardano/obra/lo de mis papás también conviene ver lo de ese ámbito que no tiene lugar
function extrasDeDestino(placeId) {
  const a = S.areas.find((x) => x.place === placeId);
  if (!a) return [];
  return ordenar(pendientes().filter((t) => t.area === a.id && !t.place));
}

function vistaDetalleLugar(id) {
  const pl = lugar(id);
  const nombre = id === "_salida" ? "🎒 Antes de salir" : id === "_sin" ? "❔ Sin lugar" : `${pl?.emoji ?? ""} ${pl?.name ?? ""}`;
  const tareas = tareasDeLugar(id);
  let html = `<div class="volver"><button class="icono" data-action="volver" aria-label="Volver">←</button><h2>${esc(nombre)}</h2>
    <button class="boton chico" data-action="compartir" data-tipo="lugar" data-id="${id}">Compartir</button></div>`;
  if (id === "_salida") {
    for (const tipo of ES_SALIDA) html += seccion(`${TIPOS[tipo].icon} ${TIPOS[tipo].label}`, tareas.filter((t) => t.type === tipo));
  } else {
    const porTipo = agrupar(tareas, (t) => t.type);
    for (const [tipo, lista] of porTipo) html += seccion(`${TIPOS[tipo]?.icon ?? ""} ${TIPOS[tipo]?.label ?? tipo}`, lista, { sinLugar: true });
    if (pl?.destino) html += seccion("También de este ámbito", extrasDeDestino(id));
  }
  if (!tareas.length && !(pl?.destino && extrasDeDestino(id).length)) {
    html += `<div class="seccion vacio">Nada pendiente acá.<br />Tip: escribí <strong>@${esc(id.replace(/^_/, ""))}</strong> al anotar para asignarlo a este lugar.</div>`;
  }
  return html;
}

function agrupar(lista, clave) {
  const m = new Map();
  for (const t of lista) {
    const k = clave(t);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(t);
  }
  return [...m.entries()];
}

function vistaListas() {
  if (detalle?.tipo === "area") return vistaDetalleArea(detalle.id);
  let html = `<div class="grilla" style="margin-top:6px">`;
  for (const a of S.areas) {
    const n = pendientes().filter((t) => t.area === a.id).length;
    html += `<button class="celda ${n ? "" : "vacia"}" data-action="abrir-area" data-id="${a.id}" style="--c:${esc(a.color)}">
      <span class="emoji">${a.emoji}</span><span class="nombre">${esc(a.name)}</span>
      <span class="cuenta">${n ? `${n} pendiente${n > 1 ? "s" : ""}` : "Al día"}</span></button>`;
  }
  const sin = pendientes().filter((t) => !t.area).length;
  html += `<button class="celda ${sin ? "" : "vacia"}" data-action="abrir-area" data-id="_sin">
    <span class="emoji">📥</span><span class="nombre">Sin ámbito</span><span class="cuenta">${sin ? `${sin} para ordenar` : "Vacío"}</span></button>`;
  return html + "</div>";
}

function vistaDetalleArea(id) {
  const a = area(id);
  const nombre = id === "_sin" ? "📥 Sin ámbito" : `${a?.emoji ?? ""} ${a?.name ?? ""}`;
  const tareas = ordenar(pendientes().filter((t) => (id === "_sin" ? !t.area : t.area === id)));
  let html = `<div class="volver"><button class="icono" data-action="volver" aria-label="Volver">←</button><h2>${esc(nombre)}</h2>
    <button class="boton chico" data-action="compartir" data-tipo="area" data-id="${id}">Compartir</button></div>`;
  for (const [tipo, lista] of agrupar(tareas, (t) => t.type)) {
    html += seccion(`${TIPOS[tipo]?.icon ?? ""} ${TIPOS[tipo]?.label ?? tipo}`, lista, { sinArea: true });
  }
  if (!tareas.length) html += `<div class="seccion vacio">Todo al día en este ámbito. ✨</div>`;
  const hechas = S.tasks
    .filter((t) => t.done && (id === "_sin" ? !t.area : t.area === id))
    .sort((x, y) => y.doneAt - x.doneAt)
    .slice(0, 15);
  if (hechas.length) {
    html += `<details class="seccion"><summary class="seccion-titulo"><span>Últimas hechas</span><span>${hechas.length}</span></summary>
      <ul class="lista">${hechas.map((t) => htmlTarea(t, { sinArea: true })).join("")}</ul></details>`;
  }
  return html;
}

// ---------- Hoja: editar tarea ----------

function abrirHoja(html) {
  $("#hoja-contenido").innerHTML = html;
  $("#hoja").hidden = false;
}

function cerrarHoja() {
  $("#hoja").hidden = true;
  $("#hoja-contenido").innerHTML = "";
  repaso = null;
  render();
}

function chipsSeleccion(nombre, opciones, actual) {
  return `<div class="chips">${opciones
    .map(([valor, texto]) => `<button type="button" class="chip ${valor === actual ? "sel" : ""}" data-campo="${nombre}" data-valor="${esc(valor ?? "")}">${texto}</button>`)
    .join("")}</div>`;
}

function editar(id) {
  const t = S.tasks.find((x) => x.id === id);
  if (!t) return;
  const atajos = [
    ["hoy", "Hoy"],
    ["manana", "Mañana"],
    ["finde", "Finde"],
    ["semana", "Próx. semana"],
    ["", "Sin fecha"],
  ];
  abrirHoja(`
    <div class="hoja-cabecera"><h2>Editar</h2><button class="boton primario" data-action="cerrar">Listo</button></div>
    <div data-editar="${t.id}">
      <label class="campo"><span>Qué</span><input class="entrada" data-campo="title" value="${esc(t.title)}" /></label>
      <div class="campo"><span>Fecha</span>
        <div class="chips">${atajos.map(([k, l]) => `<button type="button" class="chip" data-atajo="${k}">${l}</button>`).join("")}</div>
        <div class="dos-col"><input type="date" class="entrada" data-campo="due" value="${t.due ?? ""}" /><input type="time" class="entrada" data-campo="time" value="${t.time ?? ""}" /></div>
      </div>
      <div class="campo"><span>Momento del día</span>${chipsSeleccion("moment", [[null, "Cualquiera"], ...Object.entries(MOMENTOS).map(([k, m]) => [k, `${m.icon} ${m.label}`])], t.moment)}</div>
      <div class="campo"><span>Ámbito</span>${chipsSeleccion("area", [[null, "Ninguno"], ...S.areas.map((a) => [a.id, `${a.emoji} ${esc(a.name)}`])], t.area)}</div>
      <div class="campo"><span>Tipo</span>${chipsSeleccion("type", Object.entries(TIPOS).map(([k, v]) => [k, `${v.icon} ${v.label}`]), t.type)}</div>
      <div class="campo"><span>Dónde se resuelve</span>${chipsSeleccion("place", [[null, "Sin lugar"], ...S.places.map((p) => [p.id, `${p.emoji} ${esc(p.name)}`])], t.place)}</div>
      <div class="campo"><span>Repetir</span>${chipsSeleccion("repeat", [[null, "No"], ...Object.entries(REPETICIONES)], t.repeat)}</div>
      <div class="campo"><span>Prioridad</span>${chipsSeleccion("priority", [[0, "Normal"], [1, "⭐ Importante"]], t.priority)}</div>
      <div class="campo"><span>Checklist interno</span>
        <ul class="subs">${t.subs
          .map(
            (s) => `<li><input type="checkbox" data-sub="${s.id}" ${s.done ? "checked" : ""} /><span class="texto ${s.done ? "hecha" : ""}">${esc(s.text)}</span>
            <button type="button" class="x" data-borrar-sub="${s.id}" aria-label="Quitar">✕</button></li>`,
          )
          .join("")}</ul>
        <input class="entrada" data-nuevo-sub placeholder="Agregar ítem y Enter (ej: nivel, metro, planos)" />
      </div>
      <label class="campo"><span>Notas</span><textarea class="entrada" data-campo="notes" placeholder="Dirección, teléfono, medidas, a quién preguntar…">${esc(t.notes)}</textarea></label>
      <div class="fila-botones">
        <button class="boton" data-action="toggle-hoja" data-id="${t.id}">${t.done ? "Marcar pendiente" : "✅ Marcar hecha"}</button>
        <button class="boton" data-action="duplicar" data-id="${t.id}">Duplicar</button>
        <button class="boton peligro" data-action="eliminar" data-id="${t.id}">Eliminar</button>
      </div>
    </div>`);
}

function aplicarAtajo(k) {
  const hoy = new Date();
  if (k === "hoy") return hoyISO();
  if (k === "manana") return fechaISO(sumarDias(hoy, 1));
  if (k === "finde") return fechaISO(sumarDias(hoy, hoy.getDay() === 0 ? 0 : (6 - hoy.getDay() + 7) % 7));
  if (k === "semana") return fechaISO(sumarDias(hoy, ((1 - hoy.getDay() + 7) % 7) || 7));
  return null;
}

function cambioEnHoja(e) {
  const cont = e.target.closest("[data-editar]");
  if (!cont) return false;
  const t = S.tasks.find((x) => x.id === cont.dataset.editar);
  if (!t) return false;
  const el = e.target;

  if (el.dataset.atajo !== undefined && e.type === "click") {
    t.due = aplicarAtajo(el.dataset.atajo);
    guardar();
    editar(t.id);
    return true;
  }
  if (el.classList.contains("chip") && el.dataset.campo && e.type === "click") {
    const campo = el.dataset.campo;
    let v = el.dataset.valor === "" ? null : el.dataset.valor;
    if (campo === "priority") v = Number(v);
    t[campo] = v;
    if (campo === "repeat" && v && !t.due) t.due = hoyISO();
    guardar();
    editar(t.id);
    return true;
  }
  if (el.dataset.sub && e.type === "change") {
    const s = t.subs.find((x) => x.id === el.dataset.sub);
    s.done = el.checked;
    guardar();
    editar(t.id);
    return true;
  }
  if (el.dataset.borrarSub && e.type === "click") {
    t.subs = t.subs.filter((x) => x.id !== el.dataset.borrarSub);
    guardar();
    editar(t.id);
    return true;
  }
  if (el.dataset.campo && (e.type === "input" || e.type === "change") && !el.classList.contains("chip")) {
    t[el.dataset.campo] = el.value || (el.dataset.campo === "title" || el.dataset.campo === "notes" ? "" : null);
    if (el.dataset.campo === "title" && !el.value.trim()) t.title = "(sin título)";
    guardar();
    return true;
  }
  return false;
}

// ---------- Repaso (check-in) ----------

function iniciarRepaso(checkin) {
  const ck = checkin ?? checkinPendiente() ?? { id: "manual", label: "Repaso" };
  const cola = [...atrasadas(), ...deHoy()].map((t) => t.id);
  repaso = { ck, cola, i: 0, hechas: 0, movidas: 0 };
  pintarRepaso();
}

function pintarRepaso() {
  const { ck, cola, i } = repaso;
  if (i >= cola.length) return finRepaso();
  const t = S.tasks.find((x) => x.id === cola[i]);
  if (!t || t.done) {
    repaso.i++;
    return pintarRepaso();
  }
  const atrasada = t.due && t.due < hoyISO();
  abrirHoja(`
    <div class="hoja-cabecera"><h2>${esc(ck.label)}</h2><button class="boton" data-action="cerrar">Después</button></div>
    <div class="repaso-progreso"><div style="width:${Math.round((i / cola.length) * 100)}%"></div></div>
    <p class="sub" style="margin-top:8px">${i + 1} de ${cola.length} · ¿Lo hiciste?</p>
    <div class="repaso-tarjeta">
      <div class="sub">${atrasada ? `<span class="rojo">Atrasada · era para ${etiquetaFecha(t.due).toLowerCase()}</span>` : "Para hoy"}</div>
      <div class="titulo">${esc(t.title)}</div>
      ${htmlTarea(t).match(/<div class="meta">[\s\S]*?<\/div>/)?.[0] ?? ""}
      ${t.notes ? `<p class="sub" style="margin-top:10px">📝 ${esc(t.notes)}</p>` : ""}
    </div>
    <div class="repaso-acciones">
      <button class="boton hecho ancho" data-repaso="hecho">✅ Sí, lo hice</button>
      <button class="boton" data-repaso="hoy">${atrasada ? "📌 Pasarla a hoy" : "📌 Sigue para hoy"}</button>
      <button class="boton" data-repaso="manana">➡️ Mañana</button>
      <button class="boton" data-repaso="otro">📅 Otro día</button>
      <button class="boton peligro" data-repaso="borrar">🗑 Ya no va</button>
      <input type="date" class="entrada ancho" data-repaso-fecha hidden />
    </div>`);
}

function accionRepaso(accion, valor) {
  const id = repaso.cola[repaso.i];
  if (accion === "hecho") {
    completar(id, true);
    repaso.hechas++;
  } else if (accion === "hoy") {
    moverA(id, hoyISO());
  } else if (accion === "manana") {
    moverA(id, fechaISO(sumarDias(new Date(), 1)));
    repaso.movidas++;
  } else if (accion === "otro") {
    const input = document.querySelector("[data-repaso-fecha]");
    input.hidden = false;
    input.min = hoyISO();
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // si el navegador no deja abrir el selector, queda el campo visible
    }
    return;
  } else if (accion === "fecha") {
    moverA(id, valor);
    repaso.movidas++;
  } else if (accion === "borrar") {
    S.tasks = S.tasks.filter((t) => t.id !== id);
    guardar();
  }
  repaso.i++;
  pintarRepaso();
}

function marcarCheckinHecho(ck) {
  const h = hoyISO();
  if (S.settings.checkinsHechos.fecha !== h) S.settings.checkinsHechos = { fecha: h, ids: [] };
  // Hacer un repaso cubre también los horarios anteriores del día
  const hasta = ck.id === "manual" ? minutosAhora() : aMinutos(ck.time);
  for (const c of S.settings.checkins) {
    if (aMinutos(c.time) <= hasta && !S.settings.checkinsHechos.ids.includes(c.id)) S.settings.checkinsHechos.ids.push(c.id);
  }
  guardar();
}

function finRepaso() {
  const { ck, hechas, movidas, cola } = repaso;
  marcarCheckinHecho(ck);
  const esNoche = minutosAhora() >= 17 * 60;
  const manana = fechaISO(sumarDias(new Date(), 1));
  const paraManana = ordenar(pendientes().filter((t) => t.due === manana));
  const salidaManana = paraManana.filter((t) => ES_SALIDA.includes(t.type));
  const hoyQuedan = deHoy();
  abrirHoja(`
    <div class="hoja-cabecera"><h2>${cola.length ? "¡Listo el repaso!" : esc(ck.label)}</h2><button class="boton primario" data-action="cerrar">Cerrar</button></div>
    <div class="repaso-tarjeta">
      <div style="font-size:2.2rem">${cola.length ? "🎯" : "🙌"}</div>
      <div class="titulo">${cola.length ? `${hechas} hecha${hechas === 1 ? "" : "s"} · ${movidas} reprogramada${movidas === 1 ? "" : "s"}` : "No había nada pendiente"}</div>
      <p class="sub">${esNoche ? "Buen cierre de día." : hoyQuedan.length ? `Te ${hoyQuedan.length === 1 ? "queda 1" : `quedan ${hoyQuedan.length}`} para hoy.` : "Día despejado."}</p>
    </div>
    ${
      esNoche && paraManana.length
        ? `<section class="seccion"><h3 class="seccion-titulo"><span>Mañana tenés</span><span>${paraManana.length}</span></h3>
           <ul class="lista">${paraManana.map((t) => htmlTarea(t, { sinFecha: true })).join("")}</ul></section>
           ${salidaManana.length ? `<div class="tarjeta llevar"><strong>🎒 Dejalo preparado esta noche</strong><ul>${salidaManana.map((t) => `<li>${esc(t.title)}</li>`).join("")}</ul></div>` : ""}`
        : ""
    }
    <form class="campo" data-form="rapido">
      <span>${esNoche ? "¿Algo para mañana?" : "¿Te acordaste de algo más?"}</span>
      <div class="dos-col" style="grid-template-columns:1fr auto">
        <input class="entrada" name="texto" placeholder="${esNoche ? "Ej: llevar el taladro a la obra" : "Ej: comprar lija en la ferretería"}" />
        <button class="boton primario">Agregar</button>
      </div>
      <input type="hidden" name="manana" value="${esNoche ? "1" : ""}" />
    </form>`);
  repaso = null;
}

// ---------- Ajustes ----------

function ajustes() {
  const notif = "Notification" in window ? Notification.permission : "no";
  const estadoNotif =
    notif === "granted" ? '<span class="verde">Activadas</span>' : notif === "denied" ? '<span class="rojo">Bloqueadas en el navegador</span>' : notif === "no" ? "No disponibles en este navegador" : "Desactivadas";
  abrirHoja(`
    <div class="hoja-cabecera"><h2>Ajustes</h2><button class="boton primario" data-action="cerrar">Listo</button></div>

    <div class="tarjeta" data-ajustes>
      <strong>⏰ Horarios de repaso</strong>
      <p>En cada horario te aviso y te propongo repasar lo pendiente para tildarlo o reprogramarlo.</p>
      ${S.settings.checkins
        .map(
          (c) => `<div class="ajuste-fila">
            <input type="checkbox" class="switch" data-ck-on="${c.id}" ${c.enabled ? "checked" : ""} aria-label="Activo" />
            <input class="entrada" data-ck-label="${c.id}" value="${esc(c.label)}" />
            <input type="time" class="entrada" data-ck-time="${c.id}" value="${c.time}" />
          </div>`,
        )
        .join("")}
      <label class="ajuste-fila"><input type="checkbox" class="switch" data-auto-repaso ${S.settings.autoRepaso ? "checked" : ""} /> Abrir el repaso solo al entrar a la app si toca uno</label>
    </div>

    <div class="tarjeta">
      <strong>🔔 Notificaciones</strong>
      <p>Estado: ${estadoNotif}. Llegan mientras la app esté abierta o en segundo plano.</p>
      <div class="fila-botones">
        ${notif === "default" ? '<button class="boton primario chico" data-action="pedir-notif">Activar notificaciones</button>' : ""}
        ${notif === "granted" ? '<button class="boton chico" data-action="probar-notif">Probar aviso</button>' : ""}
      </div>
    </div>

    <div class="tarjeta">
      <strong>📆 Alarmas que suenan siempre</strong>
      <p>Para que el aviso llegue aunque el celular tenga la app cerrada, sumá estas alarmas a tu calendario (Google Calendar o Calendario del iPhone). Se abren con un toque y quedan repitiéndose.</p>
      <div class="fila-botones">
        <button class="boton chico" data-action="ics-checkins">Alarmas diarias de repaso</button>
        <button class="boton chico" data-action="ics-tareas">Pendientes con fecha</button>
      </div>
      <p>Las cosas para <em>llevar, traer o ir a buscar</em> sin horario te avisan a las 21 h del día anterior, para dejarlas preparadas.</p>
    </div>

    <details class="tarjeta">
      <summary>🗂️ Ámbitos</summary>
      ${S.areas
        .map(
          (a) => `<div class="ajuste-fila">
            <input class="entrada emoji-in" data-area-emoji="${a.id}" value="${esc(a.emoji)}" aria-label="Emoji" />
            <input class="entrada" data-area-name="${a.id}" value="${esc(a.name)}" />
            <input type="color" data-area-color="${a.id}" value="${esc(a.color)}" aria-label="Color" />
            <button class="x" data-borrar-area="${a.id}" aria-label="Eliminar">✕</button>
          </div>
          <div class="ajuste-fila" style="border-top:0;padding-top:0"><input class="entrada" data-area-kw="${a.id}" value="${esc(a.keywords.join(", "))}" placeholder="Palabras clave separadas por coma" /></div>`,
        )
        .join("")}
      <div class="fila-botones"><button class="boton chico" data-action="nueva-area">+ Nuevo ámbito</button></div>
    </details>

    <details class="tarjeta">
      <summary>📍 Lugares</summary>
      ${S.places
        .map(
          (p) => `<div class="ajuste-fila">
            <input class="entrada emoji-in" data-place-emoji="${p.id}" value="${esc(p.emoji)}" aria-label="Emoji" />
            <input class="entrada" data-place-name="${p.id}" value="${esc(p.name)}" />
            <button class="x" data-borrar-place="${p.id}" aria-label="Eliminar">✕</button>
          </div>
          <div class="ajuste-fila" style="border-top:0;padding-top:0"><input class="entrada" data-place-kw="${p.id}" value="${esc(p.keywords.join(", "))}" placeholder="Palabras clave separadas por coma" /></div>`,
        )
        .join("")}
      <div class="fila-botones"><button class="boton chico" data-action="nuevo-lugar">+ Nuevo lugar</button></div>
    </details>

    <details class="tarjeta">
      <summary>💾 Copia de seguridad</summary>
      <p>Tus datos quedan guardados en este dispositivo. Bajate una copia de vez en cuando o para pasarlos a otro celular.</p>
      <div class="fila-botones">
        <button class="boton chico" data-action="exportar">Descargar copia</button>
        <label class="boton chico">Restaurar copia<input type="file" accept="application/json" data-importar hidden /></label>
        <button class="boton chico peligro" data-action="limpiar-hechas">Borrar hechas de hace +30 días</button>
      </div>
    </details>

    <details class="tarjeta">
      <summary>📲 Instalar en el celular</summary>
      <p><strong>Android (Chrome):</strong> menú ⋮ → “Agregar a pantalla principal” / “Instalar app”.</p>
      <p><strong>iPhone (Safari):</strong> botón Compartir → “Agregar a inicio”. Las notificaciones en iPhone funcionan solo con la app agregada al inicio (iOS 16.4+).</p>
      <p><strong>Atajos al escribir:</strong> <code>#obras</code> fuerza un ámbito, <code>@ferreteria</code> un lugar, <code>!</code> o “urgente” lo marca importante, “todos los lunes” / “cada mes” lo repite.</p>
    </details>`);
}

function cambioEnAjustes(e) {
  const el = e.target;
  const d = el.dataset;
  let tocado = true;
  if (d.ckOn) S.settings.checkins.find((c) => c.id === d.ckOn).enabled = el.checked;
  else if (d.ckLabel) S.settings.checkins.find((c) => c.id === d.ckLabel).label = el.value;
  else if (d.ckTime && el.value) S.settings.checkins.find((c) => c.id === d.ckTime).time = el.value;
  else if (d.autoRepaso !== undefined) S.settings.autoRepaso = el.checked;
  else if (d.areaEmoji) area(d.areaEmoji).emoji = el.value;
  else if (d.areaName) area(d.areaName).name = el.value;
  else if (d.areaColor) area(d.areaColor).color = el.value;
  else if (d.areaKw) area(d.areaKw).keywords = el.value.split(",").map((s) => s.trim()).filter(Boolean);
  else if (d.placeEmoji) lugar(d.placeEmoji).emoji = el.value;
  else if (d.placeName) lugar(d.placeName).name = el.value;
  else if (d.placeKw) lugar(d.placeKw).keywords = el.value.split(",").map((s) => s.trim()).filter(Boolean);
  else tocado = false;
  if (tocado) guardar();
  return tocado;
}

// ---------- Calendario (.ics) ----------

function icsFecha(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function icsUTC(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsTexto(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => "\\" + c);
}

function icsArmar(eventos) {
  const sello = icsUTC(new Date());
  const cuerpo = eventos.map((ev) => ["BEGIN:VEVENT", `UID:${ev.uid}`, `DTSTAMP:${sello}`, ...ev.lineas, "END:VEVENT"].join("\r\n"));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mi Dia//Recordatorios//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...cuerpo, "END:VCALENDAR"].join("\r\n");
}

function alarma(trigger, texto) {
  return ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsTexto(texto)}`, trigger, "END:VALARM"];
}

function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function icsCheckins() {
  const hoy = new Date();
  const eventos = S.settings.checkins
    .filter((c) => c.enabled)
    .map((c) => {
      const [h, m] = c.time.split(":").map(Number);
      const ini = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), h, m);
      const fin = new Date(ini.getTime() + 10 * 60000);
      return {
        uid: `checkin-${c.id}@mi-dia`,
        lineas: [
          `DTSTART:${icsFecha(ini)}`,
          `DTEND:${icsFecha(fin)}`,
          "RRULE:FREQ=DAILY",
          `SUMMARY:${icsTexto("📋 " + c.label)}`,
          `DESCRIPTION:${icsTexto("Abrí Mi Día y tildá lo pendiente: " + APP_URL + "?repaso=1")}`,
          `URL:${APP_URL}?repaso=1`,
          ...alarma("TRIGGER:PT0M", c.label),
        ],
      };
    });
  descargar("mi-dia-repasos.ics", icsArmar(eventos), "text/calendar");
}

function icsTareas() {
  const lista = pendientes().filter((t) => t.due);
  if (!lista.length) return toast("No hay pendientes con fecha");
  const eventos = lista.map((t) => {
    const a = area(t.area);
    const p = lugar(t.place);
    const desc = [a && `Ámbito: ${a.name}`, p && `Dónde: ${p.name}`, t.notes, t.subs.length && t.subs.map((s) => `☐ ${s.text}`).join("\n")].filter(Boolean).join("\n");
    const lineas = [`SUMMARY:${icsTexto(`${TIPOS[t.type]?.icon ?? ""} ${t.title}`)}`, `DESCRIPTION:${icsTexto(desc)}`];
    const dia = aFecha(t.due);
    if (t.repeat) lineas.push({ diario: "RRULE:FREQ=DAILY", laborables: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", semanal: "RRULE:FREQ=WEEKLY", mensual: "RRULE:FREQ=MONTHLY" }[t.repeat]);
    if (t.time) {
      const [h, m] = t.time.split(":").map(Number);
      const ini = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, m);
      lineas.push(`DTSTART:${icsFecha(ini)}`, `DTEND:${icsFecha(new Date(ini.getTime() + 30 * 60000))}`, ...alarma("TRIGGER:-PT30M", t.title));
    } else {
      const fin = sumarDias(dia, 1);
      lineas.push(`DTSTART;VALUE=DATE:${fechaISO(dia).replace(/-/g, "")}`, `DTEND;VALUE=DATE:${fechaISO(fin).replace(/-/g, "")}`);
      // Llevar/traer/buscar: aviso la noche anterior para dejarlo listo. El resto, a las 8.
      lineas.push(...alarma(ES_SALIDA.includes(t.type) ? "TRIGGER:-PT3H" : "TRIGGER:PT8H", t.title));
    }
    return { uid: `${t.id}@mi-dia`, lineas };
  });
  descargar("mi-dia-pendientes.ics", icsArmar(eventos), "text/calendar");
}

// ---------- Compartir ----------

async function compartir(tipo, id) {
  let titulo;
  let tareas;
  if (tipo === "lugar") {
    titulo = id === "_salida" ? "🎒 Antes de salir" : id === "_sin" ? "Sin lugar" : `${lugar(id).emoji} ${lugar(id).name}`;
    tareas = tareasDeLugar(id);
  } else {
    titulo = id === "_sin" ? "Sin ámbito" : `${area(id).emoji} ${area(id).name}`;
    tareas = ordenar(pendientes().filter((t) => (id === "_sin" ? !t.area : t.area === id)));
  }
  if (!tareas.length) return toast("La lista está vacía");
  const texto =
    `*${titulo}*\n` +
    tareas
      .map((t) => {
        const extra = [t.due && etiquetaFecha(t.due).toLowerCase(), t.time].filter(Boolean).join(" ");
        const subs = t.subs.filter((s) => !s.done).map((s) => `    ◦ ${s.text}`);
        return [`☐ ${t.title}${extra ? ` (${extra})` : ""}`, ...subs].join("\n");
      })
      .join("\n");
  if (navigator.share) {
    try {
      await navigator.share({ text: texto });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
}

// ---------- Notificaciones ----------

let registroSW = null;

async function notificar(titulo, cuerpo, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const opciones = { body: cuerpo, tag, icon: "/recordatorios/icon-192.png", badge: "/recordatorios/icon-192.png", data: { url: "/recordatorios?repaso=1" } };
  try {
    if (registroSW) await registroSW.showNotification(titulo, opciones);
    else new Notification(titulo, opciones);
  } catch {
    // algunos navegadores no permiten notificaciones fuera del service worker
  }
}

function yaAvisado(clave) {
  const h = hoyISO();
  if (S.settings.avisados.fecha !== h) S.settings.avisados = { fecha: h, claves: [] };
  if (S.settings.avisados.claves.includes(clave)) return true;
  S.settings.avisados.claves.push(clave);
  guardar();
  return false;
}

function revisarAvisos() {
  const ahora = minutosAhora();
  const n = atrasadas().length + deHoy().length;
  for (const c of S.settings.checkins) {
    const t = aMinutos(c.time);
    // solo si estamos dentro de las 2 h siguientes al horario (si no, alcanza con el cartel en la app)
    if (c.enabled && ahora >= t && ahora - t < 120 && !yaAvisado(`ck:${c.id}`)) {
      const salida = [...atrasadas(), ...deHoy()].filter((x) => ES_SALIDA.includes(x.type)).length;
      notificar(c.label, n ? `Tenés ${n} pendiente${n > 1 ? "s" : ""}${salida ? ` (${salida} para llevar/buscar)` : ""}. Tocá para repasar.` : "Nada pendiente. ¿Querés anotar algo?", `ck-${c.id}`);
    }
  }
  for (const t of deHoy()) {
    if (!t.time) continue;
    const m = aMinutos(t.time);
    // aviso 15 minutos antes
    if (ahora >= m - 15 && ahora <= m + 30 && !yaAvisado(`t:${t.id}:${t.due}`)) {
      notificar(`⏰ ${t.time} · ${t.title}`, [area(t.area)?.name, lugar(t.place)?.name].filter(Boolean).join(" · ") || "Recordatorio", `t-${t.id}`);
    }
  }
}

// ---------- Toast ----------

let toastTimer;
function toast(texto, conDeshacer = false) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(texto)}</span>${conDeshacer && deshacer ? '<button data-action="deshacer">Deshacer</button>' : ""}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4000);
}

// ---------- Captura y dictado ----------

const entrada = $("#entrada");

function actualizarPrevia() {
  const texto = entrada.value.trim();
  entrada.style.height = "auto";
  entrada.style.height = Math.min(entrada.scrollHeight, 140) + "px";
  if (!texto) return ($("#vista-previa").innerHTML = "");
  const bs = interpretar(texto, { areas: S.areas, places: S.places });
  $("#vista-previa").innerHTML = bs
    .slice(0, 6)
    .map((b) => {
      const partes = [
        `<strong>${esc(b.title)}</strong>`,
        b.type !== "hacer" ? TIPOS[b.type].icon : "",
        area(b.area) ? `· ${area(b.area).emoji} ${esc(area(b.area).name)}` : "",
        lugar(b.place) ? `· 📍${esc(lugar(b.place).name)}` : "",
        b.due ? `· 📅 ${etiquetaFecha(b.due)}` : "",
        b.time ? `· ⏰ ${b.time}` : b.moment ? `· ${MOMENTOS[b.moment].icon}` : "",
        b.repeat ? `· 🔁 ${REPETICIONES[b.repeat]}` : "",
        b.priority ? "· ⭐" : "",
      ];
      return `<div class="previa">${partes.filter(Boolean).join(" ")}</div>`;
    })
    .join("");
  // Deja claro que todavía no se guardó
  const aviso = bs.length > 1 ? `Tocá ＋ para guardar estas ${bs.length} tareas:` : "Tocá ＋ para guardar:";
  $("#vista-previa").insertAdjacentHTML("afterbegin", `<div class="previa previa-aviso">${aviso}</div>`);
}

function enviarCaptura(e) {
  e.preventDefault();
  const texto = entrada.value.trim();
  if (!texto) return entrada.focus();
  const creadas = agregarDesdeTexto(texto);
  entrada.value = "";
  actualizarPrevia();
  if (creadas.length === 1) {
    const t = creadas[0];
    toast(`Agregada${t.due ? ` para ${etiquetaFecha(t.due).toLowerCase()}` : ""}`, true);
  } else toast(`Agregadas ${creadas.length} tareas`, true);
  render();
}

let reconocimiento = null;
function dictar() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast("Este navegador no permite dictado acá: usá el 🎤 del teclado");
    entrada.focus();
    return;
  }
  if (reconocimiento) {
    reconocimiento.stop();
    return;
  }
  const previo = entrada.value.trim();
  reconocimiento = new SR();
  reconocimiento.lang = "es-AR";
  reconocimiento.interimResults = true;
  reconocimiento.continuous = false;
  $("#mic").classList.add("escuchando");
  reconocimiento.onresult = (ev) => {
    const dicho = [...ev.results].map((r) => r[0].transcript).join(" ");
    entrada.value = (previo ? previo + "\n" : "") + dicho;
    actualizarPrevia();
  };
  reconocimiento.onerror = (ev) => {
    if (ev.error === "not-allowed") toast("Permití el micrófono para poder dictar");
  };
  reconocimiento.onend = () => {
    $("#mic").classList.remove("escuchando");
    reconocimiento = null;
    entrada.focus();
  };
  reconocimiento.start();
}

// ---------- Eventos ----------

document.addEventListener("click", (e) => {
  if (cambioEnHoja(e)) return;
  const btnRepaso = e.target.closest("[data-repaso]");
  if (btnRepaso && repaso) return accionRepaso(btnRepaso.dataset.repaso);

  const nav = e.target.closest("[data-vista]");
  if (nav) {
    vista = nav.dataset.vista;
    detalle = null;
    window.scrollTo(0, 0);
    return render();
  }

  const el = e.target.closest("[data-action]");
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.action) {
    case "toggle": {
      const t = S.tasks.find((x) => x.id === id);
      completar(id, !t.done);
      return render();
    }
    case "toggle-hoja": {
      const t = S.tasks.find((x) => x.id === id);
      completar(id, !t.done);
      return cerrarHoja();
    }
    case "editar":
      return editar(id);
    case "eliminar":
      eliminar(id);
      return cerrarHoja();
    case "duplicar": {
      const t = S.tasks.find((x) => x.id === id);
      const copia = { ...structuredClone(t), id: nuevoId(), done: false, doneAt: null, createdAt: Date.now() };
      S.tasks.push(copia);
      guardar();
      toast("Duplicada");
      return editar(copia.id);
    }
    case "cerrar":
      return cerrarHoja();
    case "repaso":
      return iniciarRepaso();
    case "ajustes":
      return ajustes();
    case "ocultar-consejo":
      S.settings.ocultarConsejo = true;
      guardar();
      return render();
    case "abrir-lugar":
      detalle = { tipo: "lugar", id };
      window.scrollTo(0, 0);
      return render();
    case "abrir-area":
      detalle = { tipo: "area", id };
      window.scrollTo(0, 0);
      return render();
    case "volver":
      detalle = null;
      return render();
    case "compartir":
      return compartir(el.dataset.tipo, id);
    case "deshacer":
      if (deshacer) {
        S.tasks = JSON.parse(deshacer);
        deshacer = null;
        guardar();
        $("#toast").hidden = true;
        render();
      }
      return;
    case "pedir-notif":
      return Notification.requestPermission().then(() => ajustes());
    case "probar-notif":
      return notificar("Mi Día", "¡Así te van a llegar los avisos! 👌", "prueba");
    case "ics-checkins":
      return icsCheckins();
    case "ics-tareas":
      return icsTareas();
    case "exportar":
      return descargar(`mi-dia-copia-${hoyISO()}.json`, JSON.stringify(S, null, 2), "application/json");
    case "limpiar-hechas": {
      const limite = Date.now() - 30 * 86400000;
      const antes = S.tasks.length;
      instantanea();
      S.tasks = S.tasks.filter((t) => !t.done || t.doneAt > limite);
      guardar();
      return toast(`Se borraron ${antes - S.tasks.length} tareas viejas`, true);
    }
    case "nueva-area":
      S.areas.push({ id: nuevoId(), name: "Nuevo ámbito", emoji: "📌", color: "#5b8eff", place: null, keywords: [] });
      guardar();
      return ajustes();
    case "nuevo-lugar":
      S.places.push({ id: nuevoId(), name: "Nuevo lugar", emoji: "📍", keywords: [] });
      guardar();
      return ajustes();
  }
});

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-borrar-area]");
  const p = e.target.closest("[data-borrar-place]");
  if (a && confirm("¿Eliminar este ámbito? Las tareas quedan sin ámbito.")) {
    const id = a.dataset.borrarArea;
    S.areas = S.areas.filter((x) => x.id !== id);
    S.tasks.forEach((t) => t.area === id && (t.area = null));
    guardar();
    ajustes();
  }
  if (p && confirm("¿Eliminar este lugar? Las tareas quedan sin lugar.")) {
    const id = p.dataset.borrarPlace;
    S.places = S.places.filter((x) => x.id !== id);
    S.tasks.forEach((t) => t.place === id && (t.place = null));
    S.areas.forEach((x) => x.place === id && (x.place = null));
    guardar();
    ajustes();
  }
});

document.addEventListener("input", (e) => {
  if (e.target === entrada) return actualizarPrevia();
  if (cambioEnHoja(e)) return;
  cambioEnAjustes(e);
});

document.addEventListener("change", (e) => {
  if (e.target.matches("[data-repaso-fecha]") && repaso && e.target.value) return accionRepaso("fecha", e.target.value);
  if (e.target.matches("[data-importar]")) return importar(e.target.files[0]);
  if (cambioEnHoja(e)) return;
  cambioEnAjustes(e);
});

document.addEventListener("submit", (e) => {
  if (e.target.id === "captura") return enviarCaptura(e);
  if (e.target.dataset.form === "rapido") {
    e.preventDefault();
    const texto = e.target.texto.value.trim();
    if (!texto) return;
    const creadas = agregarDesdeTexto(texto);
    if (e.target.manana.value) {
      const manana = fechaISO(sumarDias(new Date(), 1));
      creadas.forEach((t) => !t.due && (t.due = manana));
      guardar();
    }
    e.target.texto.value = "";
    toast(`Agregada${creadas.length > 1 ? "s" : ""} ${creadas.length}`);
  }
});

entrada.addEventListener("keydown", (e) => {
  // Enter agrega; Shift+Enter hace un salto de línea (para pegar o dictar listas)
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    $("#captura").requestSubmit();
  }
  shiftEnter = e.key === "Enter" && e.shiftKey;
});

// En los teclados de celular (Gboard, etc.) el Enter suele no llegar como keydown:
// se detecta como salto de línea y se usa para guardar.
let shiftEnter = false;
entrada.addEventListener("beforeinput", (e) => {
  if ((e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") && !shiftEnter) {
    e.preventDefault();
    $("#captura").requestSubmit();
  }
  shiftEnter = false;
});

$("#mic").addEventListener("click", dictar);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !e.target.matches("[data-nuevo-sub]")) return;
  e.preventDefault();
  const t = S.tasks.find((x) => x.id === e.target.closest("[data-editar]").dataset.editar);
  const texto = e.target.value.trim();
  if (!t || !texto) return;
  // Se pueden cargar varios de una vez separados por coma
  for (const parte of texto.split(",").map((x) => x.trim()).filter(Boolean)) t.subs.push({ id: nuevoId(), text: parte, done: false });
  guardar();
  editar(t.id);
  document.querySelector("[data-nuevo-sub]")?.focus();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#hoja").hidden) cerrarHoja();
});

function importar(archivo) {
  if (!archivo) return;
  archivo.text().then((txt) => {
    try {
      const datos = JSON.parse(txt);
      if (!Array.isArray(datos.tasks)) throw new Error("formato");
      if (!confirm(`¿Reemplazar tus datos por la copia (${datos.tasks.length} tareas)?`)) return;
      S = { ...estadoInicial(), ...datos };
      guardar();
      toast("Copia restaurada");
      cerrarHoja();
    } catch {
      toast("El archivo no es una copia válida");
    }
  });
}

// ---------- Arranque ----------

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/recordatorios-sw.js", { scope: "/recordatorios" })
    .then((r) => (registroSW = r))
    .catch(() => {});
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.tipo === "repaso") iniciarRepaso();
  });
}

render();

const params = new URLSearchParams(location.search);
if (params.has("repaso")) {
  history.replaceState(null, "", location.pathname);
  iniciarRepaso();
} else if (params.has("nuevo")) {
  entrada.focus();
} else if (S.settings.autoRepaso) {
  const ck = checkinPendiente();
  if (ck && atrasadas().length + deHoy().length > 0 && !yaAvisado(`auto:${ck.id}`)) iniciarRepaso(ck);
}

revisarAvisos();
setInterval(() => {
  revisarAvisos();
  if ($("#hoja").hidden) render();
}, 60000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && $("#hoja").hidden) {
    revisarAvisos();
    render();
  }
});
