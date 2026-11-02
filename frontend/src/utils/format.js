// Formateador de moneda oficial para Pesos Colombianos (COP)
export function formatCOP(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ 0';
  return '$ ' + Number(amount).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
