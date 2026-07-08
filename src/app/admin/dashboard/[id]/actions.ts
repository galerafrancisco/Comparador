"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  agregarCotizacion,
  cerrarComparacion,
  cerrarSolicitud,
  eliminarCotizacion,
  marcarEnCotizacion,
} from "@/lib/solicitudes";

export type EstadoAccionAdmin = { error?: string } | undefined;

function numero(valor: FormDataEntryValue | null): number | null {
  if (valor === null) return null;
  const texto = valor.toString().trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

export async function iniciarCotizacionAction(id: string) {
  await requireAdmin();
  await marcarEnCotizacion(id);
  revalidatePath(`/admin/dashboard/${id}`);
}

export async function agregarCotizacionAction(
  id: string,
  _prevState: EstadoAccionAdmin,
  formData: FormData,
): Promise<EstadoAccionAdmin> {
  await requireAdmin();

  const proveedorNombre = (formData.get("proveedorNombre") as string | null)?.trim();
  const proveedorContacto = (formData.get("proveedorContacto") as string | null)?.trim();
  const montoTotal = numero(formData.get("montoTotal"));

  if (!proveedorNombre || !proveedorContacto) {
    return { error: "Nombre y contacto del proveedor son obligatorios." };
  }
  if (!montoTotal || montoTotal <= 0) {
    return { error: "Ingresá el monto total cotizado por el proveedor." };
  }

  await agregarCotizacion(id, {
    proveedorNombre,
    proveedorContacto,
    montoTotal,
    plazoEntrega: (formData.get("plazoEntrega") as string | null)?.trim() || undefined,
    ubicacion: (formData.get("ubicacion") as string | null)?.trim() || undefined,
    condiciones: (formData.get("condiciones") as string | null)?.trim() || undefined,
  });

  revalidatePath(`/admin/dashboard/${id}`);
}

export async function eliminarCotizacionAction(id: string, cotizacionId: string) {
  await requireAdmin();
  await eliminarCotizacion(cotizacionId);
  revalidatePath(`/admin/dashboard/${id}`);
}

export async function cerrarComparacionAction(
  id: string,
  _prevState: EstadoAccionAdmin,
  formData: FormData,
): Promise<EstadoAccionAdmin> {
  await requireAdmin();

  const conclusion = (formData.get("conclusion") as string | null)?.trim();
  if (!conclusion) {
    return { error: "Escribí una conclusión breve para el cliente." };
  }

  try {
    await cerrarComparacion(id, conclusion);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo cerrar la comparación." };
  }

  revalidatePath(`/admin/dashboard/${id}`);
}

export async function cerrarSolicitudAction(id: string) {
  await requireAdmin();
  await cerrarSolicitud(id);
  revalidatePath(`/admin/dashboard/${id}`);
}
