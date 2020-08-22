let flickerTimeout = null;
const header = document.querySelector("h1");

screenshake();

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" || e.key === "Backspace") {
    e.preventDefault();
    window.location.replace("/");
  }
});

function screenshake(opts) {
  if(flickerTimeout) clearTimeout(flickerTimeout);
  header.classList.add("flickering");
  flickerTimeout = setTimeout(() => {
    header.classList.remove("flickering");
  }, 175);
}
