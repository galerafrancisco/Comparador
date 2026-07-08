export const metadata = {
  title: "Términos y condiciones | Comparo",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Términos y condiciones</h1>
      <p className="mt-4 text-sm text-muted">Última actualización: versión piloto / MVP.</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-medium text-gold">1. Naturaleza del servicio</h2>
          <p className="mt-2 text-muted">
            Comparo es una plataforma de corretaje/intermediación. Su función es comparar un
            presupuesto entregado por el usuario contra alternativas de proveedores de su red,
            a igualdad de condiciones (misma tarea, unidad, cantidad y zona en la medida de lo
            posible). Comparo no vende materiales, no presta servicios de construcción,
            arquitectura ni ningún rubro afín en forma directa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-gold">2. Responsabilidad sobre lo contratado</h2>
          <p className="mt-2 text-muted">
            Cada proveedor listado o contactado por Comparo es responsable, en forma exclusiva
            y excluyente, de la calidad, los plazos, el cumplimiento y cualquier otro aspecto
            de los materiales o servicios que ofrezca y entregue. Comparo no garantiza ni
            responde por la calidad, idoneidad, legalidad o resultado de lo contratado entre
            el usuario y el proveedor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-gold">3. Comisión por el servicio de comparación</h2>
          <p className="mt-2 text-muted">
            Comparo cobra una comisión calculada como un porcentaje del ahorro estimado que
            surge de la comparación presentada, con un piso mínimo y un techo máximo expresados
            como porcentaje del presupuesto original. La comisión se genera y se cobra en el
            momento en que el usuario acepta conocer al proveedor alternativo, con
            independencia de que luego decida contratarlo o no. Comparo no participa ni
            interviene en el pago del servicio o material contratado entre el usuario y el
            proveedor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-gold">4. Datos de contacto de proveedores</h2>
          <p className="mt-2 text-muted">
            La identidad y los datos de contacto del proveedor alternativo se revelan
            únicamente después de abonada la comisión correspondiente. Antes de ese momento,
            Comparo se reserva esa información.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-gold">5. Proveedores de la red</h2>
          <p className="mt-2 text-muted">
            Los proveedores son contactados por Comparo únicamente cuando dieron su
            autorización previa (opt-in) para recibir consultas puntuales por pedidos
            concretos. Comparo no mantiene ni garantiza un catálogo permanente de precios.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-gold">6. Aceptación</h2>
          <p className="mt-2 text-muted">
            Al utilizar la plataforma, el usuario declara conocer y aceptar que Comparo actúa
            exclusivamente como intermediario, y que la relación contractual por el servicio o
            material finalmente elegido se establece directamente entre el usuario y el
            proveedor.
          </p>
        </section>
      </div>
    </div>
  );
}
