const crypto = require("crypto");

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function generateCode(length = 6) {
  return crypto
    .randomBytes(8)
    .toString("base64url")
    .slice(0, length);
}

module.exports = {
  isValidUrl,
  generateCode,
};