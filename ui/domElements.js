// ui/domElements.js

export const elements = {
  // Screens
  passwordScreen: document.getElementById("password-screen"),
  deckInputScreen: document.getElementById("deck-input-screen"),
  gameBoard: document.getElementById("game-board"),

  // Password Screen
  passwordInput: document.getElementById("password-input"),
  passwordSubmitBtn: document.getElementById("password-submit-btn"),
  passwordError: document.getElementById("password-error"),

  // Deck Input Screen
  singleDeckModeBtn: document.getElementById("single-deck-mode-btn"),
  dualDeckModeBtn: document.getElementById("dual-deck-mode-btn"),
  singleDeckInput: document.getElementById("single-deck-input"),
  dualDeckInput: document.getElementById("dual-deck-input"),
  deckString: document.getElementById("deck-string"),
  deckStringP1: document.getElementById("deck-string-p1"),
  deckStringP2: document.getElementById("deck-string-p2"),
  clearDeckBtn: document.getElementById("clear-deck-btn"),
  clearDeckP1Btn: document.getElementById("clear-deck-p1-btn"),
  clearDeckP2Btn: document.getElementById("clear-deck-p2-btn"),
  startGameBtn: document.getElementById("start-game-btn"),
  fullscreenBtn: document.getElementById("fullscreen-btn"),

  // Game Board
  mainArea: document.getElementById("main-area"),
  leftColumn: document.getElementById("left-column"),
  centerColumn: document.getElementById("center-column"),
  rightColumn: document.getElementById("right-column"),
  volNoiseZone: document.getElementById("volNoise-zone"),
  trashZone: document.getElementById("trash-zone"),
  stageZone: document.getElementById("stage-zone"),
  directionZone: document.getElementById("direction-zone"),
  handZone: document.getElementById("hand-zone"),
  deckZone: document.getElementById("deck-zone"),
  shuffleBtn: document.getElementById("shuffle-btn"),
  searchDeckBtn: document.getElementById("search-deck-btn"),
  searchVolnoiseBtn: document.getElementById("search-volnoise-btn"),
  moveHandToTrashBtn: document.getElementById("move-hand-to-trash-btn"),
  mulliganBtn: document.getElementById("mulligan-btn"),
  resetBtn: document.getElementById("reset-btn"),
  switchPlayerBtn: document.getElementById("switch-player-btn"),
  turnEndBtn: document.getElementById("turn-end-btn"),
  rollDiceBtn: document.getElementById("roll-dice-btn"),
  drawBottomDeckBtn: document.getElementById("draw-bottom-deck-btn"),
  sortHandBtn: document.getElementById("sort-hand-btn"),
  changeMatBtn: document.getElementById("change-mat-btn"),
  fullscreenMobileBtn: document.getElementById("fullscreen-mobile-btn"),
  openTemporaryZoneBtn: document.getElementById("open-temporary-zone-btn"),

  // Counters
  volValue: document.getElementById("vol-value"),
  manaAlphaValue: document.getElementById("mana-alpha-value"),
  manaBetaValue: document.getElementById("mana-beta-value"),
  manaOmegaValue: document.getElementById("mana-omega-value"),
  turnValue: document.getElementById("turn-value"),
  counterBtns: document.querySelectorAll(".counter-btn"),

  // Expanded Zones
  trashExpandedZone: document.getElementById("trash-expanded-zone"),
  deckExpandedZone: document.getElementById("deck-expanded-zone"),
  volnoiseExpandedZone: document.getElementById("volnoise-expanded-zone"),
  temporaryExpandedZone: document.getElementById("temporary-expanded-zone"),
  temporaryCardArea: document.querySelector(
    "#temporary-expanded-zone .temporary-zone-card-area"
  ),
  tempToTrashBtn: document.getElementById("temp-to-trash-btn"),
  tempToDeckShuffleBtn: document.getElementById("temp-to-deck-shuffle-btn"),
  tempToDeckBottomBtn: document.getElementById("temp-to-deck-bottom-btn"),
  tempHandToTemporaryBtn: document.getElementById("temp-hand-to-temporary-btn"),

  // Messages
  shuffleMessage: document.getElementById("shuffle-message"),
  turnEndMessage: document.getElementById("turn-end-message"),

  // Card Zoom Overlay
  cardZoomOverlay: document.getElementById("card-zoom-overlay"),
  zoomedCardImage: document.getElementById("zoomed-card-image"),

  // Reset Popup
  resetPopupOverlay: document.getElementById("reset-popup-overlay"),
  resetToDeckSelect: document.getElementById("reset-to-deck-select"),
  resetSameDeck: document.getElementById("reset-same-deck"),
  resetSwapPlayers: document.getElementById("reset-swap-players"),
  resetCancel: document.getElementById("reset-cancel"),

  // Dice
  diceContainer: document.getElementById("dice-container"),

  // Stage Change Buttons
  changeStageBtns: document.querySelectorAll(".change-stage-btn"),

  // Opponent Fullscreen
  viewOpponentBtn: document.getElementById("view-opponent-btn"),
  opponentFullscreen: document.getElementById("opponent-fullscreen"),
  opponentFullscreenBoard: document.getElementById("opponent-fullscreen-board"),
};

export const counters = {
  vol: elements.volValue,
  manaAlpha: elements.manaAlphaValue,
  manaBeta: elements.manaBetaValue,
  manaOmega: elements.manaOmegaValue,
  turn: elements.turnValue,
};
