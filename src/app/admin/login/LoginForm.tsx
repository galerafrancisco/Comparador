"use client";

import { useActionState } from "react";
import { loginAdminAction } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Contraseña de operador
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="campo-input mt-3"
        />
      </label>

      {state?.error ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold px-6 py-3 font-medium text-black hover:bg-gold-soft transition-colors disabled:opacity-60"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
