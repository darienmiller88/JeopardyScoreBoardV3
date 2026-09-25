(function () {
  "use strict";

  var STORAGE_KEY = "jeopardy-scoreboard-players";
  var SCORE_MIN = -99999;
  var SCORE_MAX = 99999;

  var boardEl = document.getElementById("board");
  var emptyMsgEl = document.getElementById("board-empty");
  var nameInputEl = document.getElementById("player-name-input");
  var addBtnEl = document.getElementById("add-player-btn");
  var errorEl = document.getElementById("add-player-error");
  var cardTemplate = document.getElementById("card-template");

  /** In-memory state: array of { name, score } */
  var players = [];

  /* -------------------------------------------------------- */
  /* Persistence                                               */
  /* -------------------------------------------------------- */
  function loadPlayers() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (p) {
        return p && typeof p.name === "string" && typeof p.score === "number";
      });
    } catch (e) {
      console.error("Could not read scoreboard from storage:", e);
      return [];
    }
  }

  function savePlayers() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch (e) {
      console.error("Could not save scoreboard to storage:", e);
    }
  }

  /* -------------------------------------------------------- */
  /* Helpers                                                    */
  /* -------------------------------------------------------- */
  function clampScore(value) {
    if (value > SCORE_MAX) return SCORE_MAX;
    if (value < SCORE_MIN) return SCORE_MIN;
    return value;
  }

  function formatScore(value) {
    var sign = value < 0 ? "-" : "";
    return sign + Math.abs(value).toLocaleString("en-US");
  }

  function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ");
  }

  function findPlayerIndexByName(name) {
    var lower = name.toLowerCase();
    for (var i = 0; i < players.length; i++) {
      if (players[i].name.toLowerCase() === lower) return i;
    }
    return -1;
  }

  function showError(message) {
    errorEl.textContent = message;
  }

  function clearError() {
    errorEl.textContent = "";
  }

  function updateEmptyState() {
    emptyMsgEl.style.display = players.length === 0 ? "block" : "none";
  }

  /* -------------------------------------------------------- */
  /* Rendering                                                  */
  /* -------------------------------------------------------- */
  function renderScore(cardEl, score) {
    var scoreEl = cardEl.querySelector('[data-role="score"]');
    scoreEl.textContent = formatScore(score);
    scoreEl.classList.toggle("is-negative", score < 0);
  }

  function createCard(player) {
    var fragment = cardTemplate.content.cloneNode(true);
    var cardEl = fragment.querySelector(".card");
    cardEl.dataset.name = player.name;
    cardEl.querySelector(".card__name").textContent = player.name;
    renderScore(cardEl, player.score);
    boardEl.appendChild(cardEl);
    return cardEl;
  }

  function renderAllPlayers() {
    // Clear existing cards (keep the empty-state message node)
    Array.prototype.slice.call(boardEl.querySelectorAll(".card")).forEach(function (el) {
      el.remove();
    });
    players.forEach(function (player) {
      createCard(player);
    });
    updateEmptyState();
  }

  /* -------------------------------------------------------- */
  /* Player actions                                             */
  /* -------------------------------------------------------- */
  function addPlayer() {
    var rawName = nameInputEl.value;
    var name = normalizeName(rawName);

    if (!name) {
      showError("Enter a name to add a player.");
      return;
    }
    if (findPlayerIndexByName(name) !== -1) {
      showError("\u201C" + name + "\u201D is already on the board.");
      return;
    }

    clearError();
    var player = { name: name, score: 0 };
    players.push(player);
    savePlayers();
    createCard(player);
    updateEmptyState();

    nameInputEl.value = "";
    nameInputEl.focus();
  }

  function removePlayer(cardEl) {
    var name = cardEl.dataset.name;
    var index = findPlayerIndexByName(name);
    if (index !== -1) {
      players.splice(index, 1);
      savePlayers();
    }
    cardEl.remove();
    updateEmptyState();
  }

  function adjustScore(cardEl, delta) {
    var name = cardEl.dataset.name;
    var index = findPlayerIndexByName(name);
    if (index === -1) return;

    var next = clampScore(players[index].score + delta);
    players[index].score = next;
    savePlayers();
    renderScore(cardEl, next);
  }

  function getCustomAmount(cardEl) {
    var input = cardEl.querySelector('[data-role="custom-input"]');
    var raw = parseInt(input.value, 10);
    if (isNaN(raw) || raw < 0) return 0;
    if (raw > SCORE_MAX) raw = SCORE_MAX;
    return raw;
  }

  function resetCustomAmount(cardEl) {
    var input = cardEl.querySelector('[data-role="custom-input"]');
    input.value = "0";
  }

  /* -------------------------------------------------------- */
  /* Event wiring                                               */
  /* -------------------------------------------------------- */
  addBtnEl.addEventListener("click", addPlayer);

  nameInputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addPlayer();
  });

  nameInputEl.addEventListener("input", clearError);

  boardEl.addEventListener("click", function (e) {
    var cardEl = e.target.closest(".card");
    if (!cardEl) return;

    if (e.target.closest(".card__remove")) {
      removePlayer(cardEl);
      return;
    }

    var actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    var action = actionEl.dataset.action;

    if (action === "plus100") adjustScore(cardEl, 100);
    else if (action === "minus100") adjustScore(cardEl, -100);
    else if (action === "plus-custom") {
      adjustScore(cardEl, getCustomAmount(cardEl));
      resetCustomAmount(cardEl);
    } else if (action === "minus-custom") {
      adjustScore(cardEl, -getCustomAmount(cardEl));
      resetCustomAmount(cardEl);
    }
  });

  // Allow pressing Enter inside a custom-amount field to add that amount.
  boardEl.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var input = e.target.closest('[data-role="custom-input"]');
    if (!input) return;
    var cardEl = e.target.closest(".card");
    adjustScore(cardEl, getCustomAmount(cardEl));
    resetCustomAmount(cardEl);
  });

  /* -------------------------------------------------------- */
  /* Init                                                       */
  /* -------------------------------------------------------- */
  players = loadPlayers();
  renderAllPlayers();
})();