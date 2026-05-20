const canvas = document.querySelector("#particleCanvas");
const ctx = canvas.getContext("2d");
const cursorGlow = document.querySelector("#cursorGlow");
const typingText = document.querySelector("#typingText");
const finalTyping = document.querySelector("#finalTyping");
const finalMessage = document.querySelector("#finalMessage");
const yesButton = document.querySelector("#yesButton");
const noButton = document.querySelector("#noButton");
const choicePanel = document.querySelector("#choicePanel");
const musicToggle = document.querySelector("#musicToggle");
const musicLabel = document.querySelector("#musicLabel");
const ambientAudio = document.querySelector("#ambientAudio");

const apologyMessage =
  "I am sorry for the way I made you feel. I should have been kinder with my words, softer with my patience, and quicker to listen. You are not just my little sister. You are one of the brightest parts of my life, and I never want you to wonder if your feelings matter to me. They do. You do. I cannot rewrite what happened, but I can grow from it, show up better, and protect your trust with more care.";

const finalMessageText =
  "Thank you for giving me another chance. I promise to listen before I react, to choose gentleness when it matters most, and to remember that being your older brother means making you feel safe, loved, and never alone.";

let particles = [];
let typedApology = false;
let typedFinal = false;
let noButtonEscapes = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Keep the canvas crisp on high-density screens without overworking the browser.
function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles();
}

// Soft floating light particles for the cinematic background.
function createParticles() {
  const count = Math.min(90, Math.floor(window.innerWidth / 16));

  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 2.4 + 0.8,
    speed: Math.random() * 0.32 + 0.12,
    drift: Math.random() * 0.28 - 0.14,
    alpha: Math.random() * 0.42 + 0.16
  }));
}

function drawParticles() {
  if (prefersReducedMotion) return;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (const particle of particles) {
    particle.y -= particle.speed;
    particle.x += particle.drift;

    if (particle.y < -12) {
      particle.y = window.innerHeight + 12;
      particle.x = Math.random() * window.innerWidth;
    }

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 247, 222, ${particle.alpha})`;
    ctx.shadowColor = "rgba(255, 191, 126, 0.75)";
    ctx.shadowBlur = 14;
    ctx.fill();
  }

  requestAnimationFrame(drawParticles);
}

// Reusable typing animation for the letter and final message.
function typeInto(element, message, speed = 24) {
  if (!element) return Promise.resolve();

  element.textContent = "";

  if (prefersReducedMotion) {
    element.textContent = message;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let index = 0;

    const tick = () => {
      element.textContent += message.charAt(index);
      index += 1;

      if (index < message.length) {
        const pause = [".", ",", "!"].includes(message.charAt(index - 1)) ? speed * 7 : speed;
        window.setTimeout(tick, pause);
      } else {
        resolve();
      }
    };

    tick();
  });
}

// Reveal cards and panels only when they enter the viewport.
function revealOnScroll() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    typeInto(typingText, apologyMessage);
    typedApology = true;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");

        if (entry.target.contains(typingText) && !typedApology) {
          typedApology = true;
          typeInto(typingText, apologyMessage);
        }
      });
    },
    { threshold: 0.25 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

// The playful "No" button chooses a new safe spot inside its panel.
function moveNoButton() {
  const panelRect = choicePanel.getBoundingClientRect();
  const buttonRect = noButton.getBoundingClientRect();
  const padding = 10;
  const maxX = Math.max(padding, panelRect.width - buttonRect.width - padding);
  const maxY = Math.max(padding, panelRect.height - buttonRect.height - padding);

  noButtonEscapes += 1;
  noButton.style.position = "absolute";
  noButton.style.left = `${Math.random() * maxX}px`;
  noButton.style.top = `${Math.random() * maxY}px`;
  noButton.textContent = noButtonEscapes > 4 ? "Still no?" : "No";
}

// Tiny CSS hearts burst from the Yes button when forgiveness is chosen.
function makeHeartBurst(originX, originY) {
  for (let index = 0; index < 22; index += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 22;
    const distance = 70 + Math.random() * 90;

    spark.className = "spark";
    spark.style.left = `${originX}px`;
    spark.style.top = `${originY}px`;
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    document.body.appendChild(spark);

    window.setTimeout(() => spark.remove(), 950);
  }
}

function showFinalMessage(event) {
  const rect = yesButton.getBoundingClientRect();
  const originX = event?.clientX ?? rect.left + rect.width / 2;
  const originY = event?.clientY ?? rect.top + rect.height / 2;

  makeHeartBurst(originX, originY);
  finalMessage.hidden = false;
  finalMessage.classList.add("is-visible");
  finalMessage.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });

  if (!typedFinal) {
    typedFinal = true;
    typeInto(finalTyping, finalMessageText, 22);
  }
}

// A warm glow follows precise pointers, but stays off for touch devices.
function setupCursorGlow() {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

  window.addEventListener("pointermove", (event) => {
    cursorGlow.style.opacity = "1";
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });

  window.addEventListener("pointerleave", () => {
    cursorGlow.style.opacity = "0";
  });
}

// Browsers require a user click before audio can play, so the toggle handles that.
async function toggleMusic() {
  if (!ambientAudio.getAttribute("src")) return;

  try {
    if (ambientAudio.paused) {
      await ambientAudio.play();
      musicToggle.classList.add("is-playing");
      musicToggle.setAttribute("aria-pressed", "true");
      musicLabel.textContent = "Pause";
    } else {
      ambientAudio.pause();
      musicToggle.classList.remove("is-playing");
      musicToggle.setAttribute("aria-pressed", "false");
      musicLabel.textContent = "Music";
    }
  } catch (error) {
    musicLabel.textContent = "Add audio";
    musicToggle.title = "Place a music file at assets/music/soft-ambient.mp3";
  }
}

// Bind the little interactions after the DOM has loaded.
function setupSiblingInteractions() {
  noButton.addEventListener("pointerenter", moveNoButton);
  noButton.addEventListener("focus", moveNoButton);
  noButton.addEventListener("click", (event) => {
    event.preventDefault();
    moveNoButton();
  });

  yesButton.addEventListener("click", showFinalMessage);
  musicToggle.addEventListener("click", toggleMusic);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawParticles();
revealOnScroll();
setupCursorGlow();
setupSiblingInteractions();
