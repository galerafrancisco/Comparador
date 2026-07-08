"use server";

import { redirect } from "next/navigation";
import { cerrarSesionAdmin } from "@/lib/admin-auth";

export async function logoutAdminAction() {
  await cerrarSesionAdmin();
  redirect("/admin/login");
}
