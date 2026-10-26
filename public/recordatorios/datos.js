// Ámbitos y lugares iniciales. Se pueden editar desde Ajustes.

export const AREAS_INICIALES = [
  { id: "cardano", name: "Barrio Cardano", emoji: "🏢", color: "#4f8cff", place: "cardano", keywords: ["cardano", "barrio", "oficina", "laburo", "trabajo", "guardia", "administracion", "consorcio"] },
  { id: "obras", name: "Obras y reformas", emoji: "🔨", color: "#f0a03c", place: "obra", keywords: ["obra", "obras", "reforma", "reformas", "cliente", "presupuesto", "albanil", "plomero", "electricista", "pintor", "gasista", "materiales", "medicion", "medir"] },
  { id: "hat", name: "Grupo HAT", emoji: "📋", color: "#a46cf5", place: "tramites", keywords: ["hat", "grupo hat", "expediente", "plano", "planos", "permiso", "habilitacion", "municipio", "municipalidad", "catastro", "colegio", "visado"] },
  { id: "casa", name: "Mi casa", emoji: "🏠", color: "#3cbf7f", place: "casa", keywords: ["casa", "hogar", "familia", "chicos", "nenes", "escuela", "colegio de los chicos"] },
  { id: "papas", name: "Casa de mis papás", emoji: "👵", color: "#e8607a", place: "papas", keywords: ["casa de mis papas", "mis papas", "mis viejos", "lo de mis papas", "mi mama", "mi papa", "mama", "papi", "mami"] },
  { id: "personal", name: "Personal", emoji: "🙋", color: "#8a94a6", place: null, keywords: ["medico", "turno", "dentista", "gimnasio", "gym", "auto", "service", "cumple", "cumpleanos", "regalo"] },
];

export const LUGARES_INICIALES = [
  { id: "cardano", name: "Barrio Cardano", emoji: "🏢", destino: true, keywords: ["cardano"] },
  { id: "obra", name: "Obra", emoji: "🏗️", destino: true, keywords: ["obra", "la obra"] },
  { id: "casa", name: "Mi casa", emoji: "🏠", destino: true, keywords: ["mi casa", "en casa", "a casa"] },
  { id: "papas", name: "Casa de mis papás", emoji: "👵", destino: true, keywords: ["casa de mis papas", "mis papas", "mis viejos", "lo de mis papas"] },
  { id: "super", name: "Súper / almacén", emoji: "🛒", keywords: ["super", "supermercado", "almacen", "chino", "verduleria", "carniceria", "panaderia", "leche", "pan", "yerba", "cafe", "azucar", "fideos", "arroz", "aceite", "huevos", "papel higienico", "detergente", "lavandina", "jabon", "shampoo", "fruta", "verdura", "carne", "pollo", "queso", "agua", "galletitas", "papas", "tomate", "cebolla", "pañales", "panales"] },
  { id: "ferreteria", name: "Ferretería", emoji: "🔩", keywords: ["ferreteria", "tornillos", "tarugos", "clavos", "cinta", "silicona", "sellador", "mecha", "mechas", "lija", "pinceles", "rodillo", "cable", "enchufe", "cerradura", "bisagra", "bisagras", "foco", "lamparita", "teflon", "precinto", "precintos", "pintura", "disco de corte", "llave de paso"] },
  { id: "corralon", name: "Corralón", emoji: "🧱", keywords: ["corralon", "cemento", "arena", "cal", "ladrillos", "hierro", "hidrofugo", "piedra", "ceramicos", "porcelanato", "durlock", "placa", "pegamento", "klaukol", "membrana", "plasticor", "cano", "canos", "caño", "caños"] },
  { id: "farmacia", name: "Farmacia", emoji: "💊", keywords: ["farmacia", "remedio", "remedios", "pastillas", "ibuprofeno", "receta", "medicamento"] },
  { id: "tramites", name: "Banco / municipio / trámites", emoji: "🏛️", keywords: ["banco", "municipalidad", "muni", "arca", "afip", "rentas", "registro", "escribania", "correo", "catastro", "colegio de arquitectos"] },
];

export const CHECKINS_INICIALES = [
  { id: "manana", label: "Repaso de la mañana", time: "08:00", enabled: true },
  { id: "mediodia", label: "Repaso del mediodía", time: "13:30", enabled: true },
  { id: "noche", label: "Cierre del día", time: "20:30", enabled: true },
];

export const MOMENTOS = {
  manana: { label: "A la mañana", icon: "🌅" },
  tarde: { label: "A la tarde", icon: "☀️" },
  noche: { label: "A la noche", icon: "🌙" },
};

export const REPETICIONES = {
  diario: "Todos los días",
  laborables: "Días hábiles",
  semanal: "Cada semana",
  mensual: "Cada mes",
};
