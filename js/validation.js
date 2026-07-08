function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function toPositiveNumber(value, fallback = 1) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function isBlank(value) {
  return String(value || "").trim().length === 0;
}

PHDTournament.modules.push("validation");