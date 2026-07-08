"use server";

import { redirect } from "next/navigation";
import { crearSolicitud, type NuevoItem } from "@/lib/solicitudes";

export type EstadoFormulario = { error?: string } | undefined;

function numero(valor: FormDataEntryValue | null): number | null {
  if (valor === null) return null;
  const texto = valor.toString().trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

export async function crearSolicitudAction(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const tipo = formData.get("tipo") === "MATERIAL" ? "MATERIAL" : "SERVICIO";
  const clienteNombre = (formData.get("clienteNombre") as string | null)?.trim() ?? "";
  const clienteContacto = (formData.get("clienteContacto") as string | null)?.trim() ?? "";
  const zona = (formData.get("zona") as string | null)?.trim() ?? "";
  const montoTotalOriginal = numero(formData.get("montoTotalOriginal"));

  if (!clienteNombre || !clienteContacto || !zona) {
    return { error: "Completá tu nombre, un contacto y la zona del trabajo o entrega." };
  }
  if (!montoTotalOriginal || montoTotalOriginal <= 0) {
    return { error: "Ingresá el monto total del presupuesto que recibiste." };
  }

  const descripciones = formData.getAll("item_descripcion[]");
  const unidades = formData.getAll("item_unidad[]");
  const cantidades = formData.getAll("item_cantidad[]");
  const precios = formData.getAll("item_precioUnitario[]");
  const fletes = formData.getAll("item_flete[]");

  const items: NuevoItem[] = [];
  for (let i = 0; i < descripciones.length; i++) {
    const descripcion = descripciones[i]?.toString().trim();
    if (!descripcion) continue;
    items.push({
      descripcion,
      unidad: unidades[i]?.toString().trim() || "unidad",
      cantidad: numero(cantidades[i] ?? null) ?? 1,
      precioUnitario: numero(precios[i] ?? null),
      flete: numero(fletes[i] ?? null),
    });
  }

  if (items.length === 0) {
    return { error: "Agregá al menos un ítem (tarea o material) del presupuesto." };
  }

  const archivoFile = formData.get("archivo");
  let archivo: { nombre: string; tipo: string; datos: Uint8Array<ArrayBuffer> } | null = null;
  if (archivoFile instanceof File && archivoFile.size > 0) {
    const bytes = await archivoFile.arrayBuffer();
    archivo = {
      nombre: archivoFile.name,
      tipo: archivoFile.type || "application/octet-stream",
      datos: new Uint8Array(bytes),
    };
  }

  const solicitud = await crearSolicitud({
    tipo,
    clienteNombre,
    clienteContacto,
    zona,
    montoTotalOriginal,
    items,
    archivo,
  });

  redirect(`/seguimiento/${solicitud.token}`);
}
