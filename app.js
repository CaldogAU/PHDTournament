const STORAGE_KEY = "phdTournamentState";

const defaultState = {
  tournamentName: "PHDlympics",
  description: "",
  settings: {
    winPoints: 3,
    drawPoints: 1,
    byePoints: 3
  },
  teams: []
};

let state = structuredClone(defaultState);

const pageTitle = document.getElementById("pageTitle");
const tournamentNameInput = document.getElementById("tournamentName");
const tournamentDescriptionInput = document.getElementById("tournamentDescription");
const winPointsInput = document.getElementById("winPoints");
const drawPointsInput = document.getElementById("drawPoints");
const byePointsInput = document.getElementById("byePoints");
const saveTournamentButton = document.getElementById("saveTournament");
const resetTournamentButton = document.getElementById("resetTournament");
const saveStatus = document.getElementById("saveStatus");

const teamInput = document.getElementById("teamInput");
const addTeamButton = document.getElementById("addTeam");
const teamList = document.getElementById("teamList");
const standingsBody = document.getElementById("standingsBody");
const themeToggle = document.getElementById("themeToggle");

function setSaveStatus(message) {
  saveStatus.textContent = message;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setSaveStatus("Saved");
}

function autosave() {
  setSaveStatus("Saving...");
  saveState();
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state = {
      ...structuredClone(defaultState),
      ...parsed,
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {})
      },
      teams: parsed.teams || []
    };
  } catch {
    state = structuredClone(defaultState);
  }
}

function render() {
  pageTitle.textContent = state.tournamentName || "Tournament Manager";

  tournamentNameInput.value = state.tournamentName;
  tournamentDescriptionInput.value = state.description;
  winPointsInput.value = state.settings.winPoints;
  drawPointsInput.value = state.settings.drawPoints;
  byePointsInput.value = state.settings.byePoints;

  teamList.innerHTML = "";

  if (state.teams.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No teams added yet.";
    teamList.appendChild(empty);
  }

  state.teams.forEach((team, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${team.name}</span>
      <button class="delete" data-index="${index}">Delete</button>
    `;

    teamList.appendChild(li);
  });

  standingsBody.innerHTML = "";

  state.teams.forEach((team, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${team.name}</td>
      <td>${team.points}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
    `;

    standingsBody.appendChild(row);
  });
}

function updateTournamentSettings() {
  state.tournamentName = tournamentNameInput.value.trim() || "Untitled Tournament";
  state.description = tournamentDescriptionInput.value.trim();

  state.settings.winPoints = Number(winPointsInput.value) || 3;
  state.settings.drawPoints = Number(drawPointsInput.value) || 0;
  state.settings.byePoints = Number(byePointsInput.value) || 0;

  autosave();
  render();
}

function addTeam() {
  const name = teamInput.value.trim();

  if (!name) return;

  const duplicate = state.teams.some(
    team => team.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    alert("That team already exists.");
    return;
  }

  state.teams.push({
    id: crypto.randomUUID(),
    name,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    byes: 0,
    pointsFor: 0,
    pointsAgainst: 0
  });

  teamInput.value = "";
  autosave();
  render();
}

saveTournamentButton.addEventListener("click", updateTournamentSettings);

[
  tournamentNameInput,
  tournamentDescriptionInput,
  winPointsInput,
  drawPointsInput,
  byePointsInput
].forEach(input => {
  input.addEventListener("change", updateTournamentSettings);
});

addTeamButton.addEventListener("click", addTeam);

teamInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTeam();
  }
});

teamList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("delete")) return;

  const index = Number(event.target.dataset.index);
  const team = state.teams[index];

  const confirmed = confirm(`Delete ${team.name}?`);

  if (!confirmed) return;

  state.teams.splice(index, 1);

  autosave();
  render();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

resetTournamentButton.addEventListener("click", () => {
  const confirmed = confirm("Reset the entire tournament? This cannot be undone.");

  if (!confirmed) return;

  state = structuredClone(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  render();
  setSaveStatus("Reset");
});

loadState();
render();