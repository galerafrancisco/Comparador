"use client";

import { useActionState } from "react";
import { cerrarComparacionAction } from "./actions";

export default function CerrarComparacionForm({ id }: { id: string }) {
  const accionConId = cerrarComparacionAction.bind(null, id);
  const [state, formAction, pending] = useActionState(accionConId, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="conclusion"
        rows={3}
        placeholder="Conclusión breve para el cliente (plazos, condiciones clave, por qué se compara bien)"
        className="campo-input"
      />
      {state?.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-black hover:bg-gold-soft transition-colors disabled:opacity-60"
      >
        {pending ? "Calculando..." : "Cerrar comparación y calcular fee"}
      </button>
    </form>
  );
}
