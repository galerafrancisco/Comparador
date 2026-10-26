// Interpreta texto libre (escrito o dictado) y lo convierte en tareas.
// Ej: "mañana llevar planos a Cardano a las 9" →
//   { title: "Llevar planos", type: "llevar", area: "cardano", place: "cardano", due: "<mañana>", time: "09:00" }

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const NUMEROS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, diez: 10, quince: 15 };

// Verbos → tipo de tarea. El orden importa: las frases largas primero.
export const VERBOS = [
  ["ir a buscar|pasar a buscar|buscar|retirar|recoger|recibir", "buscar"],
  ["comprar(?:le|les)?|compra|conseguir", "comprar"],
  ["llevar(?:le|les)?|lleva|devolver(?:le)?|entregar(?:le)?|dejar(?:le)?", "llevar"],
  ["traer(?:le|les)?|trae|pedirle a .{1,20}? que traiga", "traer"],
  ["reunion|reunirme|juntarme|junta|visita|visitar", "reunion"],
  ["llamar(?:le|lo|la)?|coordinar|avisar(?:le)?|hablar(?:le)?|mandar(?:le)?|enviar(?:le)?|confirmar|preguntar(?:le)?|whatsapp|mail|pedir(?:le)?|responder(?:le)?|contestar(?:le)?", "coordinar"],
  ["tramite|tramitar|pagar|presentar|renovar|sacar turno|firmar|gestionar|inscribir|vencimiento|vence", "tramite"],
];

export const TIPOS = {
  hacer: { label: "Hacer", icon: "✔️" },
  comprar: { label: "Comprar", icon: "🛒" },
  llevar: { label: "Llevar", icon: "📦" },
  traer: { label: "Traer", icon: "📥" },
  buscar: { label: "Ir a buscar", icon: "🚗" },
  coordinar: { label: "Coordinar / llamar", icon: "📞" },
  reunion: { label: "Reunión", icon: "👥" },
  tramite: { label: "Trámite / pago", icon: "📄" },
};

// Quita acentos sin cambiar el largo del texto, para poder mapear índices al original.
export function plano(texto) {
  let out = "";
  for (const c of texto.normalize("NFC")) {
    const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
    out += base.length === 1 ? base.toLowerCase() : c.toLowerCase();
  }
  return out;
}

export function fechaISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function sumarDias(base, n) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

function proximoDia(hoy, diaSemana, permitirHoy) {
  let delta = (diaSemana - hoy.getDay() + 7) % 7;
  if (delta === 0 && !permitirHoy) delta = 7;
  return sumarDias(hoy, delta);
}

function num(s) {
  return NUMEROS[s] ?? parseInt(s, 10);
}

function escapar(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function coincidencias(low, palabras) {
  const res = [];
  for (const p of palabras) {
    const k = plano(p.trim());
    if (!k) continue;
    const m = new RegExp(`(^|[^a-z0-9])(${escapar(k)})(?=$|[^a-z0-9])`).exec(low);
    if (m) {
      const ini = m.index + m[1].length;
      res.push([ini, ini + k.length]);
    }
  }
  return res;
}

// Elige el ítem (ámbito o lugar) cuya palabra clave aparece primero en el texto.
// Si dos coincidencias se superponen gana la más larga ("casa de mis papás" le gana a "casa").
export function detectar(low, items) {
  const todas = [];
  for (const it of items) {
    for (const [ini, fin] of coincidencias(low, [it.name, ...(it.keywords || [])])) todas.push({ it, ini, fin });
  }
  if (!todas.length) return null;
  todas.sort((a, b) => a.ini - b.ini || b.fin - a.fin);
  let mejor = todas[0];
  for (const c of todas) {
    if (c.ini < mejor.fin && c.fin - c.ini > mejor.fin - mejor.ini) mejor = c;
  }
  return mejor.it;
}

function detectarTipo(low) {
  let mejor = null;
  for (const [patron, tipo] of VERBOS) {
    const m = new RegExp(`(^|[^a-z])(${patron})(?=$|[^a-z])`).exec(low);
    if (m && (mejor === null || m.index < mejor.index)) mejor = { index: m.index, tipo };
  }
  return mejor;
}

function empiezaConVerbo(low) {
  const t = detectarTipo(low);
  return t !== null && t.index === 0;
}

/**
 * Analiza una línea de texto.
 * @param {string} texto
 * @param {{areas: any[], places: any[], now?: Date}} ctx
 * @returns {object[]} borradores de tareas (puede ser más de una si es una lista)
 */
export function interpretar(texto, ctx) {
  const lineas = texto
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-•*\d.)]+\s+/, "").trim())
    .filter(Boolean);
  return lineas.flatMap((l) => interpretarLinea(l, ctx));
}

