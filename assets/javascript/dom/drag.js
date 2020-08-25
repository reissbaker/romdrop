export function forTarget(element, opts) {
  let draggedOver = false;
  function into(e) {
    e.preventDefault();
    if(!draggedOver && opts.enter) opts.enter();
    draggedOver = true;
  }
  function stop(e) {
    e.preventDefault();
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
