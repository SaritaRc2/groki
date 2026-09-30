(function () {
  var buttons = document.querySelectorAll(".cats button");
  var stories = document.querySelectorAll(".story");
  var empty = document.getElementById("empty");
  var sheet = document.querySelector(".sheet");
  var stage = document.querySelector(".stage");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = window.matchMedia("(min-width: 861px)").matches;

  function apply(filter) {
    var shown = 0;
    stories.forEach(function (story) {
      var on = filter === "all" || story.getAttribute("data-category") === filter;
      story.hidden = !on;
      if (on) shown += 1;
    });
    if (empty) empty.hidden = shown !== 0;
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.getAttribute("data-filter");
      buttons.forEach(function (other) {
        var pressed = other === button;
        other.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      apply(filter);
    });
  });

  if (!reduce && wide && stage && sheet) {
    stage.addEventListener("pointermove", function (event) {
      var rect = stage.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      sheet.style.transform = "rotateX(" + (4 - y * 4).toFixed(2) + "deg) rotateY(" + (-8 + x * 6).toFixed(2) + "deg)";
    });
    stage.addEventListener("pointerleave", function () {
      sheet.style.transform = "";
    });
  }

})();
