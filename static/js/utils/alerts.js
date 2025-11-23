// utils/alerts.js
export function showAlert(message, type = "info") {
  const alertBox = document.createElement("div");
  alertBox.className = `alert ${type}`;
  alertBox.textContent = message;

  document.body.appendChild(alertBox);
  setTimeout(() => {
    alertBox.remove();
  }, 4000);
}
