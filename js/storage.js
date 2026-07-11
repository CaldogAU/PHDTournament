let cloudTournamentUnsubscribe = null;
let lastCloudState = structuredClone(PHDTournament.defaultState);
let cloudStateHasLoaded = false;
let cloudWriteInProgress = false;

function mergeTournamentState(sourceState) {
  const source = sourceState || {};

  return {
    ...structuredClone(PHDTournament.defaultState),
    ...source,
    tournament: {
      ...PHDTournament.defaultState.tournament,
      ...(source.tournament || {}),
      settings: {
        ...PHDTournament.defaultState.tournament.settings,
        ...((source.tournament && source.tournament.settings) || {})
      }
    },
    teams: Array.isArray(source.teams) ? source.teams : [],
    games: Array.isArray(source.games) ? source.games : [],
    rounds: Array.isArray(source.rounds) ? source.rounds : []
  };
}

function getTournamentDocumentReference(firebase) {
  return firebase.firestoreSdk.doc(
    firebase.db,
    firebase.tournamentCollection,
    firebase.tournamentDocument
  );
}

function getRestoreDocumentReference(firebase) {
  return firebase.firestoreSdk.doc(
    firebase.db,
    firebase.tournamentCollection,
    "restore-current"
  );
}

function cloneStateForCloud() {
  return structuredClone(PHDTournament.state);
}

function requireTournamentAdmin() {
  if (
    typeof isTournamentAdmin !== "function" ||
    !isTournamentAdmin()
  ) {
    throw new Error(
      "Administrator access is required to change tournament data."
    );
  }
}

function restoreLastCloudState() {
  PHDTournament.state = mergeTournamentState(lastCloudState);

  if (typeof render === "function") {
    render();
  }
}

async function saveState() {
  requireTournamentAdmin();

  const firebase = await PHDFirebase.ready;
  const user =
    typeof getSignedInUser === "function"
      ? getSignedInUser()
      : null;

  const tournamentReference =
    getTournamentDocumentReference(firebase);

  cloudWriteInProgress = true;
  setSaveStatus("Saving to cloud...");

  try {
    const stateToSave = cloneStateForCloud();

    await firebase.firestoreSdk.setDoc(
      tournamentReference,
      {
        state: stateToSave,
        updatedAt:
          firebase.firestoreSdk.serverTimestamp(),
        updatedBy: user
          ? {
              uid: user.uid,
              email: user.email || ""
            }
          : null
      }
    );

    lastCloudState = mergeTournamentState(stateToSave);
    setSaveStatus("Saved to cloud");
  } catch (error) {
    console.error(
      "Tournament cloud save failed.",
      error
    );

    restoreLastCloudState();
    setSaveStatus("Cloud save failed");

    throw error;
  } finally {
    cloudWriteInProgress = false;
  }
}

function autosave() {
  setSaveStatus("Saving to cloud...");

  saveState().catch(error => {
    const message =
      error && error.message
        ? error.message
        : "Tournament data could not be saved.";

    alert(message);
  });
}

async function createInitialCloudTournament(firebase) {
  requireTournamentAdmin();

  const user =
    typeof getSignedInUser === "function"
      ? getSignedInUser()
      : null;

  const tournamentReference =
    getTournamentDocumentReference(firebase);

  const initialState =
    mergeTournamentState(PHDTournament.defaultState);

  await firebase.firestoreSdk.setDoc(
    tournamentReference,
    {
      state: initialState,
      createdAt:
        firebase.firestoreSdk.serverTimestamp(),
      updatedAt:
        firebase.firestoreSdk.serverTimestamp(),
      updatedBy: user
        ? {
            uid: user.uid,
            email: user.email || ""
          }
        : null
    }
  );

  lastCloudState = structuredClone(initialState);
}

function applyCloudSnapshot(snapshot) {
  if (!snapshot.exists()) {
    cloudStateHasLoaded = true;
    setSaveStatus("No cloud tournament yet");
    return;
  }

  const documentData = snapshot.data();
  const incomingState =
    documentData && documentData.state
      ? documentData.state
      : documentData;

  const mergedState =
    mergeTournamentState(incomingState);

  lastCloudState = structuredClone(mergedState);
  PHDTournament.state = mergedState;
  cloudStateHasLoaded = true;

  if (
    typeof render === "function" &&
    !cloudWriteInProgress
  ) {
    render();
  }

  setSaveStatus("Cloud data loaded");
}

