(function () {
  'use strict';

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") {
      e.preventDefault();
      window.location.replace("/");
    }
  });

}());
