# Ojjala Sravani — Portfolio

A responsive, dark-violet portfolio website built with semantic HTML, CSS, vanilla JavaScript, and a small Node.js contact backend.

## Project structure

```text
## 📁 Project Structure

```text
ojjala-sravani-portfolio/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   └── script.js
│
├── netlify/
│   └── functions/
│       ├── health.js
│       └── contact.js
│
├── netlify.toml
├── README.md
└── .gitignore
```

## 🚀 Technologies Used

- HTML5
- CSS3
- JavaScript
- Netlify Functions
- Node.js
- Nodemailer (if used for email delivery)

## 🌐 Deployment

This portfolio is hosted on Netlify.

**Live Website:** https://stellar-tapioca-e63b22.netlify.app

## ⚙️ Environment Variables

Configure the following environment variables in Netlify:

- `SMTP_USER` – Your Gmail address
- `SMTP_PASS` – Your Google App Password

Never commit your `.env` file or expose email credentials in frontend code.

## 📡 API Endpoints

| Endpoint | Purpose |
|---|---|
| `/api/health` | Checks API status |
| `/api/contact` | Handles contact form submissions |

```

The hero portrait is the photo supplied for this portfolio. Project preview photos are loaded from Unsplash.

## Run locally

Install Node.js 20 or newer, open a terminal in this folder, then install the dependencies and create your local environment file:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `SMTP_USER` and `SMTP_PASS`. For Gmail, use a Google App Password (not your regular account password); create one in your Google account after enabling 2-Step Verification. Keep `.env` private: it is excluded by `.gitignore`, and credentials should never be committed or shared.

Start the site and backend together:

```powershell
npm start
```

Then visit `http://localhost:3000`. The form posts to `/api/contact`; the server validates the fields and sends email to `CONTACT_EMAIL` through the configured SMTP account. The success message appears only after the SMTP server accepts the message. `/api/health` reports whether SMTP credentials are configured.

## Deploy

Deploy to a Node.js host that can run `npm start` and supports outbound SMTP:

1. Upload the project files and run `npm install` during deployment.
2. Set `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, and `CONTACT_EMAIL` in the host's secret/environment-variable settings.
3. Start the server with `npm start`; do not upload your local `.env` file.
4. Configure HTTPS and test the form, navigation, and repository links on the deployed URL.

GitHub Pages and other static-only hosting cannot run this backend. Use a Node-capable host for email delivery.
