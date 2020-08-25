export default function xhr(opts) {
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
