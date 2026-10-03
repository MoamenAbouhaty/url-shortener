const express = require("express");
const db = require("./database");
const { isValidUrl, generateCode } = require("./utils");

const app = express();

app.use(express.json());

/**
 * Create a shortened URL
 */
app.post("/shorten", (req, res) => {
  const { url } = req.body;

  // Validate before doing anything with storage
  if (typeof url !== "string" || !isValidUrl(url)) {
    return res.status(400).json({
      error: "Invalid URL",
    });
  }

  // Return the existing code if this URL was already shortened
  const existing = db
    .prepare("SELECT code FROM urls WHERE original_url = ?")
    .get(url);

  if (existing) {
    return res.status(200).json({
      code: existing.code,
      url,
    });
  }

  // Generate a unique code
  let code;

  do {
    code = generateCode();
  } while (
    db.prepare("SELECT 1 FROM urls WHERE code = ?").get(code)
  );

  // Store only after validation
  db.prepare(`
    INSERT INTO urls (code, original_url)
    VALUES (?, ?)
  `).run(code, url);

  return res.status(201).json({
    code,
    url,
  });
});

/**
 * Get statistics
 */
app.get("/stats/:code", (req, res) => {
  const { code } = req.params;

  const record = db
    .prepare(`
      SELECT code, original_url, clicks, created_at
      FROM urls
      WHERE code = ?
    `)
    .get(code);

  if (!record) {
    return res.status(404).json({
      error: "Short URL not found",
    });
  }

  return res.status(200).json(record);
});

/**
 * Redirect to original URL
 */
app.get("/:code", (req, res) => {
  const { code } = req.params;

  const record = db
    .prepare(`
      SELECT original_url
      FROM urls
      WHERE code = ?
    `)
    .get(code);

  if (!record) {
    return res.status(404).json({
      error: "Short URL not found",
    });
  }

  // Count the successful lookup
  db.prepare(`
    UPDATE urls
    SET clicks = clicks + 1
    WHERE code = ?
  `).run(code);

  // 302 is intentionally used; see README.
  return res.redirect(302, record.original_url);
});

module.exports = app;