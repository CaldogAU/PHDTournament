function getElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    console.warn(`Missing element: #${id}`);
  }

  return element;
}

function bindClick(id, handler) {
  const element = getElement(id);

  if (!element) return;

  element.addEventListener("click", handler);
}

function bindChange(id, handler) {
  const element = getElement(id);

  if (!element) return;

  element.addEventListener("change", handler);
}

function setText(id, value) {
  const element = getElement(id);

  if (!element) return;

  element.textContent = value;
}

function setValue(id, value) {
  const element = getElement(id);

  if (!element) return;

  element.value = value;
}

function getValue(id) {
  const element = getElement(id);

  return element ? element.value : "";
}

PHDTournament.modules.push("dom");