async function startCloudTournamentListener() {
  const firebase = await PHDFirebase.ready;
  const tournamentReference =
    getTournamentDocumentReference(firebase);

  if (cloudTournamentUnsubscribe) {
    cloudTournamentUnsubscribe();
    cloudTournamentUnsubscribe = null;
  }

  cloudTournamentUnsubscribe =
    firebase.firestoreSdk.onSnapshot(
      tournamentReference,
      snapshot => {
        applyCloudSnapshot(snapshot);
      },
      error => {
        console.error(
          "Tournament live update listener failed.",
          error
        );

        setSaveStatus("Cloud connection failed");
      }
    );
}

function loadState() {
  /*
   * Remove legacy locally stored tournament data.
   * Theme preference remains local and is handled separately.
   */
  localStorage.removeItem(PHDTournament.storageKey);
  localStorage.removeItem(
    `${PHDTournament.storageKey}:restore`
  );

  PHDTournament.state =
    mergeTournamentState(PHDTournament.defaultState);

  lastCloudState =
    structuredClone(PHDTournament.state);

  startCloudTournamentListener().catch(error => {
    console.error(
      "Could not start cloud tournament storage.",
      error
    );

    setSaveStatus("Cloud unavailable");
  });

  if (
    typeof subscribeToAuth === "function"
  ) {
    subscribeToAuth(async authState => {
      if (
        !authState ||
        !authState.isAdmin ||
        cloudStateHasLoaded
      ) {
        return;
      }

      try {
        const firebase = await PHDFirebase.ready;
        const tournamentReference =
          getTournamentDocumentReference(firebase);

        const snapshot =
          await firebase.firestoreSdk.getDoc(
            tournamentReference
          );

        if (!snapshot.exists()) {
          await createInitialCloudTournament(firebase);
          setSaveStatus(
            "Cloud tournament created"
          );
        }
      } catch (error) {
        console.error(
          "Could not create the initial cloud tournament.",
          error
        );

        setSaveStatus(
          "Cloud tournament creation failed"
        );
      }
    });
  }
}

function resetState() {
  requireTournamentAdmin();

  PHDTournament.state =
    mergeTournamentState(PHDTournament.defaultState);

  autosave();
  setSaveStatus("Resetting cloud tournament");
}

function saveThemePreference(theme) {
  localStorage.setItem(
    PHDTournament.themeKey,
    theme
  );
}

function loadThemePreference() {
  const savedTheme =
    localStorage.getItem(PHDTournament.themeKey);

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}

async function createRestorePoint() {
  try {
    requireTournamentAdmin();

    const firebase = await PHDFirebase.ready;
    const user =
      typeof getSignedInUser === "function"
        ? getSignedInUser()
        : null;

    const restoreReference =
      getRestoreDocumentReference(firebase);

    setSaveStatus(
      "Creating cloud restore point..."
    );

    await firebase.firestoreSdk.setDoc(
      restoreReference,
      {
        state: cloneStateForCloud(),
        createdAt:
          firebase.firestoreSdk.serverTimestamp(),
        createdBy: user
          ? {
              uid: user.uid,
              email: user.email || ""
            }
          : null
      }
    );

    setSaveStatus(
      "Cloud restore point created"
    );

    alert(
      "Cloud restore point created."
    );
  } catch (error) {
    console.error(
      "Could not create the cloud restore point.",
      error
    );

    setSaveStatus(
      "Restore point failed"
    );

    alert(
      error && error.message
        ? error.message
        : "Could not create the cloud restore point."
    );
  }
}

async function restoreLastPoint() {
  try {
    requireTournamentAdmin();

    const confirmed = confirm(
      "Restore the last cloud restore point? This will replace the current tournament for every viewer."
    );

    if (!confirmed) return;

    const firebase = await PHDFirebase.ready;
    const restoreReference =
      getRestoreDocumentReference(firebase);

    const snapshot =
      await firebase.firestoreSdk.getDoc(
        restoreReference
      );

    if (!snapshot.exists()) {
      alert(
        "No cloud restore point was found."
      );
      return;
    }

    const restoreData = snapshot.data();

    if (
      !restoreData ||
      !restoreData.state
    ) {
      alert(
        "The cloud restore point is invalid."
      );
      return;
    }

    PHDTournament.state =
      mergeTournamentState(
        restoreData.state
      );

    await saveState();

    if (typeof render === "function") {
      render();
    }

    setSaveStatus(
      "Cloud restore point restored"
    );

    alert(
      "Cloud restore point restored."
    );
  } catch (error) {
    console.error(
      "Could not restore the cloud restore point.",
      error
    );

    setSaveStatus("Restore failed");

    alert(
      error && error.message
        ? error.message
        : "Could not restore the cloud restore point."
    );
  }
}

PHDTournament.modules.push("storage");