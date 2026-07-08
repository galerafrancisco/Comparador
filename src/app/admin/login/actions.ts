"use server";

import { redirect } from "next/navigation";
import { crearSesionAdmin } from "@/lib/admin-auth";

export type EstadoLogin = { error?: string } | undefined;

export async function loginAdminAction(
  _prevState: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const password = (formData.get("password") as string | null) ?? "";

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Contraseña incorrecta." };
  }

  await crearSesionAdmin();
  redirect("/admin/dashboard");
}
