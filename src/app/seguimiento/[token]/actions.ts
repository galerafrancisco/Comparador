"use server";

import { revalidatePath } from "next/cache";
import { marcarPagada } from "@/lib/solicitudes";

export async function pagarFeeAction(token: string) {
  await marcarPagada(token);
  revalidatePath(`/seguimiento/${token}`);
}
