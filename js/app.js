function getTournament() {
  return PHDTournament.state.tournament;
}

function renderTournamentForm() {
  const tournament = getTournament();

  document.getElementById("tournamentName").value = tournament.name;
  document.getElementById("tournamentDescription").value = tournament.description;
  document.getElementById("winPoints").value = tournament.settings.winPoints;
  document.getElementById("drawPoints").value = tournament.settings.drawPoints;
  document.getElementById("byePoints").value = tournament.settings.byePoints;
}

function renderTournamentSummary() {
  const tournament = getTournament();

  document.getElementById("pageTitle").textContent =
    tournament.name || "Tournament Manager";

  document.getElementById("summaryName").textContent =
    tournament.name || "Untitled Tournament";

  document.getElementById("summaryDescription").textContent =
    tournament.description || "No description yet.";

  document.getElementById("summaryScoring").textContent =
    `Win ${tournament.settings.winPoints}, Draw ${tournament.settings.drawPoints}, Bye ${tournament.settings.byePoints}`;
}

function render() {
  renderTournamentForm();
  renderTournamentSummary();
}

function updateTournamentSettings() {
  const tournament = getTournament();

  tournament.name =
    document.getElementById("tournamentName").value.trim() || "Untitled Tournament";

  tournament.description =
    document.getElementById("tournamentDescription").value.trim();

  tournament.settings.winPoints =
    Number(document.getElementById("winPoints").value) || 3;

  tournament.settings.drawPoints =
    Number(document.getElementById("drawPoints").value) || 0;

  tournament.settings.byePoints =
    Number(document.getElementById("byePoints").value) || 0;

  autosave();
  render();
}

function bindEvents() {
  document.getElementById("saveTournament")
    .addEventListener("click", updateTournamentSettings);

  [
    "tournamentName",
    "tournamentDescription",
    "winPoints",
    "drawPoints",
    "byePoints"
  ].forEach(id => {
    document.getElementById(id).addEventListener("change", updateTournamentSettings);
  });

  document.getElementById("themeToggle")
    .addEventListener("click", () => {
      document.body.classList.toggle("dark");
    });

  document.getElementById("resetTournament")
    .addEventListener("click", () => {
      const confirmed = confirm("Reset this tournament? This cannot be undone.");
      if (!confirmed) return;

      resetState();
      render();
    });
}

function initApp() {
  loadState();
  bindEvents();
  render();
  setSaveStatus("Loaded");
}

initApp();

PHDTournament.modules.push("app");