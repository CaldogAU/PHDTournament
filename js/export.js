function getSafeFileName(value) {
  return String(value || "tournament")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tournament";
}

function exportTournamentJson() {
  const exportData = {
    app: "PHDTournament",
    exportedAt: new Date().toISOString(),
    version: PHDTournament.state.version || "0.8.0",
    data: PHDTournament.state
  };

  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const tournamentName = PHDTournament.state.tournament.name;

  link.href = url;
  link.download = `${getSafeFileName(tournamentName)}-backup.json`;
  link.click();

  URL.revokeObjectURL(url);
  setSaveStatus("Exported");
}

function normaliseImportedState(imported) {
  const incoming = imported.data || imported;

  if (!incoming || !Array.isArray(incoming.teams) || !Array.isArray(incoming.rounds)) {
    throw new Error("Invalid tournament file.");
  }

  return {
    ...structuredClone(PHDTournament.defaultState),
    ...incoming,
    tournament: {
      ...PHDTournament.defaultState.tournament,
      ...(incoming.tournament || {}),
      settings: {
        ...PHDTournament.defaultState.tournament.settings,
        ...((incoming.tournament && incoming.tournament.settings) || {})
      }
    },
    teams: incoming.teams || [],
    rounds: incoming.rounds || []
  };
}

function importTournamentJson(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = normaliseImportedState(parsed);

      const confirmed = confirm(
        "Import this tournament? This will replace the current tournament."
      );

      if (!confirmed) return;

      PHDTournament.state = importedState;
      autosave();
      render();
      setSaveStatus("Imported");
      alert("Tournament imported successfully.");
    } catch (error) {
      alert("Could not import this JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

function printTournamentReport() {
  setSaveStatus("Printing...");
  window.print();
  setSaveStatus("Ready");
}
function escapeCsvValue(value) {
  const stringValue = String(value ?? "");

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function downloadTextFile(filename, content, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function exportStandingsCsv() {
  const standings = getStandings();

  const rows = [
    ["Rank", "Team", "Points", "Wins", "Draws", "Losses", "Byes", "Points For", "Points Against", "Difference"],
    ...standings.map((team, index) => [
      index + 1,
      team.name,
      team.points,
      team.wins,
      team.draws,
      team.losses,
      team.byes,
      team.pointsFor,
      team.pointsAgainst,
      getScoreDifference(team)
    ])
  ];

  const csv = rows
    .map(row => row.map(escapeCsvValue).join(","))
    .join("\n");

  const filename = `${getSafeFileName(getTournament().name)}-standings.csv`;

  downloadTextFile(filename, csv, "text/csv");
  setSaveStatus("Standings CSV exported");
}

function exportMatchesCsv() {
  const history = getMatchHistory();

  const rows = [
    ["Round", "Type", "Team A", "Team B", "Score", "Status"],
    ...history.map(item => [
      item.round,
      item.type,
      item.teamA,
      item.teamB,
      item.score,
      item.status
    ])
  ];

  const csv = rows
    .map(row => row.map(escapeCsvValue).join(","))
    .join("\n");

  const filename = `${getSafeFileName(getTournament().name)}-matches.csv`;

  downloadTextFile(filename, csv, "text/csv");
  setSaveStatus("Matches CSV exported");
}
PHDTournament.modules.push("export");