import Link from "next/link";

const pasos = [
  {
    numero: "01",
    titulo: "Subís tu presupuesto",
    texto:
      "Cargás el presupuesto formal que ya recibiste de un proveedor o casa de materiales, con sus ítems, cantidades y condiciones.",
  },
  {
    numero: "02",
    titulo: "Armamos el pedido comparable",
    texto:
      "Ordenamos la información en un pedido estructurado (tarea, unidad, cantidad, zona) para poder cotizarlo en igualdad de condiciones.",
  },
  {
    numero: "03",
    titulo: "Consultamos alternativas",
    texto:
      "Contactamos proveedores de nuestra red que ya autorizaron recibir consultas puntuales, y reunimos cotizaciones equivalentes.",
  },
  {
    numero: "04",
    titulo: "Vas el ahorro estimado",
    texto:
      "Te mostramos una comparación clara con el ahorro estimado, sin revelar todavía qué proveedor lo ofrece.",
  },
  {
    numero: "05",
    titulo: "Decidís vos",
    texto:
      "Si no te sirve, no pagás nada. Si te conviene, pagás una comisión sobre el ahorro y te revelamos el proveedor para que contrates en forma directa.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-24">
        <p className="text-sm uppercase tracking-[0.2em] text-gold">
          Comparación independiente de presupuestos
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Antes de contratar, comparemos lo que ya te presupuestaron.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          Subís un presupuesto de servicios o materiales y te mostramos si hay una alternativa
          equivalente más conveniente. Solo cobramos si el ahorro es real — y solo cuando
          decidís usarlo.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/solicitar"
            className="rounded-full bg-gold px-6 py-3 font-medium text-black hover:bg-gold-soft transition-colors"
          >
            Subir mi presupuesto
          </Link>
          <Link
            href="#como-funciona"
            className="rounded-full border border-border px-6 py-3 text-foreground hover:border-gold transition-colors"
          >
            Ver cómo funciona
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 sm:grid-cols-3">
          <div>
            <p className="text-3xl font-semibold text-gold">0%</p>
            <p className="mt-2 text-sm text-muted">
              de costo si no aceptás la comparación. Nunca pagás por mirar.
            </p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-savings">Ahorro real</p>
            <p className="mt-2 text-sm text-muted">
              comparamos siempre a igualdad de tarea, unidad, cantidad y condiciones.
            </p>
          </div>
          <div>
            <p className="text-3xl font-semibold">Intermediarios puros</p>
            <p className="mt-2 text-sm text-muted">
              nunca vendemos ni ejecutamos el trabajo — solo conectamos y comparamos.
            </p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight">Cómo funciona</h2>
        <ol className="mt-10 space-y-8">
          {pasos.map((paso) => (
            <li key={paso.numero} className="flex gap-6">
              <span className="text-2xl font-semibold text-gold">{paso.numero}</span>
              <div>
                <h3 className="font-medium">{paso.titulo}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">¿Cómo cobramos?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Nuestra comisión se calcula como un porcentaje del ahorro estimado que te
            mostramos — nunca sobre el total del presupuesto. Tiene un piso mínimo y un techo
            máximo (siempre acotado a un porcentaje chico del presupuesto total), y se cobra en
            el momento en que aceptás ver al proveedor alternativo, antes de contratarlo. Si no
            te interesa, no pagás nada.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            ¿Tenés un presupuesto para comparar?
          </h2>
          <div className="mt-8">
            <Link
              href="/solicitar"
              className="rounded-full bg-gold px-6 py-3 font-medium text-black hover:bg-gold-soft transition-colors"
            >
              Empezar ahora
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
