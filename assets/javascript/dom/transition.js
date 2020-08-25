export function watch(el) {
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
