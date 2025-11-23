// @@ static/js/services/logs-service.js
import { addItem, getActivityLogs } from "../firebase/firestore-utils.js";
import { COLLECTION } from "../firebase/firebase-dbs.js";

export const logsService = {
  addLog,
  loadActivityLogs,
  getLogs: getActivityLogs,
};

async function addLog({ userId, action, collectionName = "", documentId = null, before = null, after = null }) {
  try {
    const payload = {
      userId,
      action,
      collectionName,
      documentId,
      before,
      after,
      createdAt: new Date(),
    };
    const id = await addItem(COLLECTION.ACTIVITY_LOG, payload);
    console.log("📌 Activity logged:", action, id);
    return id;
  } catch (err) {
    console.error("❌ Failed to add log:", err);
    throw err;
  }
}

export async function loadActivityLogs() {
  try {
    const userId = (window?.authUser?.uid) || (window?.AUTH_UID) || null;
    
    if (!userId) {
      const container = document.getElementById("activity-list");
      if (container) container.innerHTML = "<p>No activity yet.</p>";
      return;
    }

    const logs = await getActivityLogs(userId);

    // normalize container id
    const container = document.getElementById("activity-list");
    if (!container) return;

    container.innerHTML = "";

    // sort by createdAt descending safely
    logs.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ?? new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() ?? new Date(b.createdAt);
      return bTime - aTime;
    });

    if (!logs.length) {
      container.innerHTML = "<p>No activity yet.</p>";
      return;
    }

    logs.forEach((log) => {
      container.innerHTML = "";

      // Group logs by date
      const logsByDate = {};

      logs.forEach((log) => {
        const logDateObj = log.createdAt?.toDate?.() ?? new Date(log.createdAt);
        const day = logDateObj.toISOString().split("T")[0]; // yyyy-mm-dd

        if (!logsByDate[day]) logsByDate[day] = [];
        logsByDate[day].push(log);
      });

      // Render groups
      Object.keys(logsByDate).sort().reverse().forEach((day) => {
        const daySection = document.createElement("div");
        daySection.className = "log-day";

        daySection.innerHTML = `<h3 class="log-day-title">📅 ${day}</h3>`;

        logsByDate[day].forEach((log) => {
          const logDate = log.createdAt?.toDate?.() ?? new Date(log.createdAt);

          const div = document.createElement("div");
          div.className = "log-item";

          const icon = getActionIcon(log.action);

          div.innerHTML = `
            <div class="log-header">
              <span class="log-icon">${icon}</span>
              <span class="log-action"> ${escapeHtml(log.action)}</span>
              <i class="log-arrow">▸</i>
            </div>

            <div class="log-details">
              <p><strong>Date:</strong> ${logDate.toLocaleString()}</p>
              ${log.collectionName ? `<p><strong>Collection:</strong> ${escapeHtml(log.collectionName)}</p>` : ""}
              ${log.documentId ? `<p><strong>Document ID:</strong> ${escapeHtml(log.documentId)}</p>` : ""}

              <div class="diff-container">
                <div>
                  <h4>Before</h4>
                  <pre>${escapeHtml(JSON.stringify(log.before, null, 2) || "—")}</pre>
                </div>
                <div>
                  <h4>After</h4>
                  <pre>${escapeHtml(JSON.stringify(log.after, null, 2) || "—")}</pre>
                </div>
              </div>
            </div>
          `;

          div.querySelector(".log-header").addEventListener("click", () => {
            div.classList.toggle("open");
          });

          daySection.appendChild(div);
        });

        container.appendChild(daySection);
      });

    });

  } catch (err) {
    console.error("❌ Error loading logs:", err);
  }
}

function getActionIcon(action) {
  const a = action.toLowerCase();

  if (a.includes("delete") || a.includes("removed"))
    return "🗑️";

  if (a.includes("update") || a.includes("edit"))
    return "✏️";

  if (a.includes("create") || a.includes("add"))
    return "➕";

  return "ℹ️";
}
document.querySelectorAll(".filter-btn").forEach((btn) => {
  /* ============================================================================
   ADVANCED FILTER CHECKBOX HANDLER
=========================================================================== */

  const accordion = document.querySelector(".filters-accordion");
  const accordionBody = document.querySelector(".filters-body");

  if (accordion) {
    accordion.querySelector(".filters-header")
      .addEventListener("click", () => {
        accordion.classList.toggle("open");
      });
  }

  document.querySelectorAll(".filter-checkbox").forEach((cb) => {
    cb.addEventListener("change", applyAdvancedFilters);
  });

  function applyAdvancedFilters() {
    const activeFilters = [...document.querySelectorAll(".filter-checkbox:checked")]
      .map(cb => cb.dataset.filter);

    const logs = document.querySelectorAll(".log-item");

    // If no filter selected → show all
    if (activeFilters.length === 0) {
      logs.forEach(log => log.style.display = "block");
      return;
    }

    logs.forEach(log => {
      const action = log.querySelector(".log-action").textContent.toLowerCase();

      const match = activeFilters.some(filter => {
        if (filter === "add") return action.includes("add") || action.includes("create");
        if (filter === "edit") return action.includes("edit") || action.includes("update");
        if (filter === "delete") return action.includes("delete") || action.includes("remove");
      });

      log.style.display = match ? "block" : "none";
    });
  }

  
});

// small helper to prevent HTML injection (simple)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
