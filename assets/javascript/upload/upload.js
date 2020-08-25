import { bindAll, animateProgress } from "./form-with-progress";
import * as domDrag from "../dom/drag";
import xhr from "../dom/xhr";

let flickerTimeout = null;
const header = document.querySelector("h1");
const uploadForm = document.getElementById("rom-upload");
const romList = document.getElementById("rom-list");
const romNodes = romList.querySelectorAll(".rom");
const romSet = new Set(Array.from(romNodes).map(node => node.innerText));
const submitButton = document.getElementById("submit");
const fileInput = document.getElementById("filename");
const fileLabel = fileInput.parentElement.parentElement;
const noRomsNode = document.getElementById("no-roms");
const dragoverText = document.getElementById("dragover-text");
const uploadCta = uploadForm.querySelector('.upload-cta');
const uploading = uploadForm.querySelector('.uploading');

domDrag.forTarget(document.body, {
  enter() { dragoverText.classList.remove("hidden"); },
  exit() { dragoverText.classList.add("hidden"); },
  async drop(e) {
    renderUploading();
    const files = e.dataTransfer.files;
    const success = await animateProgress(uploadForm, (progress) => {
      const formData = new FormData();
      formData.append('file', files[0]);

      return xhr({
        progress,
        method: uploadForm.getAttribute("method"),
        path: uploadForm.getAttribute("action"),
        data: formData,
      });
    });
    if(success) {
      addRom(files[0].name);
      renderSuccess();
    }
  },
});

uploadForm.addEventListener('mousedown', (e) => {
  if(e.isTrusted && e.target === uploadForm) {
    fileInput.click();
  }
}, false);

fileInput.addEventListener('input', (e) => {
  if(e.target.value) submitButton.click();
});

bindAll({
  start: renderUploading,
  onUpload(uploaded) {
    const [ file ] = uploaded.filename;
    addRom(file);
    renderSuccess();
  },
});

function renderUploading() {
  uploadForm.classList.remove("success");
  uploadForm.classList.add("uploading");
}
function renderSuccess() {
  uploadForm.classList.add("success");
  uploadForm.classList.remove("uploading");
}

function addRom(file) {
  noRomsNode.classList.add("hidden");
  if(!romSet.has(file)) {
    romSet.add(file);
    const fileNode = document.createElement('li');
    fileNode.classList.add('rom');
    fileNode.innerText = file;
    romList.prepend(fileNode);
  }
}

screenshake();

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" || e.key === "Backspace") {
    e.preventDefault();
    window.location.replace("/");
  }
  else if(e.key === "Enter") {
    if(!document.activeElement || document.activeElement === document.body) {
      e.preventDefault();
      fileInput.click();
    }
  }
});

function screenshake(opts) {
  if(flickerTimeout) clearTimeout(flickerTimeout);
  header.classList.add("flickering");
  flickerTimeout = setTimeout(() => {
    header.classList.remove("flickering");
  }, 175);
}
