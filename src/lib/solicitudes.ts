import { db } from "@/lib/db";
import { generarToken } from "@/lib/tokens";
import { calcularFee, FEE_CONFIG_DEFAULT } from "@/lib/fee";
import type { TipoSolicitud } from "@/generated/prisma/enums";

export type NuevoItem = {
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario?: number | null;
  flete?: number | null;
};

export type NuevaSolicitudInput = {
  tipo: TipoSolicitud;
  clienteNombre: string;
  clienteContacto: string;
  zona: string;
  montoTotalOriginal: number;
  items: NuevoItem[];
  archivo?: { nombre: string; tipo: string; datos: Uint8Array<ArrayBuffer> } | null;
};

export async function crearSolicitud(input: NuevaSolicitudInput) {
  let token = generarToken();

  // Reintenta si por casualidad colisiona el token único.
  for (let intentos = 0; intentos < 5; intentos++) {
    const existente = await db.solicitud.findUnique({ where: { token } });
    if (!existente) break;
    token = generarToken();
  }

  return db.solicitud.create({
    data: {
      token,
      tipo: input.tipo,
      clienteNombre: input.clienteNombre,
      clienteContacto: input.clienteContacto,
      zona: input.zona,
      montoTotalOriginal: input.montoTotalOriginal,
      archivoNombre: input.archivo?.nombre,
      archivoTipo: input.archivo?.tipo,
      archivoDatos: input.archivo?.datos,
      items: {
        create: input.items.map((item, index) => ({
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario ?? null,
          flete: item.flete ?? null,
          orden: index,
        })),
      },
    },
  });
}

export function getSolicitudByToken(token: string) {
  return db.solicitud.findUnique({
    where: { token },
    include: {
      items: { orderBy: { orden: "asc" } },
      cotizaciones: { orderBy: { montoTotal: "asc" } },
    },
  });
}

export function getSolicitudById(id: string) {
  return db.solicitud.findUnique({
    where: { id },
    include: {
      items: { orderBy: { orden: "asc" } },
      cotizaciones: { orderBy: { montoTotal: "asc" } },
    },
  });
}

export function listSolicitudes() {
  return db.solicitud.findMany({
    orderBy: { createdAt: "desc" },
    include: { cotizaciones: true, items: true },
  });
}

export function marcarEnCotizacion(id: string) {
  return db.solicitud.update({
    where: { id },
    data: { estado: "EN_COTIZACION" },
  });
}

export function agregarCotizacion(
  solicitudId: string,
  data: {
    proveedorNombre: string;
    proveedorContacto: string;
    montoTotal: number;
    plazoEntrega?: string;
    ubicacion?: string;
    condiciones?: string;
  },
) {
  return db.cotizacionProveedor.create({
    data: { solicitudId, ...data },
  });
}

export function eliminarCotizacion(id: string) {
  return db.cotizacionProveedor.delete({ where: { id } });
}

/**
 * Calcula ahorro y fee contra la mejor cotización cargada, marca esa
 * cotización como ganadora y pasa la solicitud a COMPARACION_LISTA.
 */
export async function cerrarComparacion(solicitudId: string, conclusion: string) {
  const solicitud = await db.solicitud.findUniqueOrThrow({
    where: { id: solicitudId },
    include: { cotizaciones: true },
  });

  if (solicitud.cotizaciones.length === 0) {
    throw new Error("No hay cotizaciones alternativas cargadas todavía");
  }

  const mejor = solicitud.cotizaciones.reduce((min, c) =>
    c.montoTotal < min.montoTotal ? c : min,
  );

  const fee = calcularFee(solicitud.montoTotalOriginal ?? 0, mejor.montoTotal, {
    porcentajeAhorro: solicitud.feePorcentaje,
    pisoPorcentaje: solicitud.feePisoPorcentaje,
    techoPorcentaje: solicitud.feeTechoPorcentaje,
  });

  await db.$transaction([
    db.cotizacionProveedor.updateMany({
      where: { solicitudId },
      data: { esGanadora: false },
    }),
    db.cotizacionProveedor.update({
      where: { id: mejor.id },
      data: { esGanadora: true },
    }),
    db.solicitud.update({
      where: { id: solicitudId },
      data: {
        estado: "COMPARACION_LISTA",
        conclusion,
        ahorroEstimado: fee.ahorroEstimado,
        feeMonto: fee.feeMonto,
      },
    }),
  ]);

  return fee;
}

export async function marcarPagada(token: string) {
  const solicitud = await db.solicitud.findUnique({ where: { token } });
  if (!solicitud) throw new Error("Solicitud no encontrada");
  if (solicitud.estado !== "COMPARACION_LISTA") {
    throw new Error("La solicitud todavia no tiene una comparación lista para pagar");
  }

  return db.solicitud.update({
    where: { token },
    data: { estado: "PAGADA", pagadoEn: new Date() },
  });
}

export function cerrarSolicitud(id: string) {
  return db.solicitud.update({ where: { id }, data: { estado: "CERRADA" } });
}

export { FEE_CONFIG_DEFAULT };
