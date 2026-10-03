const request = require("supertest");
const app = require("../src/app");
const db = require("../src/database");

beforeEach(() => {
  db.prepare("DELETE FROM urls").run();
});

afterAll(() => {
  db.close();
});

describe("URL Shortener API", () => {
  test("creates a short URL", async () => {
    const response = await request(app)
      .post("/shorten")
      .send({
        url: "https://example.com/very/long/path",
      });

    expect(response.status).toBe(201);
    expect(response.body.code).toBeDefined();
    expect(response.body.url).toBe(
      "https://example.com/very/long/path"
    );
  });

  test("rejects malformed URLs with 400", async () => {
    const response = await request(app)
      .post("/shorten")
      .send({
        url: "not-a-valid-url",
      });

    expect(response.status).toBe(400);

    const count = db
      .prepare("SELECT COUNT(*) AS count FROM urls")
      .get();

    expect(count.count).toBe(0);
  });

  test("does not create two codes for the same URL", async () => {
    const url = "https://example.com/same-url";

    const first = await request(app)
      .post("/shorten")
      .send({ url });

    const second = await request(app)
      .post("/shorten")
      .send({ url });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);

    expect(second.body.code).toBe(first.body.code);

    const count = db
      .prepare("SELECT COUNT(*) AS count FROM urls WHERE original_url = ?")
      .get(url);

    expect(count.count).toBe(1);
  });

  test("returns 404 for an unknown code", async () => {
    const response = await request(app)
      .get("/doesnotexist");

    expect(response.status).toBe(404);
  });

  test("redirects to the original URL with 302", async () => {
    const createResponse = await request(app)
      .post("/shorten")
      .send({
        url: "https://example.com/redirect-test",
      });

    const code = createResponse.body.code;

    const response = await request(app)
      .get(`/${code}`)
      .redirects(0);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      "https://example.com/redirect-test"
    );
  });

  test("increments the click count", async () => {
    const createResponse = await request(app)
      .post("/shorten")
      .send({
        url: "https://example.com/count-test",
      });

    const code = createResponse.body.code;

    await request(app).get(`/${code}`).redirects(0);
    await request(app).get(`/${code}`).redirects(0);
    await request(app).get(`/${code}`).redirects(0);

    const stats = await request(app)
      .get(`/stats/${code}`);

    expect(stats.status).toBe(200);
    expect(stats.body.clicks).toBe(3);
  });

  test("returns 404 for stats of an unknown code", async () => {
    const response = await request(app)
      .get("/stats/unknown");

    expect(response.status).toBe(404);
  });
});