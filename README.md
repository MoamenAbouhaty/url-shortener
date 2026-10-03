# URL Shortener

A simple HTTP service that converts long URLs into short codes and redirects users to the original URL.

## Features

* Create a short URL from a valid HTTP/HTTPS URL.
* Redirect from a short code to the original URL.
* Count how many times a short URL has been followed.
* Return `404 Not Found` for unknown codes.
* Reject malformed URLs with `400 Bad Request`.
* Prevent duplicate short codes for the same original URL.
* Persist data using SQLite.

## API

### Create a short URL

```http
POST /shorten
Content-Type: application/json
```

Request:

```json
{
  "url": "https://example.com/very/long/url"
}
```

Response:

```json
{
  "code": "aB3xYz",
  "url": "https://example.com/very/long/url"
}
```

A previously submitted URL returns its existing short code instead of creating another record.

### Follow a short URL

```http
GET /:code
```

A valid code returns a `302 Found` redirect to the original URL.

### Get statistics

```http
GET /stats/:code
```

Example response:

```json
{
  "code": "aB3xYz",
  "original_url": "https://example.com/very/long/url",
  "clicks": 5,
  "created_at": "2026-10-03 05:00:00"
}
```

## Error Handling

### Invalid URL

Malformed or unsupported URLs return:

```http
400 Bad Request
```

The URL is validated before any database record is created.

Only `http://` and `https://` URLs are accepted.

### Unknown code

An unknown short code returns:

```http
404 Not Found
```

It never returns an empty `200 OK` response.

## Redirect Choice: 302 Found

This service deliberately uses **302 Found** rather than `301 Moved Permanently`.

A `301` response communicates that the resource has moved permanently and can be cached by browsers and other intermediaries. Once clients cache a permanent redirect, changing the destination associated with a short code can become difficult to control.

A `302` response represents a temporary redirect and is therefore a safer choice for a URL-shortening service where the destination may need to change in the future.

Because redirect status codes can affect browser and intermediary caching behavior, the choice is made deliberately rather than treating `301` and `302` as interchangeable.

## Duplicate URLs

The `original_url` column has a `UNIQUE` constraint.

Before creating a new short code, the service checks whether the URL already exists. If it does, the existing short code is returned.

Therefore, submitting the same URL twice does not silently create two different short codes.

## Testing

Run:

```bash
npm test
```

The test suite verifies:

* URL creation
* URL validation
* `400` for malformed URLs
* No storage of malformed URLs
* Duplicate URL handling
* `302` redirects
* `404` for unknown codes
* Click counting
* Statistics for valid codes
* `404` for unknown statistics codes

## Running the Server

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The service runs on:

```text
http://localhost:3000
```

For development:

```bash
npm run dev
```
