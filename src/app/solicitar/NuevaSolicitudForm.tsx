"use client";

import { useActionState, useState } from "react";
import { crearSolicitudAction } from "./actions";

type Fila = {
  descripcion: string;
  unidad: string;
  cantidad: string;
  precioUnitario: string;
  flete: string;
};

const filaVacia: Fila = {
  descripcion: "",
  unidad: "",
  cantidad: "1",
  precioUnitario: "",
  flete: "",
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-3 font-normal">{children}</div>
    </label>
  );
}

export default function NuevaSolicitudForm() {
  const [state, formAction, pending] = useActionState(crearSolicitudAction, undefined);
  const [tipo, setTipo] = useState<"SERVICIO" | "MATERIAL">("SERVICIO");
  const [filas, setFilas] = useState<Fila[]>([{ ...filaVacia }]);

  const esMaterial = tipo === "MATERIAL";

  function actualizarFila(index: number, campo: keyof Fila, valor: string) {
    setFilas((prev) =>
      prev.map((fila, i) => (i === index ? { ...fila, [campo]: valor } : fila)),
    );
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { ...filaVacia }]);
  }

  function quitarFila(index: number) {
    setFilas((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  return (
    <form action={formAction} className="space-y-10">
      <div>
        <label className="block text-sm font-medium">¿Qué tipo de presupuesto es?</label>
        <div className="mt-3 flex gap-3">
          <input type="hidden" name="tipo" value={tipo} />
          {(["SERVICIO", "MATERIAL"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setTipo(opcion)}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                tipo === opcion
                  ? "border-gold bg-gold text-black"
                  : "border-border text-muted hover:border-gold"
              }`}
            >
              {opcion === "SERVICIO" ? "Servicio / mano de obra" : "Materiales / productos"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Campo label="Tu nombre">
          <input
            name="clienteNombre"
            required
            className="campo-input"
            placeholder="Nombre y apellido / empresa"
          />
        </Campo>
        <Campo label="WhatsApp o email">
          <input
            name="clienteContacto"
            required
            className="campo-input"
            placeholder="+54 9 11 ..."
          />
        </Campo>
        <Campo label={esMaterial ? "Zona de entrega" : "Zona del trabajo"}>
          <input
            name="zona"
            required
            className="campo-input"
            placeholder="Ciudad / barrio"
          />
        </Campo>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Monto total del presupuesto que ya recibiste
        </label>
        <input
          name="montoTotalOriginal"
          required
          inputMode="decimal"
          className="campo-input mt-3 max-w-xs"
          placeholder="$"
        />
        <p className="mt-2 text-xs text-muted">
          Es el total que te cotizó el proveedor original. Sobre esta base calculamos el
          ahorro estimado.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            {esMaterial ? "Materiales del presupuesto" : "Tareas del presupuesto"}
          </label>
          <button
            type="button"
            onClick={agregarFila}
            className="text-sm text-gold hover:text-gold-soft"
          >
            + Agregar ítem
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {filas.map((fila, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-12"
            >
              <input
                className="campo-input sm:col-span-4"
                placeholder={esMaterial ? "Material (ej: cemento)" : "Tarea (ej: pintura interior)"}
                name="item_descripcion[]"
                value={fila.descripcion}
                onChange={(e) => actualizarFila(index, "descripcion", e.target.value)}
              />
              <input
                className="campo-input sm:col-span-2"
                placeholder="Unidad (m2, bolsa...)"
                name="item_unidad[]"
                value={fila.unidad}
                onChange={(e) => actualizarFila(index, "unidad", e.target.value)}
              />
              <input
                className="campo-input sm:col-span-2"
                placeholder="Cantidad"
                inputMode="decimal"
                name="item_cantidad[]"
                value={fila.cantidad}
                onChange={(e) => actualizarFila(index, "cantidad", e.target.value)}
              />
              <input
                className="campo-input sm:col-span-2"
                placeholder="Precio unit. (opcional)"
                inputMode="decimal"
                name="item_precioUnitario[]"
                value={fila.precioUnitario}
                onChange={(e) => actualizarFila(index, "precioUnitario", e.target.value)}
              />
              {esMaterial ? (
                <input
                  className="campo-input sm:col-span-1"
                  placeholder="Flete"
                  inputMode="decimal"
                  name="item_flete[]"
                  value={fila.flete}
                  onChange={(e) => actualizarFila(index, "flete", e.target.value)}
                />
              ) : (
                <input type="hidden" name="item_flete[]" value="" />
              )}
              <button
                type="button"
                onClick={() => quitarFila(index)}
                className="text-xs text-muted hover:text-foreground sm:col-span-1"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Presupuesto original (PDF, foto o planilla) — opcional
        </label>
        <input
          type="file"
          name="archivo"
          accept=".pdf,image/*,.xls,.xlsx,.csv"
          className="mt-3 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-foreground"
        />
        <p className="mt-2 text-xs text-muted">
          Lo guardamos para que el operador pueda revisarlo al armar la comparación.
        </p>
      </div>

      {state?.error ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-6 py-3 font-medium text-black hover:bg-gold-soft transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar presupuesto"}
      </button>
    </form>
  );
}