function interpretarLinea(original, ctx) {
  const now = ctx.now || new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orig = original.normalize("NFC");
  let low = plano(orig);
  const quitar = [];
  const r = { due: null, time: null, moment: null, priority: 0, repeat: null, area: null, place: null, type: "hacer" };

  // Busca un patrón, guarda el rango para quitarlo del título y lo tapa para que no se use de nuevo.
  function tomar(regex, alEncontrar) {
    const m = regex.exec(low);
    if (!m) return false;
    const res = alEncontrar(m);
    if (res === false) return false;
    quitar.push([m.index, m.index + m[0].length]);
    low = low.slice(0, m.index) + " ".repeat(m[0].length) + low.slice(m.index + m[0].length);
    return true;
  }

  // Etiquetas explícitas: #ambito @lugar
  tomar(/(^|\s)#([a-z0-9_]+)/, (m) => {
    const a = ctx.areas.find((x) => x.id === m[2] || plano(x.name).replace(/\s+/g, "").startsWith(m[2]));
    if (!a) return false;
    r.area = a.id;
  });
  tomar(/(^|\s)@([a-z0-9_]+)/, (m) => {
    const p = ctx.places.find((x) => x.id === m[2] || plano(x.name).replace(/\s+/g, "").startsWith(m[2]));
    if (!p) return false;
    r.place = p.id;
  });

  // Prioridad
  tomar(/\s*(?:(?:es |muy )?\b(urgente|importante|prioridad|sin falta)\b|!+)/, () => {
    r.priority = 1;
  });

  // Repetición
  tomar(/\b(todos los dias|todas las mananas|cada dia|diariamente|a diario)\b/, () => {
    r.repeat = "diario";
  });
  tomar(/\b(de lunes a viernes|dias habiles|dias de semana)\b/, () => {
    r.repeat = "laborables";
  });
  tomar(/\b(?:todos los|cada) (domingo|lunes|martes|miercoles|jueves|viernes|sabado)s?\b/, (m) => {
    r.repeat = "semanal";
    r.due = fechaISO(proximoDia(hoy, DIAS.indexOf(m[1]), true));
  });
  tomar(/\b(todas las semanas|cada semana|semanalmente|una vez por semana)\b/, () => {
    r.repeat = "semanal";
  });
  tomar(/\b(todos los meses|cada mes|mensualmente|una vez por mes)\b/, () => {
    r.repeat = "mensual";
  });
  tomar(/\b(?:todos los|cada) (\d{1,2})(?: de cada mes)?\b/, (m) => {
    const dia = parseInt(m[1], 10);
    if (dia < 1 || dia > 31) return false;
    r.repeat = "mensual";
    let d = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
    if (d < hoy) d = new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia);
    r.due = fechaISO(d);
  });

  // Hora
  const ajustarHora = (h, min, sufijo) => {
    let hh = parseInt(h, 10);
    const mm = min ? parseInt(min, 10) : 0;
    if (hh > 23 || mm > 59) return false;
    if (sufijo === "pm" && hh < 12) hh += 12;
    else if (sufijo !== "am" && hh >= 1 && hh <= 7) hh += 12; // "a las 5" → 17 hs
    r.time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  const tomoHora =
    tomar(/(?:\b(?:a las?|tipo|por las|desde las|antes de las|para las)\s+)?\b(\d{1,2})(?:[:.](\d{2}))?\s*(hs|h|horas|am|pm)\b/, (m) => ajustarHora(m[1], m[2], m[3])) ||
    tomar(/\b(?:a las?|tipo|por las|desde las|antes de las|para las)\s+(\d{1,2})(?:[:.](\d{2}))?\b/, (m) => ajustarHora(m[1], m[2])) ||
    tomar(/\b(\d{1,2}):(\d{2})\b/, (m) => ajustarHora(m[1], m[2]));
  if (tomoHora) {
    tomar(/\b(de la manana|de la tarde|de la noche)\b/, (m) => {
      const [h, mm] = r.time.split(":").map(Number);
      let hh = h;
      if (m[1] === "de la manana" && hh >= 12) hh -= 12;
      if (m[1] !== "de la manana" && hh < 12) hh += 12;
      r.time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    });
  }

  // Momento del día (antes que "mañana" como fecha)
  tomar(/\b(a la manana|por la manana|temprano|a primera hora|antes de salir)\b/, () => {
    r.moment = "manana";
  });
  tomar(/\besta (tarde|noche)\b/, (m) => {
    r.due = fechaISO(hoy);
    r.moment = m[1];
  });
  tomar(/\b(al mediodia|a la tarde|por la tarde|a la siesta|despues de almorzar)\b/, () => {
    r.moment = "tarde";
  });
  tomar(/\b(a la noche|por la noche|antes de dormir|al volver)\b/, () => {
    r.moment = "noche";
  });

  // Fecha
  const prefijo = "(?:para |antes del? |hasta el |el |este |esta |la |el proximo |la proxima |proximo |proxima )*";
  const setFecha = (d) => {
    if (!r.due) r.due = fechaISO(d);
    else return false;
  };
  tomar(new RegExp(`\\b${prefijo}pasado manana\\b`), () => setFecha(sumarDias(hoy, 2)));
  tomar(new RegExp(`\\b${prefijo}manana\\b`), () => setFecha(sumarDias(hoy, 1)));
  tomar(new RegExp(`\\b${prefijo}(hoy|ahora|ya)\\b`), () => setFecha(hoy));
  tomar(new RegExp(`\\b${prefijo}(fin de semana|finde)\\b`), () => setFecha(hoy.getDay() === 0 ? hoy : proximoDia(hoy, 6, true)));
  tomar(new RegExp(`\\b${prefijo}(semana que viene|proxima semana)\\b`), () => setFecha(proximoDia(hoy, 1, false)));
  tomar(new RegExp(`\\b${prefijo}fin de mes\\b`), () => setFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)));
  tomar(/\b(?:dentro de |en )(\d+|una?|dos|tres|cuatro|cinco|diez|quince) (dias?|semanas?|mes|meses)\b/, (m) => {
    const n = num(m[1]);
    if (m[2].startsWith("dia")) return setFecha(sumarDias(hoy, n));
    if (m[2].startsWith("semana")) return setFecha(sumarDias(hoy, n * 7));
    return setFecha(new Date(hoy.getFullYear(), hoy.getMonth() + n, hoy.getDate()));
  });
  tomar(new RegExp(`\\b${prefijo}(${DIAS.join("|")})\\b`), (m) => setFecha(proximoDia(hoy, DIAS.indexOf(m[1]), false)));
  tomar(new RegExp(`\\b${prefijo}(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?\\b`), (m) => {
    const dia = +m[1];
    const mes = +m[2] - 1;
    if (mes < 0 || mes > 11 || dia < 1 || dia > 31) return false;
    let anio = m[3] ? +m[3] : hoy.getFullYear();
    if (anio < 100) anio += 2000;
    let d = new Date(anio, mes, dia);
    if (!m[3] && d < hoy) d = new Date(anio + 1, mes, dia);
    return setFecha(d);
  });
  tomar(new RegExp(`\\b${prefijo}(\\d{1,2}) de (${MESES.join("|")})\\b`), (m) => {
    let d = new Date(hoy.getFullYear(), MESES.indexOf(m[2]), +m[1]);
    if (d < hoy) d = new Date(hoy.getFullYear() + 1, MESES.indexOf(m[2]), +m[1]);
    return setFecha(d);
  });
  tomar(/\b(?:para el|antes del|hasta el|el dia|el) (\d{1,2})\b(?![:/.\d]| ?(?:hs|h\b|horas|kg|m\b|metros|bolsas|unidades))/, (m) => {
    const dia = +m[1];
    if (dia < 1 || dia > 31) return false;
    let d = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
    if (d < hoy) d = new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia);
    return setFecha(d);
  });

  // Tipo, ámbito y lugar (no se quitan del título: forman parte de lo que hay que hacer)
  const tipo = detectarTipo(low);
  if (tipo) r.type = tipo.tipo;
  if (!r.place) {
    const p = detectar(low, ctx.places);
    if (p) r.place = p.id;
  }
  if (!r.area) {
    // Si el lugar es un destino propio (Cardano, la obra, lo de mis papás) define el ámbito
    const lugar = ctx.places.find((x) => x.id === r.place);
    const a = (lugar?.destino && ctx.areas.find((x) => x.place === lugar.id)) || detectar(low, ctx.areas);
    if (a) r.area = a.id;
  }
  if (!r.place && r.area && ["llevar", "traer", "buscar", "reunion"].includes(r.type)) {
    const a = ctx.areas.find((x) => x.id === r.area);
    if (a?.place) r.place = a.place;
  }
  // Con hora pero sin fecha: hoy si todavía llega, si no mañana
  if (r.time && !r.due) {
    const [h, m] = r.time.split(":").map(Number);
    r.due = fechaISO(h * 60 + m > now.getHours() * 60 + now.getMinutes() ? hoy : sumarDias(hoy, 1));
  }

  // Armar el título a partir del texto original sin las partes interpretadas
  quitar.sort((a, b) => b[0] - a[0]);
  let titulo = orig;
  for (const [i, f] of quitar) titulo = titulo.slice(0, i) + " " + titulo.slice(f);
  titulo = limpiarTitulo(titulo);
  if (!titulo) titulo = orig.trim();

  const base = { ...r, title: titulo };
  return dividirLista(base, ctx);
}

