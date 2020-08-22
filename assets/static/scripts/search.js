(function () {
  'use strict';

  const HIDDEN_CLASS = "hidden";
  const TOP_HIT_CLASS = "top-hit";
  const MOUSE_MODE_CLASS = "mousemode";
  let flickerTimeout = null;
  let mouseMoveTimeout = null;
  let mouseIsMoving = false;

  const searchItems = document.querySelectorAll(".searchable");
  const typeahead = document.querySelector(".typeahead");
  const header = document.querySelector("h1");
  const body = document.body;

  screenshake({ header: true });

  body.addEventListener("mousemove", (e) => {
    mouseIsMoving = true;
    body.classList.add(MOUSE_MODE_CLASS);
    if(mouseMoveTimeout) clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      mouseIsMoving = false;
    }, 100);
  });

  typeahead.focus();
  typeahead.value = "";
  // Apparently some browsers autofill the typeahead value from a back button
  // after the script runs, but before any setTimeout ticks run. What a hack.
  setTimeout(() => {
    typeahead.value = "";
  }, 0);

  typeahead.addEventListener("input", (e) => {
    const text = e.target.value;
    if(!search(text)) screenshake({ header: true });
    else screenshake({ typeahead: true });
  });

  function screenshake(opts) {
    if(flickerTimeout) clearTimeout(flickerTimeout);
    if(opts.header) header.classList.add("flickering");
    if(opts.typeahead) typeahead.classList.add("flicker-color");
    flickerTimeout = setTimeout(() => {
      header.classList.remove("flickering");
      typeahead.classList.remove("flicker-color");
    }, 150);
  }

  for(const searchItem of searchItems) {
    const link = linkOf(searchItem);
    link.addEventListener("mouseover", (e) => {
      if(!mouseIsMoving) return;
      const topHit = document.querySelector("." + TOP_HIT_CLASS);
      if(topHit) unselect(topHit);
    });
    // Faster clicks
    (function(link) {
      link.addEventListener("mousedown", (e) => {
        if(e.button === 0) window.location.href = link.pathname;
      });
    }(link));
  }

  typeahead.parentElement.addEventListener("submit", (e) => {
    e.preventDefault();
    attemptNavigation();
  });

  document.addEventListener("keydown", (e) => {
    const topHit = topHitOrHover();
    const notHidden = document.querySelectorAll(".searchable:not(.hidden)");

    if(e.key === "Escape") {
      body.classList.remove(MOUSE_MODE_CLASS);
      screenshake({ header: true });
      if(document.activeElement === typeahead) {
        typeahead.value = "";
        search("");
      }
      typeahead.focus();
      window.scrollTo(0, 0);
      if(topHit) unselect(topHit);
    }
    else if(e.key === "/") {
      body.classList.remove(MOUSE_MODE_CLASS);
      e.preventDefault();
      screenshake({ header: true });
      typeahead.focus();
      window.scrollTo(0, 0);
      if(topHit) unselect(topHit);
    }
    else if(notHidden.length <= 1) return;
    else if(e.key === "ArrowUp") {
      e.preventDefault();
      if(!topHit) {
        typeahead.focus();
        return;
      }
      body.classList.remove(MOUSE_MODE_CLASS);
      typeahead.blur();
      cycleHit(topHit, notHidden, x => x - 1);
    }
    else if(e.key === "ArrowDown") {
      e.preventDefault();
      typeahead.blur();
      body.classList.remove(MOUSE_MODE_CLASS);
      if(!topHit) {
        select(linkOf(notHidden[0]));
        return;
      }
      cycleHit(topHit, notHidden, x => x + 1);
    }
    else if(e.key === "Enter") {
      e.preventDefault();
      attemptNavigation();
    }
  });

  function cycleHit(topHit, notHidden, cycleCallback) {
    const index = indexOfHit(topHit, notHidden);
    const nextIndex = cycleCallback(index);
    if(nextIndex > notHidden.length - 1) return;

    unselect(topHit);
    if(nextIndex < 0) {
      window.scrollTo(0, 0);
      typeahead.focus();
      return;
    }


    const link = linkOf(notHidden[nextIndex]);
    select(link);
    const rect = link.getBoundingClientRect();
    const innerHeight = window.innerHeight;
    if(rect.bottom > innerHeight) {
      window.scrollTo(0, window.scrollY + (rect.bottom - innerHeight));
    }
    else if(rect.top < 0) {
      window.scrollTo(0, window.scrollY + rect.top);
    }
  }

  function indexOfHit(topHit, notHidden) {
    for(let i = 0; i < notHidden.length; i++) {
      const current = notHidden[i];
      if(current.children[0] === topHit) {
        return i;
      }
    }
    return -1;
  }

  function attemptNavigation() {
    const topHit = document.querySelector('.' + TOP_HIT_CLASS);
    if(topHit) {
      window.location.href = topHit.pathname;
    }
  }

  function search(text) {
    // Hide or unhide the children
    let previousMatch = false;
    for(const searchItem of searchItems) {
      const searchLink = linkOf(searchItem);
      unselect(searchLink);
      const match = linkMatches(searchLink, text);

      // Not a match? Hide and keep going
      if(!match) {
        searchItem.classList.add(HIDDEN_CLASS);
        continue;
      }

      // Matched? Unhide
      searchItem.classList.remove(HIDDEN_CLASS);

      // Highlight the first hit, only if there is search text
      if(!previousMatch) {
        previousMatch = true;
        if(text) select(searchLink);
      }
    }
    return previousMatch;
  }

  function linkOf(searchable) {
    return searchable.children[0];
  }

  function linkMatches(link, text) {
      const match = strMatch(link.pathname, "/system/" + text) ||
                    strMatch(link.innerText, text);
      return match;
  }

  function sanitize(str) {
    return str.toLowerCase().trim();
  }

  function strMatch(str, target) {
    return sanitize(str).startsWith(sanitize(target));
  }

  function topHitOrHover() {
    const topHit = document.querySelector('.' + TOP_HIT_CLASS);
    if(topHit) return topHit;
    return document.querySelector(".emulator a:hover");
  }

  function unselect(topHit) {
    topHit.classList.remove(TOP_HIT_CLASS);
  }

  function select(topHit, opts) {
    topHit.classList.add(TOP_HIT_CLASS);
  }

}());
