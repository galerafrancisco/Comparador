-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NUEVA',
    "clienteNombre" TEXT NOT NULL,
    "clienteContacto" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "archivoNombre" TEXT,
    "archivoTipo" TEXT,
    "archivoDatos" BLOB,
    "montoTotalOriginal" REAL,
    "conclusion" TEXT,
    "feePorcentaje" REAL NOT NULL DEFAULT 0.20,
    "feePisoPorcentaje" REAL NOT NULL DEFAULT 0.03,
    "feeTechoPorcentaje" REAL NOT NULL DEFAULT 0.07,
    "ahorroEstimado" REAL,
    "feeMonto" REAL,
    "pagadoEn" DATETIME
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitudId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "precioUnitario" REAL,
    "flete" REAL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Item_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CotizacionProveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitudId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedorNombre" TEXT NOT NULL,
    "proveedorContacto" TEXT NOT NULL,
    "montoTotal" REAL NOT NULL,
    "plazoEntrega" TEXT,
    "ubicacion" TEXT,
    "condiciones" TEXT,
    "esGanadora" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CotizacionProveedor_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_token_key" ON "Solicitud"("token");
