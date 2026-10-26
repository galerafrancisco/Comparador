This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Mi Día (recordatorios) — `/recordatorios`

App de checklists y recordatorios personal, instalable en el celular (PWA). Es estática y vive en
`public/recordatorios/` (más `public/recordatorios-sw.js`); no usa la base de datos: los datos se
guardan en el dispositivo (con copia de seguridad descargable desde Ajustes).

- Anotar o dictar en lenguaje natural: detecta fecha, hora, momento del día, repetición, ámbito
  (Barrio Cardano, Obras, Grupo HAT, Mi casa, Casa de mis papás, Personal), tipo (comprar, llevar,
  traer, ir a buscar, coordinar, reunión, trámite) y lugar donde se resuelve. Las listas
  ("comprar tornillos, silicona y cemento") se separan en ítems.
- Vistas: Hoy, Próximo, "Voy a…" (todo lo que se resuelve en un lugar) y Listas por ámbito.
- Repasos diarios configurables (8:00, 13:30, 20:30) para tildar o reprogramar lo pendiente.
- Notificaciones con la app abierta o en segundo plano, y exportación `.ics` con alarmas
  para el calendario del celular, que suenan aunque la app esté cerrada.
