import LoginForm from "./LoginForm";

export const metadata = { title: "Acceso operador | Comparo" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Acceso operador</h1>
      <p className="mt-2 text-sm text-muted">
        Panel interno para gestionar solicitudes y cargar cotizaciones de proveedores.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
