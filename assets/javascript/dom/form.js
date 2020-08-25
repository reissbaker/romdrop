import xhr from "./xhr";

export function upload(form, progressCb) {
  return xhr({
    method: form.getAttribute('method'),
    path: form.getAttribute('action'),
    data: new FormData(form),
    progress: progressCb,
  });
}
