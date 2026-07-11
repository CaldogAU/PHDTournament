const PHDAudit = {
  collectionName: "auditLogs",
  maximumRecentEntries: 50
};

function getAuditCollectionReference(firebase) {
  return firebase.firestoreSdk.collection(
    firebase.db,
    PHDAudit.collectionName
  );
}

function getAuditUserDetails() {
  const user =
    typeof getSignedInUser === "function"
      ? getSignedInUser()
      : null;

  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email || ""
  };
}

function requireAuditAdministrator() {
  if (
    typeof isTournamentAdmin !== "function" ||
    !isTournamentAdmin()
  ) {
    throw new Error(
      "Administrator access is required to create audit entries."
    );
  }
}

function normaliseAuditDetails(details) {
  if (
    details === null ||
    details === undefined
  ) {
    return {};
  }

  if (
    typeof details === "string" ||
    typeof details === "number" ||
    typeof details === "boolean"
  ) {
    return {
      value: details
    };
  }

  try {
    return structuredClone(details);
  } catch {
    return {
      value: String(details)
    };
  }
}

async function createAuditEntry(
  action,
  summary,
  details = {}
) {
  requireAuditAdministrator();

  const firebase =
    await PHDFirebase.ready;

  const user =
    getAuditUserDetails();

  if (!user) {
    throw new Error(
      "A signed-in administrator is required to create an audit entry."
    );
  }

  const normalisedAction =
    String(action || "").trim();

  const normalisedSummary =
    String(summary || "").trim();

  if (!normalisedAction) {
    throw new Error(
      "An audit action is required."
    );
  }

  if (!normalisedSummary) {
    throw new Error(
      "An audit summary is required."
    );
  }

  const collectionReference =
    getAuditCollectionReference(firebase);

  const documentReference =
    firebase.firestoreSdk.doc(
      collectionReference
    );

  const entry = {
    action: normalisedAction,
    summary: normalisedSummary,
    details:
      normaliseAuditDetails(details),
    adminUid: user.uid,
    adminEmail: user.email,
    createdAt:
      firebase.firestoreSdk.serverTimestamp(),
    tournamentDocument:
      PHDFirebase.tournamentDocument,
    appVersion:
      PHDTournament.state &&
      PHDTournament.state.version
        ? PHDTournament.state.version
        : ""
  };

  await firebase.firestoreSdk.setDoc(
    documentReference,
    entry
  );

  return documentReference.id;
}

async function recordAuditEntry(
  action,
  summary,
  details = {}
) {
  try {
    return await createAuditEntry(
      action,
      summary,
      details
    );
  } catch (error) {
    console.error(
      "Audit entry could not be created.",
      error
    );

    return null;
  }
}

function convertAuditTimestamp(value) {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (
    typeof value.seconds === "number"
  ) {
    return new Date(
      value.seconds * 1000
    );
  }

  const parsedDate =
    new Date(value);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? null
    : parsedDate;
}

function normaliseAuditEntry(
  documentSnapshot
) {
  const data =
    documentSnapshot.data() || {};

  return {
    id: documentSnapshot.id,
    action:
      String(data.action || ""),
    summary:
      String(data.summary || ""),
    details:
      data.details || {},
    adminUid:
      String(data.adminUid || ""),
    adminEmail:
      String(data.adminEmail || ""),
    createdAt:
      convertAuditTimestamp(
        data.createdAt
      ),
    tournamentDocument:
      String(
        data.tournamentDocument || ""
      ),
    appVersion:
      String(data.appVersion || "")
  };
}

async function getRecentAuditEntries(
  limitCount =
    PHDAudit.maximumRecentEntries
) {
  requireAuditAdministrator();

  const firebase =
    await PHDFirebase.ready;

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limitCount) ||
          PHDAudit.maximumRecentEntries,
        200
      )
    );

  const collectionReference =
    getAuditCollectionReference(firebase);

  const auditQuery =
    firebase.firestoreSdk.query(
      collectionReference,
      firebase.firestoreSdk.orderBy(
        "createdAt",
        "desc"
      ),
      firebase.firestoreSdk.limit(
        safeLimit
      )
    );

  const snapshot =
    await firebase.firestoreSdk.getDocs(
      auditQuery
    );

  return snapshot.docs.map(
    normaliseAuditEntry
  );
}

async function subscribeToRecentAuditEntries(
  listener,
  limitCount =
    PHDAudit.maximumRecentEntries
) {
  requireAuditAdministrator();

  if (
    typeof listener !== "function"
  ) {
    throw new Error(
      "An audit listener function is required."
    );
  }

  const firebase =
    await PHDFirebase.ready;

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limitCount) ||
          PHDAudit.maximumRecentEntries,
        200
      )
    );

  const collectionReference =
    getAuditCollectionReference(firebase);

  const auditQuery =
    firebase.firestoreSdk.query(
      collectionReference,
      firebase.firestoreSdk.orderBy(
        "createdAt",
        "desc"
      ),
      firebase.firestoreSdk.limit(
        safeLimit
      )
    );

  return firebase.firestoreSdk.onSnapshot(
    auditQuery,
    snapshot => {
      listener(
        snapshot.docs.map(
          normaliseAuditEntry
        )
      );
    },
    error => {
      console.error(
        "Audit log listener failed.",
        error
      );

      listener([], error);
    }
  );
}

function formatAuditTimestamp(
  timestamp
) {
  const date =
    timestamp instanceof Date
      ? timestamp
      : convertAuditTimestamp(
          timestamp
        );

  if (!date) {
    return "Pending";
  }

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

window.PHDAudit = PHDAudit;
window.createAuditEntry =
  createAuditEntry;
window.recordAuditEntry =
  recordAuditEntry;
window.getRecentAuditEntries =
  getRecentAuditEntries;
window.subscribeToRecentAuditEntries =
  subscribeToRecentAuditEntries;
window.formatAuditTimestamp =
  formatAuditTimestamp;