"use strict";

const nodemailer = require("nodemailer");

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

function getContactHealth() {
  return { ok: true, emailReady: smtpReady };
}

async function handleContact(payload, ip) {
  const now = Date.now();
  const clientIp = ip || "unknown";
  const previous = requestsByIp.get(clientIp);
  const entry = previous && now - previous.startedAt < requestWindowMs
    ? previous
    : { startedAt: now, count: 0 };

  entry.count += 1;
  requestsByIp.set(clientIp, entry);

  if (entry.count > requestLimit) {
    return { status: 429, body: { ok: false, message: "Too many messages were sent. Please try again later." } };
  }

  const { name, email, subject, message } = payload || {};
  const values = { name, email, subject, message };
  const limits = { name: 100, email: 254, subject: 150, message: 5000 };
  const cleaned = {};

  for (const [field, limit] of Object.entries(limits)) {
    if (typeof values[field] !== "string") {
      return { status: 400, body: { ok: false, message: "Please complete all contact form fields." } };
    }

    cleaned[field] = values[field].trim();
    if (!cleaned[field] || cleaned[field].length > limit) {
      return { status: 400, body: { ok: false, message: `Please check the ${field} field and try again.` } };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    return { status: 400, body: { ok: false, message: "Please enter a valid email address." } };
  }

  if (!smtpReady) {
    console.error("Contact message was not sent: SMTP_USER and SMTP_PASS are not configured.");
    return { status: 503, body: { ok: false, message: "Email delivery is not configured yet. Please try again later." } };
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
      return { status: 502, body: { ok: false, message: "Your message could not be delivered. Please try again later." } };
    }

    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error("Contact email delivery failed:", error.message);
    return { status: 502, body: { ok: false, message: "Your message could not be delivered. Please try again later." } };
  }
}

module.exports = { getContactHealth, handleContact };
