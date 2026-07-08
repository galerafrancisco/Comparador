import { notFound } from "next/navigation";
import Link from "next/link";
import { getSolicitudByToken } from "@/lib/solicitudes";
import { formatearARS } from "@/lib/fee";
import { pagarFeeAction } from "./actions";

const ETIQUETAS_ESTADO: Record<string, { texto: string; clase: string }> = {
  NUEVA: { texto: "Recibido", clase: "bg-surface-2 text-muted" },
  EN_COTIZACION: { texto: "Consultando proveedores", clase: "bg-amber-950/40 text-amber-300" },
  COMPARACION_LISTA: { texto: "Comparación lista", clase: "bg-gold/20 text-gold" },
  PAGADA: { texto: "Proveedor revelado", clase: "bg-emerald-950/40 text-savings" },
  CERRADA: { texto: "Cerrada", clase: "bg-surface-2 text-muted" },
};

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const solicitud = await getSolicitudByToken(token);
  if (!solicitud) notFound();

  const estadoInfo = ETIQUETAS_ESTADO[solicitud.estado];
  const mejorCotizacion = solicitud.cotizaciones.find((c) => c.esGanadora) ?? solicitud.cotizaciones[0];
  const revelado = solicitud.estado === "PAGADA" || solicitud.estado === "CERRADA";
  const pagarConToken = pagarFeeAction.bind(null, solicitud.token);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">
            Solicitud {solicitud.token}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Hola {solicitud.clienteNombre.split(" ")[0]}, así va tu comparación
          </h1>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${estadoInfo.clase}`}>
          {estadoInfo.texto}
        </span>
      </div>

      <p className="mt-4 text-xs text-muted">
        Guardá este link para volver a consultar el estado: <br />
        <span className="text-foreground">comparo.app/seguimiento/{solicitud.token}</span>
      </p>

      <section className="mt-10 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-medium text-muted">Tu presupuesto original</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Tipo</p>
            <p className="mt-1">{solicitud.tipo === "MATERIAL" ? "Materiales" : "Servicio"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Zona</p>
            <p className="mt-1">{solicitud.zona}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Monto total presupuestado</p>
            <p className="mt-1 font-medium">{formatearARS(solicitud.montoTotalOriginal ?? 0)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {solicitud.items.map((item) => (
            <div key={item.id} className="flex justify-between border-t border-border pt-2 text-sm">
              <span>{item.descripcion}</span>
              <span className="text-muted">
                {item.cantidad} {item.unidad}
              </span>
            </div>
          ))}
        </div>

        {solicitud.archivoNombre ? (
          <p className="mt-4 text-xs text-muted">Adjuntaste: {solicitud.archivoNombre}</p>
        ) : null}
      </section>

      {solicitud.estado === "NUEVA" || solicitud.estado === "EN_COTIZACION" ? (
        <section className="mt-8 rounded-lg border border-dashed border-border p-6 text-sm text-muted">
          Estamos consultando proveedores de nuestra red para armar una comparación a igualdad
          de condiciones. Esto puede tardar hasta 48hs. Te avisaremos a{" "}
          <span className="text-foreground">{solicitud.clienteContacto}</span> apenas esté
          lista.
        </section>
      ) : null}

      {solicitud.estado === "COMPARACION_LISTA" && mejorCotizacion ? (
        <section className="mt-8 rounded-lg border border-gold/40 bg-surface p-6">
          <h2 className="text-lg font-semibold">Encontramos una alternativa más conveniente</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <p className="text-xs text-muted">Presupuesto original</p>
              <p className="mt-1 text-xl font-semibold">
                {formatearARS(solicitud.montoTotalOriginal ?? 0)}
              </p>
            </div>
            <div className="rounded-md border border-gold/40 bg-gold/10 p-4">
              <p className="text-xs text-muted">Alternativa propuesta (proveedor a confirmar)</p>
              <p className="mt-1 text-xl font-semibold text-gold">
                {formatearARS(mejorCotizacion.montoTotal)}
              </p>
              {mejorCotizacion.plazoEntrega ? (
                <p className="mt-1 text-xs text-muted">Plazo: {mejorCotizacion.plazoEntrega}</p>
              ) : null}
            </div>
          </div>

          <p className="mt-6 rounded-md bg-savings/10 px-4 py-3 text-sm text-savings">
            Ahorro estimado: {formatearARS(solicitud.ahorroEstimado ?? 0)}
          </p>

          {solicitud.conclusion ? (
            <p className="mt-4 text-sm leading-relaxed text-muted">{solicitud.conclusion}</p>
          ) : null}

          <div className="mt-8 rounded-md border border-border p-5">
            <p className="text-sm">
              Para conocer a este proveedor y sus datos de contacto, la comisión de Comparo
              es de{" "}
              <span className="font-semibold text-gold">
                {formatearARS(solicitud.feeMonto ?? 0)}
              </span>
              . Se cobra una sola vez, al revelar el proveedor — no cobramos nada por la
              comparación en sí.
            </p>
            <form action={pagarConToken} className="mt-4">
              <button
                type="submit"
                className="rounded-full bg-gold px-6 py-3 font-medium text-black hover:bg-gold-soft transition-colors"
              >
                Pagar comisión y ver proveedor
              </button>
              <p className="mt-2 text-xs text-muted">
                Pago simulado en esta versión piloto — no se procesa ningún cobro real todavía.
              </p>
            </form>
          </div>
        </section>
      ) : null}

      {revelado && mejorCotizacion ? (
        <section className="mt-8 rounded-lg border border-savings/40 bg-emerald-950/20 p-6">
          <h2 className="text-lg font-semibold text-savings">
            Comisión pagada — este es el proveedor
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Proveedor</p>
              <p className="mt-1 font-medium">{mejorCotizacion.proveedorNombre}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Contacto</p>
              <p className="mt-1 font-medium">{mejorCotizacion.proveedorContacto}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Monto cotizado</p>
              <p className="mt-1 font-medium">{formatearARS(mejorCotizacion.montoTotal)}</p>
            </div>
            {mejorCotizacion.plazoEntrega ? (
              <div>
                <p className="text-xs text-muted">Plazo</p>
                <p className="mt-1 font-medium">{mejorCotizacion.plazoEntrega}</p>
              </div>
            ) : null}
            {mejorCotizacion.ubicacion ? (
              <div>
                <p className="text-xs text-muted">Ubicación</p>
                <p className="mt-1 font-medium">{mejorCotizacion.ubicacion}</p>
              </div>
            ) : null}
            {mejorCotizacion.condiciones ? (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted">Condiciones</p>
                <p className="mt-1">{mejorCotizacion.condiciones}</p>
              </div>
            ) : null}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Comparo actuó como intermediario en esta comparación. La contratación final es
            directamente entre vos y el proveedor, quien es responsable exclusivo de la
            calidad y el cumplimiento de lo ofrecido.{" "}
            <Link href="/terminos" className="underline hover:text-foreground">
              Ver términos
            </Link>
            .
          </p>
        </section>
      ) : null}
    </div>
  );
}