function limpiarTitulo(t) {
  t = t.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  // conectores que quedan colgando al principio o al final
  const colgantes = /^(?:y|que|tengo que|hay que|tenemos que|acordarme de|acordate de|recordar|recordarme|no olvidar|no olvidarme de|debo|necesito|para|el|la|a|de|en|del|al|,|\.|-)\s+/i;
  for (let i = 0; i < 4; i++) t = t.replace(colgantes, "");
  const finales = /\s+(?:y|para|el|la|a|de|en|del|al|antes|hasta|las|los|que)\s*[,.]?$|[\s,.;:-]+$/i;
  for (let i = 0; i < 4; i++) t = t.replace(finales, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// "Comprar leche, pan y yerba" → 3 tareas, cada una con su lugar (súper, ferretería…)
function dividirLista(base, ctx) {
  const low = plano(base.title);
  const verbo = detectarTipo(low);
  if (!verbo || verbo.index !== 0) return [base];
  const m = /^(\S+(?: a buscar)?)\s+(.*)$/.exec(base.title);
  if (!m) return [base];
  const [, palabraVerbo, resto] = m;
  // Si hay un destino al final ("... a Cardano", "... en el súper") se mantiene para todos
  const destino = /\s+((?:a|en|para|de|del|al|a lo de)\s+(?:la |el |lo de |mis |mi )?[^,]+)$/i.exec(resto);
  let cuerpo = resto;
  let cola = "";
  if (destino && /,| y | e /i.test(resto.slice(0, destino.index))) {
    cuerpo = resto.slice(0, destino.index);
    cola = " " + destino[1];
  }
  const partes = cuerpo.split(/\s*,\s*|\s+y\s+|\s+e\s+/i).map((p) => p.trim()).filter(Boolean);
  if (partes.length < 2 || partes.some((p) => p.split(/\s+/).length > 6)) return [base];

  return partes.map((p) => {
    const conVerbo = empiezaConVerbo(plano(p));
    const titulo = conVerbo ? p.charAt(0).toUpperCase() + p.slice(1) : `${palabraVerbo} ${p}${cola}`;
    const lowP = plano(titulo);
    const t = { ...base, title: titulo };
    if (conVerbo) t.type = detectarTipo(lowP).tipo;
    const lugar = detectar(lowP, ctx.places);
    if (lugar) t.place = lugar.id;
    return t;
  });
}
