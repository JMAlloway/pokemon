const RARITY_VALUES = ['common', 'uncommon', 'rare', 'holoRare', 'other'];
const CONDITION_VALUES = ['mint', 'nearMint', 'excellent', 'good', 'fair', 'poor'];
const FREQUENCY_VALUES = ['manual', 'hourly', 'fourHourly', 'daily', 'weekly'];

export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

export function validateSearchQuery(req, res, next) {
  const { cardName, set, rarity, condition, searchFrequency, priceThresholdPercent } = req.body;

  if (!cardName || typeof cardName !== 'string' || cardName.trim().length === 0) {
    return res.status(400).json({ error: 'Card name is required' });
  }
  if (cardName.length > 255) {
    return res.status(400).json({ error: 'Card name must be 255 characters or fewer' });
  }
  if (set && set.length > 100) {
    return res.status(400).json({ error: 'Set name must be 100 characters or fewer' });
  }
  if (rarity && !RARITY_VALUES.includes(rarity)) {
    return res.status(400).json({ error: `Invalid rarity. Must be one of: ${RARITY_VALUES.join(', ')}` });
  }
  if (condition && !CONDITION_VALUES.includes(condition)) {
    return res.status(400).json({ error: `Invalid condition. Must be one of: ${CONDITION_VALUES.join(', ')}` });
  }
  if (searchFrequency && !FREQUENCY_VALUES.includes(searchFrequency)) {
    return res.status(400).json({ error: `Invalid frequency. Must be one of: ${FREQUENCY_VALUES.join(', ')}` });
  }
  if (priceThresholdPercent !== undefined && priceThresholdPercent !== null) {
    const threshold = Number(priceThresholdPercent);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({ error: 'Price threshold must be between 0 and 100' });
    }
  }

  req.body.cardName = sanitizeString(cardName);
  if (set) req.body.set = sanitizeString(set);
  next();
}

export function validateRegistration(req, res, next) {
  const { username, email, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (username.length > 100) {
    return res.status(400).json({ error: 'Username must be 100 characters or fewer' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  req.body.username = sanitizeString(username);
  req.body.email = email.toLowerCase().trim();
  next();
}
