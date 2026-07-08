import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comparo | Comparación independiente de presupuestos",
  description:
    "Subí un presupuesto y recibí una comparación objetiva contra alternativas equivalentes. Pagás solo si te conviene.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
            <Link href="/" className="text-lg font-semibold tracking-tight whitespace-nowrap">
              Compar<span className="text-gold">o</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-xs text-muted sm:gap-6 sm:text-sm">
              <Link
                href="/#como-funciona"
                className="hidden whitespace-nowrap hover:text-foreground transition-colors sm:inline"
              >
                Cómo funciona
              </Link>
              <Link
                href="/terminos"
                className="hidden whitespace-nowrap hover:text-foreground transition-colors sm:inline"
              >
                Términos
              </Link>
              <Link
                href="/solicitar"
                className="whitespace-nowrap rounded-full bg-gold px-3 py-2 font-medium text-black hover:bg-gold-soft transition-colors sm:px-4"
              >
                Subir presupuesto
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-8 text-xs leading-relaxed text-muted">
            <p>
              Comparo actúa exclusivamente como intermediario entre clientes y proveedores.
              No vende materiales ni presta servicios en forma directa, y no garantiza la
              calidad, los plazos ni el cumplimiento de lo contratado — esa responsabilidad
              es exclusiva de cada proveedor.{" "}
              <Link href="/terminos" className="underline hover:text-foreground">
                Ver términos completos
              </Link>
              .
            </p>
            <p className="mt-3">
              <Link href="/admin/login" className="hover:text-foreground">
                Acceso operador
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
