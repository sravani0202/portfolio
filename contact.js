"use strict";

const { handleContact } = require("../../contact-service");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, message: "Method not allowed." });
  }

  const rawBody = event.body || "";
  const body = event.isBase64Encoded
    ? Buffer.from(rawBody, "base64").toString("utf8")
    : rawBody;

  if (Buffer.byteLength(body, "utf8") > 12 * 1024) {
    return jsonResponse(413, { ok: false, message: "Your message is too long. Please shorten it and try again." });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return jsonResponse(400, { ok: false, message: "The message could not be read. Please try again." });
  }

  const ip = event.headers && event.headers["x-nf-client-connection-ip"];
  const result = await handleContact(payload, ip);
  return jsonResponse(result.status, result.body);
};
