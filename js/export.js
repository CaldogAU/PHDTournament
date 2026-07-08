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

PHDTournament.modules.push("export");