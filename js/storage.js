function saveState() {
  localStorage.setItem(
    PHDTournament.storageKey,
    JSON.stringify(PHDTournament.state)
  );

  setSaveStatus("Saved");
}

function autosave() {
  setSaveStatus("Saving...");
  saveState();
}

function loadState() {
  const saved = localStorage.getItem(PHDTournament.storageKey);

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    PHDTournament.state = {
      ...structuredClone(PHDTournament.defaultState),
      ...parsed,
      tournament: {
        ...PHDTournament.defaultState.tournament,
        ...(parsed.tournament || {}),
        settings: {
          ...PHDTournament.defaultState.tournament.settings,
          ...((parsed.tournament && parsed.tournament.settings) || {})
        }
      },
      teams: parsed.teams || [],
      rounds: parsed.rounds || []
    };
  } catch {
    PHDTournament.state = structuredClone(PHDTournament.defaultState);
  }
}

function resetState() {
  PHDTournament.state = structuredClone(PHDTournament.defaultState);
  localStorage.removeItem(PHDTournament.storageKey);
  setSaveStatus("Reset");
}

PHDTournament.modules.push("storage");