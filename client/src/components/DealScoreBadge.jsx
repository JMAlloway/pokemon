export default function DealScoreBadge({ score, size = 'md' }) {
  if (score === null || score === undefined) return null;

  const numScore = Number(score);
  let bgColor, textColor;

  if (numScore >= 70) {
    bgColor = 'bg-deal-green/20';
    textColor = 'text-deal-green';
  } else if (numScore >= 40) {
    bgColor = 'bg-typo-amber/20';
    textColor = 'text-typo-amber';
  } else {
    bgColor = 'bg-bg-tertiary';
    textColor = 'text-text-secondary';
  }

  const sizeClasses = size === 'lg'
    ? 'text-lg font-bold px-3 py-1.5'
    : size === 'sm'
      ? 'text-xs font-semibold px-1.5 py-0.5'
      : 'text-sm font-bold px-2 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-md ${bgColor} ${textColor} ${sizeClasses}`}
      title={`Deal score: ${numScore}/100`}
      aria-label={`Deal score ${numScore} out of 100`}
    >
      {numScore}
    </span>
  );
}
