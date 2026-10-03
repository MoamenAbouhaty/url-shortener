const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`URL Shortener running on http://localhost:${PORT}`);
});