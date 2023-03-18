function err(e) {
  throw new Error(e);
}

exports.makeSlug = (
  string = err(`Where is the string? 😒`),
  { lower = false, replacement = '-' } = {}
) => {
  string = string.replace(/\s/g, replacement);
  if (lower) {
    string = string.toLowerCase();
  }
  return string;
};
