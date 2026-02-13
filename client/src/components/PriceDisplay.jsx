export default function PriceDisplay({ price, shippingCost, shippingEstimated, baseline, gapPercent, showGap = true }) {
  const priceNum = Number(price);
  const shippingNum = shippingCost !== null && shippingCost !== undefined ? Number(shippingCost) : null;
  const shippingKnown = shippingNum !== null;
  const isEstimated = shippingEstimated === true;
  const totalNum = shippingKnown ? priceNum + shippingNum : priceNum;
  const hasShipping = shippingKnown && shippingNum > 0;
  const baselineNum = baseline ? Number(baseline) : null;
  const gap = gapPercent !== null && gapPercent !== undefined ? Number(gapPercent) : null;

  return (
    <div className="flex flex-col items-end">
      <span className="text-base font-bold text-text-primary">${priceNum.toFixed(2)}</span>
      {shippingKnown ? (
        <span className={`text-xs ${isEstimated ? 'text-text-muted/70 italic' : 'text-text-muted'}`}>
          {shippingNum === 0
            ? 'Free shipping'
            : isEstimated
              ? `~$${shippingNum.toFixed(2)} ship (est.)`
              : `+$${shippingNum.toFixed(2)} ship`}
        </span>
      ) : (
        <span className="text-xs text-warning">shipping unknown</span>
      )}
      {hasShipping && (
        <span className={`text-xs font-semibold ${isEstimated ? 'text-text-secondary/70' : 'text-text-secondary'}`}>
          {isEstimated ? '~' : ''}${totalNum.toFixed(2)} total
        </span>
      )}
      {baselineNum && showGap && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-text-muted">Mkt (w/ ship): ${baselineNum.toFixed(2)}</span>
          {gap !== null ? (
            <span
              className={`text-xs font-semibold ${
                gap > 0 ? 'text-deal-green' : gap < 0 ? 'text-price-up' : 'text-text-muted'
              }`}
              aria-label={gap > 0 ? `${gap.toFixed(1)}% below market` : `${Math.abs(gap).toFixed(1)}% above market`}
            >
              {gap > 0 ? '-' : '+'}{Math.abs(gap).toFixed(1)}%
            </span>
          ) : !shippingKnown ? (
            <span className="text-xs text-warning">% N/A</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
