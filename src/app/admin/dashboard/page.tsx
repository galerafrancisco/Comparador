import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listSolicitudes } from "@/lib/solicitudes";
import { formatearARS } from "@/lib/fee";
import { logoutAdminAction } from "../actions";

const ETIQUETAS_ESTADO: Record<string, string> = {
  NUEVA: "Recibido",
  EN_COTIZACION: "Consultando",
  COMPARACION_LISTA: "Comparación lista",
  PAGADA: "Pagada",
  CERRADA: "Cerrada",
};

export const metadata = { title: "Panel operador | Comparo" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const solicitudes = await listSolicitudes();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Solicitudes</h1>
        <form action={logoutAdminAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Monto original</th>
              <th className="px-4 py-3">Cotizaciones</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div>{s.clienteNombre}</div>
                  <div className="text-xs text-muted">{s.clienteContacto}</div>
                </td>
                <td className="px-4 py-3">{s.tipo === "MATERIAL" ? "Materiales" : "Servicio"}</td>
                <td className="px-4 py-3">{s.zona}</td>
                <td className="px-4 py-3">{formatearARS(s.montoTotalOriginal ?? 0)}</td>
                <td className="px-4 py-3">{s.cotizaciones.length}</td>
                <td className="px-4 py-3">{ETIQUETAS_ESTADO[s.estado]}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/dashboard/${s.id}`} className="text-gold hover:text-gold-soft">
                    Gestionar
                  </Link>
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Todavía no hay solicitudes cargadas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
