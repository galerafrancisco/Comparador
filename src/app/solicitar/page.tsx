import NuevaSolicitudForm from "./NuevaSolicitudForm";

export const metadata = {
  title: "Subir presupuesto | Comparo",
};

export default function SolicitarPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contanos qué te presupuestaron</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Con estos datos armamos un pedido comparable y consultamos alternativas equivalentes en
        nuestra red de proveedores. No te cobramos nada por esto — solo si después decidís
        conocer al proveedor alternativo.
      </p>

      <div className="mt-12">
        <NuevaSolicitudForm />
      </div>
    </div>
  );
}
