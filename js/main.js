/* =========================================================
   UPAN — theme system, navigation, scroll reveals
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "upan-theme";
  var root = document.documentElement;
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var MODES = ["light", "dark", "system"];

  function readMode() {
    var stored;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { return "system"; }
    return MODES.indexOf(stored) > -1 ? stored : "system";
  }

  function resolve(mode) {
    return mode === "system" ? (darkQuery.matches ? "dark" : "light") : mode;
  }

  /* ---------- Theme ---------- */

  var options = [];
  var trigger = null;
  var triggerLabel = null;
  var animTimer = null;

  function applyMode(mode, animate) {
    root.setAttribute("data-theme", resolve(mode));
    root.setAttribute("data-theme-mode", mode);

    for (var j = 0; j < options.length; j++) {
      var on = options[j].dataset.themeValue === mode;
      options[j].setAttribute("aria-checked", on ? "true" : "false");
    }

    if (triggerLabel) triggerLabel.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    if (trigger) {
      trigger.setAttribute(
        "aria-label",
        "Theme: " + mode + (mode === "system" ? " (follows your device)" : "")
      );
    }

    if (animate && !reduceMotion.matches) {
      root.classList.add("theme-anim");
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 260);
    }
  }

  function storeMode(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
  }

  function setMode(mode) {
    if (MODES.indexOf(mode) === -1) return;
    storeMode(mode);
    applyMode(mode, true);
  }

  /* ---------- Theme menu ---------- */

  var menu = null;

  function openMenu() {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    var checked = menu.querySelector('[aria-checked="true"]') || menu.firstElementChild;
    if (checked) checked.focus();
  }

  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus();
  }

  function onMenuKeydown(event) {
    var key = event.key;
    if (key === "Escape") {
      closeMenu(true);
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End") {
      event.preventDefault();
      var current = options.indexOf(document.activeElement);
      var next;
      if (key === "Home") next = 0;
      else if (key === "End") next = options.length - 1;
      else if (key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % options.length;
      else next = current < 0 ? options.length - 1 : (current - 1 + options.length) % options.length;
      options[next].focus();
    }
  }

  /* ---------- Mobile navigation ---------- */

  var navToggle = null;
  var mobileMenu = null;

  function setMenuOpen(open) {
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.hidden = !open;
  }

  /* ---------- Scroll reveal ---------- */

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Boot ---------- */

  function init() {
    options = Array.prototype.slice.call(document.querySelectorAll("[data-theme-value]"));
    menu = document.getElementById("theme-menu");
    navToggle = document.querySelector(".nav-toggle");
    mobileMenu = document.getElementById("mobile-menu");

    var switcher = document.querySelector("[data-theme-switcher]");
    trigger = document.querySelector("[data-theme-trigger]");
    triggerLabel = document.querySelector("[data-theme-trigger-label]");

    applyMode(readMode(), false);

    if (trigger && menu) {
      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        if (menu.hidden) openMenu(); else closeMenu(false);
      });
      menu.addEventListener("keydown", onMenuKeydown);
      options.forEach(function (option) {
        option.addEventListener("click", function () {
          setMode(option.dataset.themeValue);
          closeMenu(true);
        });
      });
      document.addEventListener("click", function (event) {
        if (!menu.hidden && switcher && !switcher.contains(event.target)) closeMenu(false);
      });
    }

    darkQuery.addEventListener("change", function () {
      if (readMode() === "system") applyMode("system", true);
    });

    if (navToggle && mobileMenu) {
      setMenuOpen(false);
      navToggle.addEventListener("click", function () {
        setMenuOpen(navToggle.getAttribute("aria-expanded") !== "true");
      });
      mobileMenu.addEventListener("click", function (event) {
        if (event.target.closest("a")) setMenuOpen(false);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && mobileMenu.hidden === false) {
          setMenuOpen(false);
          navToggle.focus();
        }
      });
    }

    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
