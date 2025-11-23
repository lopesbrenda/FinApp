// static/js/dashboard.js
import { auth } from "./firebase-config.js";
import { getUserExpenses, addExpense, deleteExpense } from "./expenses.js";
import { getUserGoals, addGoal, updateGoalAmount } from "./goals.js";
import { addItem, getItems, deleteItem, updateItem } from "./firebase-db.js";
import { showAlert } from "./utils/alerts.js";

// Espera o usuário logado
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const userId = user.uid;

  // 🔹 Carrega despesas
  const expenses = await getUserExpenses(userId);
  renderExpenses(expenses);

  // 🔹 Carrega metas
  const goals = await getUserGoals(userId);
  renderGoals(goals);

  // 🔹 Evento adicionar despesa
  const addExpenseBtn = document.getElementById("add-expense-btn");
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener("click", async () => {
      const amount = prompt("Valor:");
      const category = prompt("Categoria:");
      const type = prompt("Tipo (expense/income):");
      const note = prompt("Nota (opcional):");

      if (!amount || !category || !type) {
        showAlert("Preencha todos os campos!", "error");
        return;
      }

      await addExpense(userId, amount, category, type, note);
      const updated = await getUserExpenses(userId);
      renderExpenses(updated);
      updateDashboardBalance(updated);
    });
  }

  // 🔹 Evento adicionar meta
  const addGoalBtn = document.getElementById("add-goal-btn");
  if (addGoalBtn) {
    addGoalBtn.addEventListener("click", async () => {
      const title = prompt("Título da meta:");
      const target = prompt("Valor alvo:");
      const dueDate = prompt("Data de vencimento (YYYY-MM-DD):");

      if (!title || !target || !dueDate) {
        showAlert("Preencha todos os campos!", "error");
        return;
      }

      await addGoal(userId, title, target, dueDate);
      const updatedGoals = await getUserGoals(userId);
      renderGoals(updatedGoals);
    });
  }
});

// Renderiza despesas na tela
function renderExpenses(expenses) {
  const container = document.getElementById("expenses-list");
  if (!container) return;
  container.innerHTML = "";

  let total = 0;
  expenses.forEach(exp => {
    const row = document.createElement("div");
    row.classList.add("expense-row");
    row.innerHTML = `
      <span>${exp.category} (${exp.type})</span>
      <span>R$ ${exp.amount}</span>
      <button data-id="${exp.id}" class="delete-expense">❌</button>
    `;
    container.appendChild(row);

    total += exp.type === "income" ? exp.amount : -exp.amount;

    // delete button
    row.querySelector(".delete-expense").addEventListener("click", async () => {
      await deleteExpense(exp.id);
      const updated = await getUserExpenses(auth.currentUser.uid);
      renderExpenses(updated);
      updateDashboardBalance(updated);
    });
  });

  updateDashboardBalance(expenses);
}

// Atualiza saldo total
function updateDashboardBalance(expenses) {
  const balanceEl = document.getElementById("balance-summary");
  if (!balanceEl) return;

  let total = 0;
  expenses.forEach(e => total += e.type === "income" ? e.amount : -e.amount);

  balanceEl.textContent = `Saldo: R$ ${total.toFixed(2)}`;
}

// Renderiza metas
function renderGoals(goals) {
  const container = document.getElementById("goals-list");
  if (!container) return;
  container.innerHTML = "";

  goals.forEach(goal => {
    const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
    const row = document.createElement("div");
    row.classList.add("goal-row");
    row.innerHTML = `
      <span>${goal.title} - R$ ${goal.currentAmount} / R$ ${goal.targetAmount}</span>
      <progress value="${percent}" max="100"></progress>
    `;
    container.appendChild(row);
  });
}

// Example: add expense
async function addTestData() {
  try {
    const id = await addItem("requests", {
      type: "faq",
      title: "How to manage budget?",
      content: "Use the expense tracker to manage monthly budget.",
      source: "system",
    });
    showAlert(`New FAQ added (ID: ${id})`, "success");
  } catch (err) {
    showAlert("Failed to add data: " + err.message, "error");
  }
}

// Example: fetch all FAQs
async function loadFAQs() {
  const faqs = await getItems("requests");
  console.log("📚 FAQs:", faqs);
}

addTestData();
loadFAQs();