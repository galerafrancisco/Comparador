import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getSolicitudById } from "@/lib/solicitudes";
import { calcularFee, formatearARS } from "@/lib/fee";
import { iniciarCotizacionAction, eliminarCotizacionAction, cerrarSolicitudAction } from "./actions";
import AgregarCotizacionForm from "./AgregarCotizacionForm";
import CerrarComparacionForm from "./CerrarComparacionForm";

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const solicitud = await getSolicitudById(id);
  if (!solicitud) notFound();

  const puedeCargarCotizaciones = solicitud.estado === "NUEVA" || solicitud.estado === "EN_COTIZACION";
  const puedeCerrarComparacion = puedeCargarCotizaciones && solicitud.cotizaciones.length > 0;
  const iniciarConId = iniciarCotizacionAction.bind(null, id);
  const cerrarSolicitudConId = cerrarSolicitudAction.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <Link href="/admin/dashboard" className="text-sm text-muted hover:text-foreground">
        ← Volver a solicitudes
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{solicitud.clienteNombre}</h1>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
          {solicitud.estado}
        </span>
      </div>

      <section className="mt-8 grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Contacto</p>
          <p className="mt-1">{solicitud.clienteContacto}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Zona</p>
          <p className="mt-1">{solicitud.zona}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Tipo</p>
          <p className="mt-1">{solicitud.tipo === "MATERIAL" ? "Materiales" : "Servicio"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Monto original</p>
          <p className="mt-1 font-medium">{formatearARS(solicitud.montoTotalOriginal ?? 0)}</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium text-muted">Ítems del presupuesto</h2>
        <div className="mt-4 space-y-2 text-sm">
          {solicitud.items.map((item) => (
            <div key={item.id} className="flex justify-between border-t border-border pt-2">
              <span>{item.descripcion}</span>
              <span className="text-muted">
                {item.cantidad} {item.unidad}
                {item.precioUnitario ? ` · ${formatearARS(item.precioUnitario)}` : ""}
              </span>
            </div>
          ))}
        </div>
        {solicitud.archivoNombre ? (
          <p className="mt-4 text-xs text-muted">Archivo adjunto: {solicitud.archivoNombre}</p>
        ) : null}
      </section>

      {solicitud.estado === "NUEVA" ? (
        <form action={iniciarConId} className="mt-6">
          <button
            type="submit"
            className="rounded-full border border-gold px-5 py-2 text-sm text-gold hover:bg-gold hover:text-black transition-colors"
          >
            Marcar como "consultando proveedores"
          </button>
        </form>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Cotizaciones alternativas cargadas</h2>

        <div className="mt-4 space-y-3">
          {solicitud.cotizaciones.map((c) => {
            const fee = calcularFee(solicitud.montoTotalOriginal ?? 0, c.montoTotal, {
              porcentajeAhorro: solicitud.feePorcentaje,
              pisoPorcentaje: solicitud.feePisoPorcentaje,
              techoPorcentaje: solicitud.feeTechoPorcentaje,
            });
            const eliminarConIds = eliminarCotizacionAction.bind(null, id, c.id);
            return (
              <div
                key={c.id}
                className={`rounded-lg border p-4 ${
                  c.esGanadora ? "border-savings/50 bg-emerald-950/10" : "border-border bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.proveedorNombre}</p>
                    <p className="text-xs text-muted">{c.proveedorContacto}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatearARS(c.montoTotal)}</p>
                    <p className="text-xs text-muted">
                      ahorro {formatearARS(fee.ahorroEstimado)} · fee {formatearARS(fee.feeMonto)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                  {c.plazoEntrega ? <span>Plazo: {c.plazoEntrega}</span> : null}
                  {c.ubicacion ? <span>Ubicación: {c.ubicacion}</span> : null}
                  {c.condiciones ? <span>{c.condiciones}</span> : null}
                  {c.esGanadora ? <span className="text-savings">Ganadora</span> : null}
                </div>
                {puedeCargarCotizaciones ? (
                  <form action={eliminarConIds} className="mt-2">
                    <button type="submit" className="text-xs text-muted hover:text-red-300">
                      Quitar
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
          {solicitud.cotizaciones.length === 0 ? (
            <p className="text-sm text-muted">Todavía no cargaste cotizaciones alternativas.</p>
          ) : null}
        </div>

        {puedeCargarCotizaciones ? (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h3 className="text-sm font-medium">Cargar cotización de proveedor</h3>
            <div className="mt-4">
              <AgregarCotizacionForm id={id} />
            </div>
          </div>
        ) : null}
      </section>

      {puedeCerrarComparacion ? (
        <section className="mt-8 rounded-lg border border-gold/40 bg-surface p-6">
          <h2 className="text-lg font-semibold">Cerrar comparación</h2>
          <p className="mt-2 text-sm text-muted">
            Se toma la cotización más baja como ganadora, se calcula el ahorro y el fee, y el
            cliente ya puede ver la comparación (sin el proveedor) en su link de seguimiento.
          </p>
          <div className="mt-4">
            <CerrarComparacionForm id={id} />
          </div>
        </section>
      ) : null}

      {solicitud.estado === "COMPARACION_LISTA" || solicitud.estado === "PAGADA" ? (
        <section className="mt-8 rounded-lg border border-border p-6">
          <h2 className="text-sm font-medium text-muted">Resumen de comparación</h2>
          <p className="mt-2 text-sm">{solicitud.conclusion}</p>
          <div className="mt-4 flex gap-6 text-sm">
            <span>Ahorro estimado: {formatearARS(solicitud.ahorroEstimado ?? 0)}</span>
            <span>Fee: {formatearARS(solicitud.feeMonto ?? 0)}</span>
          </div>
          {solicitud.estado === "PAGADA" ? (
            <form action={cerrarSolicitudConId} className="mt-4">
              <button type="submit" className="text-sm text-muted hover:text-foreground">
                Marcar solicitud como cerrada
              </button>
            </form>
          ) : (
            <p className="mt-4 text-xs text-muted">
              Esperando a que el cliente pague la comisión desde su link de seguimiento.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
