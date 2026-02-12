export default function PriceDisplay({ price, baseline, gapPercent, showGap = true }) {
  const priceNum = Number(price);
  const baselineNum = baseline ? Number(baseline) : null;
  const gap = gapPercent !== null && gapPercent !== undefined ? Number(gapPercent) : null;

  return (
    <div className="flex flex-col">
      <span className="text-base font-bold text-text-primary">${priceNum.toFixed(2)}</span>
      {baselineNum && showGap && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-text-muted">Mkt: ${baselineNum.toFixed(2)}</span>
          {gap !== null && (
            <span
              className={`text-xs font-semibold ${
                gap > 0 ? 'text-deal-green' : gap < 0 ? 'text-price-up' : 'text-text-muted'
              }`}
              aria-label={gap > 0 ? `${gap.toFixed(1)}% below market` : `${Math.abs(gap).toFixed(1)}% above market`}
            >
              {gap > 0 ? '-' : '+'}{Math.abs(gap).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
