"use client";

import { useActionState } from "react";
import { agregarCotizacionAction } from "./actions";

export default function AgregarCotizacionForm({ id }: { id: string }) {
  const accionConId = agregarCotizacionAction.bind(null, id);
  const [state, formAction, pending] = useActionState(accionConId, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input name="proveedorNombre" placeholder="Nombre del proveedor" className="campo-input" />
      <input
        name="proveedorContacto"
        placeholder="Contacto (whatsapp/email)"
        className="campo-input"
      />
      <input
        name="montoTotal"
        placeholder="Monto total cotizado"
        inputMode="decimal"
        className="campo-input"
      />
      <input name="plazoEntrega" placeholder="Plazo (opcional)" className="campo-input" />
      <input name="ubicacion" placeholder="Ubicación (opcional)" className="campo-input" />
      <input
        name="condiciones"
        placeholder="Condiciones / notas (opcional)"
        className="campo-input sm:col-span-2"
      />

      {state?.error ? (
        <p className="sm:col-span-2 text-sm text-red-300">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 rounded-full border border-gold px-4 py-2 text-sm text-gold hover:bg-gold hover:text-black transition-colors disabled:opacity-60"
      >
        {pending ? "Guardando..." : "+ Agregar cotización"}
      </button>
    </form>
  );
}
