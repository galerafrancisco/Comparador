export type FeeConfig = {
  porcentajeAhorro: number;
  pisoPorcentaje: number;
  techoPorcentaje: number;
};

export const FEE_CONFIG_DEFAULT: FeeConfig = {
  porcentajeAhorro: 0.2,
  pisoPorcentaje: 0.03,
  techoPorcentaje: 0.07,
};

export type FeeResult = {
  ahorroEstimado: number;
  feeCalculado: number;
  feePiso: number;
  feeTecho: number;
  feeMonto: number;
  porcentajeSobreAhorro: number;
};

/**
 * Fee = 20% del ahorro estimado, con piso y techo expresados como % del
 * presupuesto original (para no desactualizarse con la inflación).
 */
export function calcularFee(
  montoTotalOriginal: number,
  montoMejorAlternativa: number,
  config: FeeConfig = FEE_CONFIG_DEFAULT,
): FeeResult {
  const ahorroEstimado = Math.max(0, montoTotalOriginal - montoMejorAlternativa);

  const feePiso = montoTotalOriginal * config.pisoPorcentaje;
  const feeTecho = montoTotalOriginal * config.techoPorcentaje;
  const feeCalculado = ahorroEstimado * config.porcentajeAhorro;

  const feeMonto = Math.min(Math.max(feeCalculado, feePiso), feeTecho);

  return {
    ahorroEstimado,
    feeCalculado,
    feePiso,
    feeTecho,
    feeMonto,
    porcentajeSobreAhorro: ahorroEstimado > 0 ? feeMonto / ahorroEstimado : 0,
  };
}

export function formatearARS(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
}
