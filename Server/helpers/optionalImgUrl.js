function optionalImgUrl(value) {
  if (value === undefined) return undefined;
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

module.exports = { optionalImgUrl };
