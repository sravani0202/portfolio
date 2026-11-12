"use strict";

require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const recipient = process.env.CONTACT_EMAIL || "ojjalasravani@gmail.com";
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASS;
const smtpReady = Boolean(smtpUser && smtpPassword);
const mailTransport = smtpReady
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    })
  : null;

const requestWindowMs = 15 * 60 * 1000;
const requestLimit = 5;
const requestsByIp = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "12kb" }));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/script.js", (req, res) => res.sendFile(path.join(__dirname, "script.js")));
app.get("/assets/profile.png", (req, res) => res.sendFile(path.join(__dirname, "assets", "profile.png")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, emailReady: smtpReady });
});

app.post("/api/contact", async (req, res) => {
  const now = Date.now();
  const ip = req.ip;
  const previous = requestsByIp.get(ip);
  const entry = previous && now - previous.startedAt < requestWindowMs
    ? previous
    : { startedAt: now, count: 0 };

  entry.count += 1;
  requestsByIp.set(ip, entry);

  if (entry.count > requestLimit) {
    return res.status(429).json({ ok: false, message: "Too many messages were sent. Please try again later." });
  }

  const { name, email, subject, message } = req.body || {};
  const values = { name, email, subject, message };
  const limits = { name: 100, email: 254, subject: 150, message: 5000 };
  const cleaned = {};

  for (const [field, limit] of Object.entries(limits)) {
    if (typeof values[field] !== "string") {
      return res.status(400).json({ ok: false, message: "Please complete all contact form fields." });
    }

    cleaned[field] = values[field].trim();
    if (!cleaned[field] || cleaned[field].length > limit) {
      return res.status(400).json({ ok: false, message: `Please check the ${field} field and try again.` });
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    return res.status(400).json({ ok: false, message: "Please enter a valid email address." });
  }

  if (!smtpReady) {
    console.error("Contact message was not sent: SMTP_USER and SMTP_PASS are not configured.");
    return res.status(503).json({ ok: false, message: "Email delivery is not configured yet. Please try again later." });
  }

  try {
    const delivery = await mailTransport.sendMail({
      from: `Portfolio contact <${smtpUser}>`,
      to: recipient,
      replyTo: cleaned.email,
      subject: `Portfolio inquiry: ${cleaned.subject.replace(/[\r\n]/g, " ")}`,
      text: `Name: ${cleaned.name}\nEmail: ${cleaned.email}\n\n${cleaned.message}`
    });

    const acceptedRecipient = delivery.accepted.some(
      (address) => String(address).toLowerCase() === recipient.toLowerCase()
    );
    if (!acceptedRecipient) {
      console.error("Contact email was rejected by the configured SMTP server.");
      return res.status(502).json({ ok: false, message: "Your message could not be delivered. Please try again later." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact email delivery failed:", error.message);
    return res.status(502).json({ ok: false, message: "Your message could not be delivered. Please try again later." });
  }
});

app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Page not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.too.large") {
    return res.status(413).json({ ok: false, message: "Your message is too long. Please shorten it and try again." });
  }

  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ ok: false, message: "The message could not be read. Please try again." });
  }

  console.error("Request processing failed:", error.message);
  return res.status(500).json({ ok: false, message: "The server could not process your request." });
});

app.listen(port, () => {
  console.log(`Portfolio server is running at http://localhost:${port}`);
  if (!smtpReady) {
    console.error("Email delivery is disabled until SMTP_USER and SMTP_PASS are added to .env.");
  }
});
