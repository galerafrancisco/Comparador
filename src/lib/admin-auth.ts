import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "hat_admin_session";

export async function crearSesionAdmin() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Falta ADMIN_SESSION_SECRET en el entorno");

  const store = await cookies();
  store.set(COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function cerrarSesionAdmin() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function estaAutenticadoComoAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === secret;
}

export async function requireAdmin() {
  const ok = await estaAutenticadoComoAdmin();
  if (!ok) redirect("/admin/login");
}
