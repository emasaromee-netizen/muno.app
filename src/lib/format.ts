// Formato Pesos Argentinos: por defecto sin decimales, separador de miles ".": "$1.500"
// Si decimals=true: "$ 1.500,00"
export const formatARS = (n: number | string, opts: { decimals?: boolean } = {}) => {
  const num = typeof n === "string" ? Number(n.replace(/[^\d.-]/g, "")) : n;
  if (!Number.isFinite(num)) return "$0";
  const decimals = opts.decimals === true;
  const formatter = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  return decimals ? `$ ${formatter.format(num)}` : `$${formatter.format(num)}`;
};
