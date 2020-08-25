(function () {
  'use strict';

  function xhr(opts) {
    const request = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      request.upload.addEventListener('progress', (e) => {
        const percent = event.loaded / event.total;
        if(opts.progress) opts.progress(percent);
      });

      let checked = false;
      request.addEventListener('readystatechange', (e) => {
        if(!checked && canCheckStatus(e)) {
          checked = true;
          if(Math.floor(request.status / 100) === 2) {
            resolve(true);
            return;
          }
          resolve(false);
        }
      });

      request.open(opts.method, opts.path, true);
      request.send(opts.data);
    });
  }

  function canCheckStatus(e) {
    return e.target.readyState > 2;
  }

  function upload(form, progressCb) {
    return xhr({
      method: form.getAttribute('method'),
      path: form.getAttribute('action'),
      data: new FormData(form),
      progress: progressCb,
    });
  }

  function watch(el) {
    const inFlight = {};
    let endCallbacks = [];
    let everStarted = false;

    function isTransitioning() {
      return Object.keys(inFlight).length > 0;
    }

    function nextFinish(opts) {
      return new Promise((resolve, reject) => {
        if(opts.waitForStart && !everStarted) {
          endCallbacks.push(resolve);
          return;
        }

        if(isTransitioning()) {
          endCallbacks.push(resolve);
          return;
        }
        resolve();
      });
    }

    function transitionRun(e) {
      everStarted = true;
      inFlight[e.propertyName] = true;
    }

    function transitionEnd(e) {
      delete inFlight[e.propertyName];
      if(!isTransitioning()) endCallbacks.forEach(cb => cb());
    }

    return {
      isTransitioning, nextFinish,
      start() {
        el.addEventListener('transitionrun', transitionRun);
        el.addEventListener('transitionend', transitionEnd);
        el.addEventListener('transitioncancel', transitionEnd);
      },
      stop() {
        el.removeEventListener('transitionrun', transitionRun);
        el.removeEventListener('transitionend', transitionEnd);
        el.removeEventListener('transitioncancel', transitionEnd);
      },
      async finishAndStop(opts) {
        await this.nextFinish(opts);
        this.stop();
      }
    };
  }

  function bindAll(opts) {
    const forms = document.querySelectorAll('.form-with-progress');
    forms.forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(opts.start) opts.start();

        const success = await animateProgress(form, (progress) => {
          return upload(form, progress);
        });

        const uploaded = {};
        form.querySelectorAll('input').forEach((input) => {
          if(input.type !== 'hidden' && input.type !== 'submit') {
            if(input.type === 'file') {
              uploaded[input.name] = Array.from(input.files).map(f => f.name);
            }
            else {
              uploaded[input.name] = input.value;
            }

            input.value = null;
          }
        });

        if(success && opts.onUpload) opts.onUpload(uploaded);
      });
    });
  }

  async function animateProgress(form, progressBuilder) {
    const progressBar = form.querySelector('.progress-bar');
    const progressPercent = progressBar.querySelector('.progress-percent');
    progressPercent.style.width = "0";

    progressBar.classList.remove('hidden');

    const progressWatcher = watch(progressPercent);
    progressWatcher.start();

    const success = await progressBuilder((percent) => {
      progressPercent.style.width = `${100 * percent}%`;
    });

    progressPercent.style.width = '100%';

    await progressWatcher.finishAndStop({ waitForStart: true });

    progressBar.classList.add('hidden');

    if(!success) console.log('failure');
    return success;
  }

  function forTarget(element, opts) {
    let draggedOver = false;
    function into(e) {
      e.preventDefault();
      if(!draggedOver && opts.enter) opts.enter();
      draggedOver = true;
    }

    element.addEventListener("dragenter", into);
    element.addEventListener("dragover", into);
    element.addEventListener("drop", (e) => {
      e.preventDefault();
      draggedOver = false;
      if(opts.exit) opts.exit();
      if(opts.drop) opts.drop(e);
    });
    element.addEventListener("dragleave", (e) => {
      // Clear the drag and drop text if the page is no longer being dropped
      // Can't check that on dropleave directly, since any individual child element
      // can trigger that when you drag over a different element. Instead set a
      // timeout and if nothing tells it to keep the text open in the meantime,
      // hide it.
      draggedOver = false;
      setTimeout(() => {
        if(!draggedOver) {
          if(opts.exit) opts.exit();
        }
      }, 1000);
    });
  }

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

  forTarget(document.body, {
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
    if(e.button === 0 && e.isTrusted && e.target === uploadForm) {
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

}());
