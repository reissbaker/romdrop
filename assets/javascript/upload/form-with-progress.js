import * as domForm from "../dom/form";
import * as domTransition from "../dom/transition";

export function bindAll(opts) {
  const forms = document.querySelectorAll('.form-with-progress');
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(opts.start) opts.start();

      const success = await animateProgress(form, (progress) => {
        return domForm.upload(form, progress);
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

export async function animateProgress(form, progressBuilder) {
  const progressBar = form.querySelector('.progress-bar');
  const progressPercent = progressBar.querySelector('.progress-percent');
  progressPercent.style.width = "0";

  progressBar.classList.remove('hidden');

  const progressWatcher = domTransition.watch(progressPercent);
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
