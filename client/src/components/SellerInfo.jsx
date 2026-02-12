export default function SellerInfo({ name, rating, feedbackPercent, compact = false }) {
  if (!name) return <span className="text-text-muted text-xs">Unknown seller</span>;

  const feedback = feedbackPercent ? Number(feedbackPercent) : null;
  const isBelowAverage = feedback !== null && feedback < 95;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary truncate max-w-[100px]">{name}</span>
        {feedback !== null && (
          <span className={`text-xs font-medium ${isBelowAverage ? 'text-warning' : 'text-text-muted'}`}>
            {feedback.toFixed(1)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-text-primary">{name}</span>
      <div className="flex items-center gap-2">
        {feedback !== null && (
          <span
            className={`text-xs font-medium ${isBelowAverage ? 'text-warning' : 'text-deal-green'}`}
            title={isBelowAverage ? 'Below average seller rating' : 'Good seller rating'}
          >
            {isBelowAverage && (
              <svg className="w-3 h-3 inline mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            )}
            {feedback.toFixed(1)}% positive
          </span>
        )}
        {rating && (
          <span className="text-xs text-text-muted">
            Rating: {Number(rating).toFixed(1)}/5
          </span>
        )}
      </div>
    </div>
  );
}
