"use strict";

document.documentElement.classList.add("js");

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const navigationLinks = navigation ? navigation.querySelectorAll('a[href^="#"]') : [];

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation menu");
  navigation.classList.remove("is-open");
}

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigationLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
}

const sections = document.querySelectorAll("main section[id]");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".section-heading, .skill-card, .project-card, .timeline-item, .education-card, .stat-card, .contact-form").forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      navigationLinks.forEach((link) => link.removeAttribute("aria-current"));
      if (activeLink) activeLink.setAttribute("aria-current", "location");
    });
  }, { rootMargin: "-25% 0px -65% 0px" });

  sections.forEach((section) => sectionObserver.observe(section));
} else {
  document.querySelectorAll(".section-heading, .skill-card, .project-card, .timeline-item, .education-card, .stat-card, .contact-form").forEach((item) => {
    item.classList.add("is-visible");
  });
}

const yearElement = document.querySelector("#current-year");
if (yearElement) yearElement.textContent = String(new Date().getFullYear());

const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.removeAttribute("data-state");

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton.textContent;
    const payload = Object.fromEntries(formData.entries());

    if (location.hostname.endsWith(".github.io")) {
      const subject = `Portfolio inquiry: ${payload.subject}`;
      const body = `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`;
      formStatus.textContent = "Opening your email app with the message ready to send...";
      window.location.href = `mailto:ojjalasravani@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    formStatus.textContent = "Sending your message securely...";

    fetch(contactForm.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        if (response.status === 405) {
          throw new Error("This site is not accepting contact form submissions. Run the Node.js backend with `npm start` or deploy the Netlify Functions configured for this project.");
        }

        const responseBody = await response.text();
        let result;

        try {
          result = JSON.parse(responseBody);
        } catch {
          const message = response.status === 404
            ? "Contact endpoint not found. Start the site with `npm start` and open the URL it prints, or deploy the Node.js backend."
            : `The contact server returned an unexpected response (${response.status}). Please try again later.`;
          throw new Error(message);
        }

        if (response.status === 404) {
          throw new Error("Contact endpoint not found. Start the site with `npm start` and open the URL it prints, or deploy the Node.js backend.");
        }

        if (!response.ok || !result || result.ok !== true) {
          throw new Error((result && result.message) || "Your message could not be sent. Please try again.");
        }

        formStatus.removeAttribute("data-state");
        formStatus.textContent = "Message sent successfully. Thank you for getting in touch!";
        contactForm.reset();
      })
      .catch((error) => {
        console.error("Contact form delivery failed:", error);
        formStatus.dataset.state = "error";
        formStatus.textContent = error instanceof TypeError
          ? "Cannot reach the contact server. Start it with `npm start`, then try again."
          : error.message || "Your message could not be sent. Please try again.";
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      });
  });
}
