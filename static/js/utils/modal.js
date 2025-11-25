import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../expenses.js";
import { userPreferencesService } from "../services/user-preferences.js";
import { auth } from "../firebase/firebase-config.js";
import { showAlert } from "./alerts.js";

let modalStack = [];

export function showModal({ title, message = "", type = "confirm", preselectedType = "", prefill = {}, onConfirm, onCancel, isSubModal = false }) {
  if (!isSubModal) {
    const existingModals = document.querySelectorAll('[id^="modal-"]');
    existingModals.forEach(m => m.remove());
    modalStack = [];
  }

  const modalId = isSubModal ? `modal-sub-${Date.now()}` : "modal-main";
  
  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "modal-overlay";
  
  const modalInstance = {
    element: modal,
    id: modalId,
    getField: (selector) => modal.querySelector(selector),
    close: null
  };
  
  if (isSubModal) {
    const zIndex = 10001 + modalStack.length;
    modal.style.zIndex = zIndex.toString();
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    modalStack.push(modalId);
  }

  let formContent = "";

  if (type === "contribute") {
    const goalsOptions = (window.goals || [])
      .map(g => `<option value="${g.id}">${g.title} (${g.currentAmount || 0} / ${g.targetAmount})</option>`)
      .join('');
    
    formContent = `
      <label for="contrib-goal">Select Goal</label>
      <select id="contrib-goal" required>
        <option value="">Choose a goal...</option>
        ${goalsOptions}
      </select>
      
      <label for="contrib-amount">Contribution Amount</label>
      <input type="number" id="contrib-amount" step="0.01" min="0" placeholder="0.00" required />
    `;
  } else if (type === "expense" || type === "income") {
    const selectedIncome = (preselectedType === "income" || type === "income") ? "selected" : "";
    const selectedExpense = (preselectedType === "expense" || type === "expense") ? "selected" : "";
    const today = new Date().toISOString().split('T')[0];
    
    formContent = `
      <label for="exp-type">Type</label>
      <select id="exp-type" required>
        <option value="">Select type...</option>
        <option value="expense" ${selectedExpense}>Expense</option>
        <option value="income" ${selectedIncome}>Income</option>
      </select>
      
      <label for="exp-category">Category</label>
      <div style="display: flex; gap: 8px; align-items: center;">
        <select id="exp-category" required style="flex: 1;">
          <option value="">Select category...</option>
        </select>
        <button type="button" id="add-custom-category" class="btn" style="flex-shrink: 0; padding: 6px; width: 32px; height: 32px; font-size: 16px; line-height: 1; margin: 0;">
          +
        </button>
      </div>
      
      <div id="payment-method-container">
        <label for="exp-payment-method">Payment Method</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <select id="exp-payment-method" required style="flex: 1;">
            <option value="">Select payment method...</option>
            <option value="credit">💳 Credit Card</option>
            <option value="debit">💳 Debit Card</option>
            <option value="cash" selected>💵 Cash</option>
          </select>
          <button type="button" id="add-custom-payment" class="btn" style="flex-shrink: 0; padding: 6px; width: 32px; height: 32px; font-size: 16px; line-height: 1; margin: 0;">
            +
          </button>
        </div>
      </div>
      
      <label for="exp-amount">Amount</label>
      <input type="number" id="exp-amount" step="0.01" min="0" placeholder="0.00" required />
      
      <label for="exp-date">Date</label>
      <input type="date" id="exp-date" value="${today}" required />
      
      <label for="exp-notes">Notes (Optional)</label>
      <textarea id="exp-notes" placeholder="Add notes about this transaction..." style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #e6e6ee; font-size: 1rem; min-height: 80px; font-family: inherit; resize: vertical;"></textarea>
      
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
        <input type="checkbox" id="exp-recurring" style="width: auto; margin: 0;" />
        <label for="exp-recurring" style="margin: 0; font-weight: normal;">Make this recurring</label>
      </div>
      
      <div id="recurring-options" style="display: none; margin-top: 16px;">
        <label for="exp-frequency">Frequency</label>
        <select id="exp-frequency">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly" selected>Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        
        <label for="exp-end-date">End Date (Optional)</label>
        <input type="date" id="exp-end-date" />
      </div>
    `;
  } else if (type === "goal") {
    formContent = `
      <label for="goal-title">Goal Title</label>
      <input type="text" id="goal-title" placeholder="e.g., New Car" required />
      
      <label for="goal-target">Target Amount</label>
      <input type="number" id="goal-target" step="0.01" min="0" placeholder="0.00" required />
      
      <label for="goal-date">Due Date</label>
      <input type="date" id="goal-date" required />
    `;
  } else if (type === "custom-category") {
    const categoryType = message || "expense";
    formContent = `
      <label for="custom-category-name">Category Name</label>
      <input type="text" id="custom-category-name" placeholder="e.g., Groceries, Freelance" required />
      
      <label for="custom-category-icon">Emoji Icon</label>
      <input type="text" id="custom-category-icon" placeholder="🏠 🚗 💼 📋" maxlength="2" value="📋" required />
      
      <small style="color: var(--text-secondary, #666); font-size: 12px; display: block; margin-top: 8px;">
        Copy/paste an emoji or use your keyboard's emoji picker
      </small>
    `;
  } else if (type === "custom-payment") {
    formContent = `
      <label for="custom-payment-name">Payment Method Name</label>
      <input type="text" id="custom-payment-name" placeholder="e.g., Pix, Boleto, PayPal" required />
      
      <label for="custom-payment-icon">Emoji Icon</label>
      <input type="text" id="custom-payment-icon" placeholder="💳 💵 🏦 📱" maxlength="2" value="💳" required />
      
      <small style="color: var(--text-secondary, #666); font-size: 12px; display: block; margin-top: 8px;">
        Copy/paste an emoji or use your keyboard's emoji picker
      </small>
    `;
  } else {
    formContent = `<p>${message}</p>`;
  }

  modal.innerHTML = `
    <div class="modal-box">
      <h2>${title}</h2>
      <div class="form">
        ${formContent}
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
        <button class="btn modal-confirm-btn">${type === "confirm" ? "OK" : "Save"}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add("show"), 10);

  const typeSelect = !isSubModal ? modal.querySelector("#exp-type") : null;
  const categorySelect = !isSubModal ? modal.querySelector("#exp-category") : null;
  const paymentMethodSelect = !isSubModal ? modal.querySelector("#exp-payment-method") : null;
  const paymentMethodContainer = !isSubModal ? modal.querySelector("#payment-method-container") : null;
  const recurringCheckbox = !isSubModal ? modal.querySelector("#exp-recurring") : null;
  const recurringOptions = !isSubModal ? modal.querySelector("#recurring-options") : null;

  const populatePaymentMethods = async () => {
    if (!paymentMethodSelect) return;
    
    paymentMethodSelect.innerHTML = '<option value="">Select payment method...</option>';
    
    if (auth.currentUser) {
      try {
        const prefs = await userPreferencesService.getUserPreferences(auth.currentUser.uid);
        const methods = prefs?.paymentMethods || [
          { id: "credit", name: "Credit Card", icon: "💳" },
          { id: "debit", name: "Debit Card", icon: "💳" },
          { id: "cash", name: "Cash", icon: "💵" }
        ];
        
        methods.forEach(method => {
          const option = document.createElement("option");
          option.value = method.id;
          option.textContent = `${method.icon} ${method.name}`;
          paymentMethodSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
    }
  };

  if (typeSelect && categorySelect) {
    const populateCategories = async () => {
      const selectedType = typeSelect.value;
      categorySelect.innerHTML = '<option value="">Select category...</option>';
      
      if (selectedType) {
        const categories = selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        
        categories.forEach(cat => {
          const option = document.createElement("option");
          option.value = cat.id;
          option.textContent = `${cat.icon} ${cat.name}`;
          categorySelect.appendChild(option);
        });
        
        if (auth.currentUser) {
          try {
            const prefs = await userPreferencesService.getUserPreferences(auth.currentUser.uid);
            const customCategories = prefs?.customCategories || [];
            const filteredCustom = customCategories.filter(c => c.type === selectedType);
            
            if (filteredCustom.length > 0) {
              const separator = document.createElement("option");
              separator.disabled = true;
              separator.textContent = "--- Custom Categories ---";
              categorySelect.appendChild(separator);
              
              filteredCustom.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat.id;
                option.textContent = `${cat.icon} ${cat.name}`;
                categorySelect.appendChild(option);
              });
            }
          } catch (error) {
            console.error("Error loading custom categories:", error);
          }
        }
      }
    };

    const updatePaymentMethodVisibility = () => {
      const selectedType = typeSelect.value;
      if (paymentMethodContainer) {
        if (selectedType === "income") {
          paymentMethodContainer.style.display = "none";
          if (paymentMethodSelect) {
            paymentMethodSelect.removeAttribute("required");
          }
        } else {
          paymentMethodContainer.style.display = "block";
          if (paymentMethodSelect) {
            paymentMethodSelect.setAttribute("required", "required");
          }
        }
      }
    };

    typeSelect.addEventListener("change", () => {
      populateCategories();
      updatePaymentMethodVisibility();
    });
    
    setTimeout(() => {
      if (typeSelect.value) {
        populateCategories();
      }
      populatePaymentMethods();
      updatePaymentMethodVisibility();
    }, 50);
  }
  
  const addCustomCategoryBtn = !isSubModal ? modal.querySelector("#add-custom-category") : null;
  if (addCustomCategoryBtn) {
    addCustomCategoryBtn.addEventListener("click", async () => {
      const selectedType = typeSelect?.value || "expense";
      
      if (!selectedType) {
        showAlert("Please select Income or Expense first.", "info");
        return;
      }
      
      if (!auth.currentUser) {
        showAlert("Please log in to save custom categories.", "error");
        return;
      }
      
      showModal({
        title: `Add Custom ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Category`,
        message: selectedType,
        type: "custom-category",
        isSubModal: true,
        onConfirm: async (subModalInstance) => {
          const categoryName = subModalInstance.getField("#custom-category-name")?.value.trim();
          const categoryIcon = subModalInstance.getField("#custom-category-icon")?.value.trim();
          
          if (!categoryName) {
            showAlert("Please enter a category name.", "error");
            return false;
          }
          
          const newCategory = {
            id: `custom_${Date.now()}`,
            name: categoryName,
            icon: categoryIcon || "📋",
            type: selectedType
          };
          
          try {
            const success = await userPreferencesService.addCustomCategory(auth.currentUser.uid, newCategory);
            
            if (success) {
              showAlert(`Category "${categoryName}" added!`, "success");
              await populateCategories();
              categorySelect.value = newCategory.id;
            } else {
              showAlert("Failed to save category. Please try again.", "error");
              return false;
            }
          } catch (error) {
            console.error("Error saving custom category:", error);
            showAlert("Failed to save category. Please try again.", "error");
            return false;
          }
        }
      });
    });
  }

  const addCustomPaymentBtn = !isSubModal ? modal.querySelector("#add-custom-payment") : null;
  if (addCustomPaymentBtn) {
    addCustomPaymentBtn.addEventListener("click", async () => {
      if (!auth.currentUser) {
        showAlert("Please log in to save custom payment methods.", "error");
        return;
      }
      
      showModal({
        title: "Add Custom Payment Method",
        type: "custom-payment",
        isSubModal: true,
        onConfirm: async (subModalInstance) => {
          const paymentName = subModalInstance.getField("#custom-payment-name")?.value.trim();
          const paymentIcon = subModalInstance.getField("#custom-payment-icon")?.value.trim();
          
          if (!paymentName) {
            showAlert("Please enter a payment method name.", "error");
            return false;
          }
          
          const newPaymentMethod = {
            id: `custom_${Date.now()}`,
            name: paymentName,
            icon: paymentIcon || "💳"
          };
          
          try {
            const success = await userPreferencesService.addPaymentMethod(auth.currentUser.uid, newPaymentMethod);
            
            if (success) {
              showAlert(`Payment method "${paymentName}" added!`, "success");
              await populatePaymentMethods();
              paymentMethodSelect.value = newPaymentMethod.id;
            } else {
              showAlert("Failed to save payment method. Please try again.", "error");
              return false;
            }
          } catch (error) {
            console.error("Error saving payment method:", error);
            showAlert("Failed to save payment method. Please try again.", "error");
            return false;
          }
        }
      });
    });
  }

  if (recurringCheckbox && recurringOptions) {
    recurringCheckbox.addEventListener("change", (e) => {
      recurringOptions.style.display = e.target.checked ? "block" : "none";
    });
  }

  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
      if (isSubModal) {
        const index = modalStack.indexOf(modalId);
        if (index > -1) {
          modalStack.splice(index, 1);
        }
        if (modalStack.length === 0) {
          const parentModal = document.getElementById("modal-main");
          if (parentModal) {
            parentModal.style.filter = "none";
          }
        }
      }
    }, 300);
  };

  modalInstance.close = closeModal;

  if (isSubModal) {
    const parentModal = document.getElementById("modal-main");
    if (parentModal && modalStack.length === 1) {
      parentModal.style.filter = "blur(2px)";
    }
  }

  const cancelBtn = modal.querySelector(".modal-cancel-btn");
  const confirmBtn = modal.querySelector(".modal-confirm-btn");
  
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      closeModal();
      if (onCancel) onCancel(modalInstance);
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      if (onConfirm) {
        const result = await onConfirm(modalInstance);
        if (result !== false) {
          closeModal();
        }
      } else {
        closeModal();
      }
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
      if (onCancel) onCancel(modalInstance);
    }
  });

  // Apply prefill values after modal is added to DOM
  setTimeout(() => {
    Object.keys(prefill).forEach((selector) => {
      const field = modal.querySelector(selector);
      if (field) {
        field.value = prefill[selector];
      }
    });
  }, 0);

  return modalInstance;
}
