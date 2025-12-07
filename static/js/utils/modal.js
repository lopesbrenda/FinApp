import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../expenses.js";
import { userPreferencesService } from "../services/user-preferences.js";
import { auth } from "../firebase/firebase-config.js";
import { showAlert } from "./alerts.js";
import { validateAmount, convertToBaseCurrency, formatCurrency, getBaseCurrency } from "../services/currency-service.js";

let modalStack = [];

export function showModal({ title, message = "", type = "confirm", content = "", confirmText = "", confirmClass = "", preselectedType = "", prefill = {}, currentFilters = {}, availableCategories = [], onConfirm, onCancel, onOpen, isSubModal = false }) {
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
  
  if (content) {
    formContent = content;
  } else if (type === "contribute") {
    const allGoals = window.goals || [];
    const activeGoals = allGoals.filter(g => {
      const current = parseFloat(g.currentAmount) || 0;
      const target = parseFloat(g.targetAmount) || 0;
      return current < target;
    });
    const goalsWithBalance = allGoals.filter(g => (parseFloat(g.currentAmount) || 0) > 0);
    
    const activeGoalsOptions = activeGoals
      .map(g => `<option value="${g.id}">${g.title} (${g.currentAmount || 0} / ${g.targetAmount})</option>`)
      .join('');
    
    const withdrawGoalsOptions = goalsWithBalance
      .map(g => `<option value="${g.id}">${g.title} (${g.currentAmount || 0} available)</option>`)
      .join('');
    
    formContent = `
      <label><span data-i18n="goal.operation_type">Operation Type</span></label>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button type="button" id="contrib-type-add" class="btn contrib-type-btn active" style="flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; background: var(--accent-primary, #7c3aed); color: white; border: 2px solid var(--accent-primary, #7c3aed);">
          ➕ <span data-i18n="goal.contribution">Contribution</span>
        </button>
        <button type="button" id="contrib-type-withdraw" class="btn contrib-type-btn" style="flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; background: transparent; color: var(--text-primary, #333); border: 2px solid #e6e6ee;">
          ➖ <span data-i18n="goal.withdrawal">Withdrawal</span>
        </button>
      </div>
      <input type="hidden" id="contrib-operation" value="add" />
      
      <label for="contrib-goal"><span data-i18n="goal.select_goal">Select Goal</span></label>
      <select id="contrib-goal" required>
        <option value="" data-i18n="goal.choose_goal">Choose a goal...</option>
        ${activeGoalsOptions}
      </select>
      <div id="contrib-goals-data" style="display: none;" data-active='${JSON.stringify(activeGoals.map(g => ({id: g.id, title: g.title, current: g.currentAmount, target: g.targetAmount})))}' data-withdraw='${JSON.stringify(goalsWithBalance.map(g => ({id: g.id, title: g.title, current: g.currentAmount})))}'></div>
      
      <label for="contrib-amount"><span data-i18n="goal.amount">Amount</span></label>
      <input type="number" id="contrib-amount" step="0.01" min="0.01" placeholder="0.00" required />
      <small id="contrib-help" style="color: var(--text-secondary, #666); font-size: 12px; display: block; margin-top: 4px;" data-i18n="goal.contribution_help">
        Enter the amount to add to your goal
      </small>
      
      <label for="contrib-note"><span data-i18n="goal.note">Note (Optional)</span></label>
      <input type="text" id="contrib-note" placeholder="e.g., Monthly savings, Bonus" />
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
      
      <div id="account-container">
        <label for="exp-account">Account</label>
        <select id="exp-account" style="width: 100%;" required>
          <option value="">Select account...</option>
        </select>
        <small style="color: var(--text-secondary, #666); font-size: 12px; display: block; margin-top: 4px;">
          Select the account for this transaction
        </small>
      </div>
      
      <label for="exp-amount">Amount</label>
      <div style="display: flex; gap: 8px; align-items: stretch;">
        <input type="text" id="exp-amount" inputmode="decimal" placeholder="0.00" required style="flex: 1;" />
        <select id="exp-currency" style="width: 90px; flex-shrink: 0;">
          <option value="EUR">€ EUR</option>
          <option value="USD">$ USD</option>
          <option value="BRL">R$ BRL</option>
          <option value="GBP">£ GBP</option>
        </select>
      </div>
      <div id="currency-conversion-preview" style="display: none; margin-top: 6px; padding: 8px 12px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px; font-size: 13px; color: var(--text-secondary, #666);">
        <span id="conversion-text"></span>
      </div>
      <div id="amount-error" style="display: none; color: #e53935; font-size: 12px; margin-top: 4px;"></div>
      
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
      <label for="goal-title"><span data-i18n="goal.title">Goal Title</span></label>
      <input type="text" id="goal-title" placeholder="e.g., New Car" required />
      
      <label for="goal-target"><span data-i18n="goal.target_amount">Target Amount</span></label>
      <input type="number" id="goal-target" step="0.01" min="0" placeholder="0.00" required />
      
      <label for="goal-date"><span data-i18n="goal.due_date">Due Date</span></label>
      <input type="date" id="goal-date" required />
      
      <label for="goal-monthly"><span data-i18n="goal.monthly_contribution">Monthly Contribution (Optional)</span></label>
      <input type="number" id="goal-monthly" step="0.01" min="0" placeholder="0.00" />
      <small style="color: var(--text-secondary, #666); font-size: 12px; display: block; margin-top: 4px;" data-i18n="goal.monthly_help">
        How much do you plan to save per month?
      </small>
      
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
        <input type="checkbox" id="goal-priority" style="width: auto; margin: 0;" />
        <label for="goal-priority" style="margin: 0; font-weight: normal;" data-i18n="goal.mark_priority">⭐ Mark as priority goal</label>
      </div>
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
  } else if (type === "filters") {
    const selectedType = currentFilters?.type || 'all';
    const selectedCategory = currentFilters?.category || 'all';
    const showRecurring = currentFilters?.showRecurring !== false;
    
    let categoryOptions = '';
    if (availableCategories instanceof Map) {
      categoryOptions = Array.from(availableCategories.entries()).map(([id, displayName]) => 
        `<option value="${id}" ${selectedCategory === id ? 'selected' : ''}>${displayName}</option>`
      ).join('');
    } else if (Array.isArray(availableCategories)) {
      categoryOptions = availableCategories.map(cat => 
        `<option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>${cat}</option>`
      ).join('');
    }
    
    formContent = `
      <label for="filter-type"><span data-i18n="filter.type">Transaction Type</span></label>
      <select id="filter-type">
        <option value="all" ${selectedType === 'all' ? 'selected' : ''} data-i18n="filter.all_types">All Types</option>
        <option value="income" ${selectedType === 'income' ? 'selected' : ''} data-i18n="filter.income_only">Income Only</option>
        <option value="expense" ${selectedType === 'expense' ? 'selected' : ''} data-i18n="filter.expenses_only">Expenses Only</option>
      </select>
      
      <label for="filter-category"><span data-i18n="filter.category">Category</span></label>
      <select id="filter-category">
        <option value="all" ${selectedCategory === 'all' ? 'selected' : ''} data-i18n="filter.all_categories">All Categories</option>
        ${categoryOptions}
      </select>
      
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
        <input type="checkbox" id="filter-recurring" ${showRecurring ? 'checked' : ''} style="width: auto; margin: 0;" />
        <label for="filter-recurring" style="margin: 0; font-weight: normal;" data-i18n="filter.show_recurring">Show Recurring Transactions</label>
      </div>
    `;
  } else {
    formContent = `<p>${message}</p>`;
  }

  const confirmBtnText = confirmText || (type === "confirm" ? "OK" : "Save");
  const confirmBtnClass = confirmClass ? `btn ${confirmClass}` : "btn";
  
  modal.innerHTML = `
    <div class="modal-box">
      <h2>${title}</h2>
      <div class="form">
        ${formContent}
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
        <button class="${confirmBtnClass} modal-confirm-btn">${confirmBtnText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add("show"), 10);
  
  if (onOpen && typeof onOpen === 'function') {
    onOpen(modalInstance);
  }

  const typeSelect = !isSubModal ? modal.querySelector("#exp-type") : null;
  const categorySelect = !isSubModal ? modal.querySelector("#exp-category") : null;
  const paymentMethodSelect = !isSubModal ? modal.querySelector("#exp-payment-method") : null;
  const paymentMethodContainer = !isSubModal ? modal.querySelector("#payment-method-container") : null;
  const accountSelect = !isSubModal ? modal.querySelector("#exp-account") : null;
  const recurringCheckbox = !isSubModal ? modal.querySelector("#exp-recurring") : null;
  const recurringOptions = !isSubModal ? modal.querySelector("#recurring-options") : null;

  const populateAccounts = async () => {
    if (!accountSelect) return;
    
    accountSelect.innerHTML = '<option value="">Select account...</option>';
    
    if (auth.currentUser) {
      try {
        const { getUserAccounts, ACCOUNT_ICONS } = await import("../services/accounts-service.js");
        const accounts = await getUserAccounts(auth.currentUser.uid);
        
        if (accounts.length > 0) {
          accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.id;
            const icon = account.icon || ACCOUNT_ICONS[account.type] || '🏦';
            const balance = Number(account.currentBalance || 0).toFixed(2);
            option.textContent = `${icon} ${account.name}${account.bank ? ` (${account.bank})` : ''} - ${balance}`;
            accountSelect.appendChild(option);
          });
        }
      } catch (error) {
        console.error("Error loading accounts:", error);
      }
    }
  };

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
      populateAccounts();
      updatePaymentMethodVisibility();
    }, 50);
  }
  
  const contribTypeAddBtn = modal.querySelector("#contrib-type-add");
  const contribTypeWithdrawBtn = modal.querySelector("#contrib-type-withdraw");
  const contribOperationInput = modal.querySelector("#contrib-operation");
  const contribGoalSelect = modal.querySelector("#contrib-goal");
  const contribHelpText = modal.querySelector("#contrib-help");
  const contribNoteInput = modal.querySelector("#contrib-note");
  const contribGoalsData = modal.querySelector("#contrib-goals-data");
  
  if (contribTypeAddBtn && contribTypeWithdrawBtn) {
    const updateContribUI = (isWithdrawal) => {
      if (isWithdrawal) {
        contribTypeAddBtn.style.background = "transparent";
        contribTypeAddBtn.style.color = "var(--text-primary, #333)";
        contribTypeAddBtn.style.borderColor = "#e6e6ee";
        contribTypeWithdrawBtn.style.background = "#ef4444";
        contribTypeWithdrawBtn.style.color = "white";
        contribTypeWithdrawBtn.style.borderColor = "#ef4444";
        contribOperationInput.value = "withdraw";
        if (contribHelpText) {
          contribHelpText.textContent = "Enter the amount to withdraw from your goal";
          contribHelpText.setAttribute("data-i18n", "goal.withdrawal_help");
        }
        if (contribNoteInput) {
          contribNoteInput.placeholder = "e.g., Emergency expense, Medical bills";
        }
        
        if (contribGoalsData && contribGoalSelect) {
          const withdrawGoals = JSON.parse(contribGoalsData.dataset.withdraw || "[]");
          contribGoalSelect.innerHTML = '<option value="">Choose a goal...</option>';
          withdrawGoals.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g.id;
            opt.textContent = `${g.title} (${g.current} available)`;
            contribGoalSelect.appendChild(opt);
          });
        }
      } else {
        contribTypeWithdrawBtn.style.background = "transparent";
        contribTypeWithdrawBtn.style.color = "var(--text-primary, #333)";
        contribTypeWithdrawBtn.style.borderColor = "#e6e6ee";
        contribTypeAddBtn.style.background = "var(--accent-primary, #7c3aed)";
        contribTypeAddBtn.style.color = "white";
        contribTypeAddBtn.style.borderColor = "var(--accent-primary, #7c3aed)";
        contribOperationInput.value = "add";
        if (contribHelpText) {
          contribHelpText.textContent = "Enter the amount to add to your goal";
          contribHelpText.setAttribute("data-i18n", "goal.contribution_help");
        }
        if (contribNoteInput) {
          contribNoteInput.placeholder = "e.g., Monthly savings, Bonus";
        }
        
        if (contribGoalsData && contribGoalSelect) {
          const activeGoals = JSON.parse(contribGoalsData.dataset.active || "[]");
          contribGoalSelect.innerHTML = '<option value="">Choose a goal...</option>';
          activeGoals.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g.id;
            opt.textContent = `${g.title} (${g.current || 0} / ${g.target})`;
            contribGoalSelect.appendChild(opt);
          });
        }
      }
    };
    
    contribTypeAddBtn.addEventListener("click", () => updateContribUI(false));
    contribTypeWithdrawBtn.addEventListener("click", () => updateContribUI(true));
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

  const amountInput = modal.querySelector("#exp-amount");
  const currencySelect = modal.querySelector("#exp-currency");
  const conversionPreview = modal.querySelector("#currency-conversion-preview");
  const conversionText = modal.querySelector("#conversion-text");
  const amountError = modal.querySelector("#amount-error");
  
  if (amountInput && currencySelect) {
    const userCurrency = userPreferencesService?.currentPreferences?.currency || getBaseCurrency();
    if (currencySelect.querySelector(`option[value="${userCurrency}"]`)) {
      currencySelect.value = userCurrency;
    }
    
    let conversionTimeout = null;
    
    const updateConversionPreview = async () => {
      const rawValue = amountInput.value;
      const currency = currencySelect.value;
      const baseCurrency = getBaseCurrency();
      
      if (!rawValue || currency === baseCurrency) {
        if (conversionPreview) conversionPreview.style.display = "none";
        return;
      }
      
      const validation = validateAmount(rawValue);
      if (!validation.valid) {
        if (conversionPreview) conversionPreview.style.display = "none";
        return;
      }
      
      try {
        const result = await convertToBaseCurrency(validation.value, currency);
        if (conversionPreview && conversionText) {
          conversionText.textContent = `💱 ≈ ${formatCurrency(result.convertedAmount, baseCurrency)} (rate: ${result.exchangeRate.toFixed(4)})`;
          conversionPreview.style.display = "block";
        }
      } catch (error) {
        console.error("Conversion error:", error);
        if (conversionPreview) conversionPreview.style.display = "none";
      }
    };
    
    const validateAndPreview = () => {
      const rawValue = amountInput.value;
      
      if (!rawValue) {
        if (amountError) amountError.style.display = "none";
        if (conversionPreview) conversionPreview.style.display = "none";
        amountInput.style.borderColor = "";
        return;
      }
      
      const validation = validateAmount(rawValue);
      
      if (!validation.valid) {
        if (amountError) {
          amountError.textContent = validation.error;
          amountError.style.display = "block";
        }
        amountInput.style.borderColor = "#e53935";
        if (conversionPreview) conversionPreview.style.display = "none";
      } else {
        if (amountError) amountError.style.display = "none";
        amountInput.style.borderColor = "#4caf50";
        
        if (conversionTimeout) clearTimeout(conversionTimeout);
        conversionTimeout = setTimeout(updateConversionPreview, 300);
      }
    };
    
    amountInput.addEventListener("input", validateAndPreview);
    currencySelect.addEventListener("change", () => {
      if (amountInput.value) {
        validateAndPreview();
      }
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
        if (field.type === 'checkbox') {
          field.checked = !!prefill[selector];
        } else {
          field.value = prefill[selector];
        }
      }
    });
  }, 0);

  return modalInstance;
}

// ---------------------------------------------------------
// Daily Reminder + Pay Expense + Goal Contribution helpers
// ---------------------------------------------------------

/**
 * Simple currency formatter used inside reminder modals.
 */
function _drFormatCurrency(amount, symbol = "€") {
  const num = Number(amount) || 0;
  return `${symbol} ${num
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Greeting based on current hour.
 */
function _drGetGreeting(name = "there") {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}!`;
  if (h < 18) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
}

/**
 * LocalStorage keys used by the daily reminder system.
 */
const DR_STORAGE_KEYS = {
  LAST_SHOWN: "dailyReminderLastShown",           // 'YYYY-MM-DD'
  REMIND_UNTIL: "dailyReminderRemindUntil",       // timestamp (ms)
  DISMISSED_EXPENSES: "dailyReminderDismissedExpenses" // { day: 'YYYY-MM-DD', ids: [] }
};

function _drTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Has the reminder already been shown today?
 */
function _drIsShownToday() {
  try {
    const last = localStorage.getItem(DR_STORAGE_KEYS.LAST_SHOWN);
    return last === _drTodayKey();
  } catch (e) {
    return false;
  }
}

/**
 * Mark reminder as shown today.
 */
function _drSetShownToday() {
  try {
    localStorage.setItem(DR_STORAGE_KEYS.LAST_SHOWN, _drTodayKey());
  } catch (e) {
    console.warn("dailyReminder: could not persist LAST_SHOWN", e);
  }
}

/**
 * Set a "do not remind until" timestamp in ms.
 */
function _drSetRemindUntil(timestampMs) {
  try {
    localStorage.setItem(
      DR_STORAGE_KEYS.REMIND_UNTIL,
      String(timestampMs)
    );
  } catch (e) {
    console.warn("dailyReminder: could not persist REMIND_UNTIL", e);
  }
}

function _drGetRemindUntil() {
  try {
    const v = localStorage.getItem(DR_STORAGE_KEYS.REMIND_UNTIL);
    return v ? Number(v) : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Store dismissed expense ids for *today* only.
 */
function _drAddDismissedExpenseIds(ids = []) {
  if (!ids || ids.length === 0) return;

  try {
    const today = _drTodayKey();
    const raw = localStorage.getItem(DR_STORAGE_KEYS.DISMISSED_EXPENSES);
    let data = { day: today, ids: [] };

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.day === today && Array.isArray(parsed.ids)) {
        data = parsed;
      }
    }

    const merged = Array.from(new Set([...(data.ids || []), ...ids]));
    const toStore = { day: today, ids: merged };
    localStorage.setItem(
      DR_STORAGE_KEYS.DISMISSED_EXPENSES,
      JSON.stringify(toStore)
    );
  } catch (e) {
    console.error("Failed to store dismissed expense ids", e);
  }
}

function _drGetDismissedExpenseIdsForToday() {
  try {
    const raw = localStorage.getItem(DR_STORAGE_KEYS.DISMISSED_EXPENSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.day !== _drTodayKey()) return [];
    return Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch (e) {
    return [];
  }
}

/**
 * MAIN: Show Daily Reminder modal.
 *
 * options: {
 *   goals: Array,
 *   expenses: Array,
 *   name: string,
 *   currencySymbol: string
 * }
 */
export function showDailyReminderModal(options = {}) {
  const {
    goals = [],
    expenses = [],
    name = "there",
    currencySymbol = "€"
  } = options;

  // Respect "remind later" window
  const now = Date.now();
  const remindUntil = _drGetRemindUntil();
  if (remindUntil && remindUntil > now) {
    return;
  }

  // Respect "already shown today"
  if (_drIsShownToday()) {
    return;
  }

  // Filter out expenses the user dismissed *today*
  const dismissedIds = _drGetDismissedExpenseIdsForToday();
  const visibleExpenses = expenses.filter(
    (e) => !dismissedIds.includes(e.id)
  );

  // Simple slicing to avoid a huge modal
  const upcomingGoals = (goals || []).slice(0, 5);
  const upcomingExpenses = (visibleExpenses || []).slice(0, 5);

  // If there is literally nothing to show, não incomoda a usuária 😄
  if (upcomingGoals.length === 0 && upcomingExpenses.length === 0) {
    return;
  }

  // Remove any previous instance
  const existing = document.getElementById("daily-reminder-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "daily-reminder-modal";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:720px; background: var(--card-bg, #ffffff); padding: 20px;">
      <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2 style="margin:0 12px 0 0;">🌅 ${_drGetGreeting(
          name
        )}</h2>
        <div style="font-size:0.95rem; color:#666;">Here are your reminders for today</div>
      </header>

      <div style="display:flex; gap:12px; margin-bottom:12px;">
        <div style="flex:1; padding:10px; background:rgba(0,0,0,0.03); border-radius:6px;">
          <strong>GOALS (${upcomingGoals.length})</strong>
        </div>
        <div style="flex:1; padding:10px; background:rgba(0,0,0,0.03); border-radius:6px;">
          <strong>EXPENSES (${upcomingExpenses.length})</strong>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px; max-height:420px; overflow:auto; padding-bottom:8px;">
        <div>
          <h3 style="margin:6px 0;">GOALS</h3>
          ${
            upcomingGoals.length === 0
              ? `<p style="font-size:0.9rem; color:#777;">No goals to remind today.</p>`
              : upcomingGoals
                  .map((g) => {
                    const current = Number(g.currentAmount) || 0;
                    const target = Number(g.targetAmount) || 0;
                    const missing = Math.max(0, target - current);
                    let due = "";
                    if (g.dueDate) {
                      const d =
                        typeof g.dueDate === "string"
                          ? new Date(g.dueDate)
                          : g.dueDate.toDate
                          ? g.dueDate.toDate()
                          : new Date(g.dueDate);
                      due = d.toLocaleDateString();
                    }

                    return `
                      <div class="reminder-item" data-goal-id="${
                        g.id
                      }" style="padding:10px; border-left:4px solid #6c21e4; margin-bottom:10px; border-radius:4px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                          <div style="min-width:0;">
                            <div>🎯 <strong>${
                              g.title || "Untitled Goal"
                            }</strong></div>
                            <div style="font-size:0.9rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                              Missing: ${_drFormatCurrency(
                                missing,
                                currencySymbol
                              )}${
                      due ? ` · Deadline: ${due}` : ""
                    }
                            </div>
                          </div>
                          <div style="flex-shrink:0;">
                            <button class="btn-small contribute-action" data-goal-id="${
                              g.id
                            }">Contribute</button>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
          }
        </div>

        <div>
          <h3 style="margin:6px 0;">EXPENSES</h3>
          ${
            upcomingExpenses.length === 0
              ? `<p style="font-size:0.9rem; color:#777;">No expenses to remind today.</p>`
              : upcomingExpenses
                  .map((e) => {
                    const rawDate = e.nextBilling || e.date || e.createdAt;
                    let dateStr = "";
                    if (rawDate) {
                      const d =
                        rawDate.toDate?.() instanceof Date
                          ? rawDate.toDate()
                          : new Date(rawDate);
                      dateStr = d.toLocaleDateString();
                    }
                    const title = e.title || e.category || "Expense";
                    const amt = e.amount ?? e.originalAmount ?? 0;

                    return `
                      <div class="reminder-item" data-expense-id="${
                        e.id
                      }" style="padding:10px; border-left:4px solid #f39c12; margin-bottom:10px; border-radius:4px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                          <div style="min-width:0;">
                            <div>💸 <strong>${title}</strong></div>
                            <div style="font-size:0.9rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                              ${_drFormatCurrency(
                                amt,
                                currencySymbol
                              )} — ${dateStr}
                            </div>
                          </div>
                          <div style="flex-shrink:0;">
                            <button class="btn-small pay-action" data-expense-id="${
                              e.id
                            }">Pay Now</button>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
          }
        </div>
      </div>

      <footer style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
        <div>
          <select id="daily-remind-select" style="padding:8px; border-radius:6px; cursor: pointer;">
            <option value="">Remind me later</option>
            <option value="1h">Remind me in 1 hour</option>
            <option value="tomorrow">Remind me tomorrow</option>
            <option value="dismiss-paid">Dismiss paid expenses</option>
          </select>
        </div>

        <div style="display:flex; gap:8px;">
          <button id="daily-reminder-close" class="btn">Close</button>
        </div>
      </footer>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add("show"), 10);

  const close = () => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 220);
  };

  // Close → marca como visto hoje, lembra só amanhã
  const closeAndMarkToday = () => {
    _drSetShownToday();
    showAlert("Okay — we'll remind you tomorrow 👍");
    close();
  };

  overlay
    .querySelector("#daily-reminder-close")
    ?.addEventListener("click", closeAndMarkToday);

  // Dropdown "Remind me later"
  overlay
    .querySelector("#daily-remind-select")
    ?.addEventListener("change", (ev) => {
      const val = ev.target.value;
      if (!val) return;

      if (val === "1h") {
        const until = Date.now() + 60 * 60 * 1000;
        _drSetRemindUntil(until);
        showAlert("We'll remind you in 1 hour 👍");
        close();
        return;
      }

      if (val === "tomorrow") {
        _drSetShownToday();
        showAlert("We'll remind you tomorrow 👍");
        close();
        return;
      }

      if (val === "dismiss-paid") {
        const paidIds = (upcomingExpenses || [])
          .filter((e) => e.paid === true || e.isPaid === true)
          .map((e) => e.id);
        _drAddDismissedExpenseIds(paidIds);
        showAlert("Dismissed paid expenses for today 👍");
        close();
        return;
      }
    });

  // Delegação dos botões Pay / Contribute
  overlay.addEventListener("click", (ev) => {
    const payBtn = ev.target.closest?.(".pay-action");
    if (payBtn) {
      const expenseId = payBtn.getAttribute("data-expense-id");
      const expense = upcomingExpenses.find(
        (x) => String(x.id) === String(expenseId)
      );
      if (expense) {
        showPayExpenseModal(expense, { currencySymbol });
      }
      return;
    }

    const contribBtn = ev.target.closest?.(".contribute-action");
    if (contribBtn) {
      const goalId = contribBtn.getAttribute("data-goal-id");
      const goal = upcomingGoals.find(
        (x) => String(x.id) === String(goalId)
      );
      if (goal) {
        showGoalContributionModal(goal, { currencySymbol });
      }
    }
  });

  // Clicar fora também fecha (e marca como visto hoje)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeAndMarkToday();
    }
  });
}

/**
 * Simple Pay Expense modal.
 * It does NOT use showModal() para evitar acoplamento com tipos extras.
 */
export function showPayExpenseModal(expense = {}, opts = {}) {
  const currencySymbol = opts.currencySymbol || "€";
  const id = "pay-expense-modal";
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.className = "modal-overlay";

  const rawNext = expense.nextBilling || expense.date || expense.createdAt;
  let nextStr = "—";
  if (rawNext) {
    const d =
      rawNext?.toDate && typeof rawNext.toDate === "function"
        ? rawNext.toDate()
        : new Date(rawNext);
    nextStr = d.toLocaleDateString();
  }

  const title = expense.title || expense.category || "Expense";
  const amount = expense.amount ?? expense.originalAmount ?? 0;

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;">
      <h3>💸 Pay Expense</h3>
      <div style="margin-top:8px;">
        <div><strong>Expense:</strong> ${title}</div>
        <div><strong>Next Billing:</strong> ${nextStr}</div>
        <div><strong>Amount Due:</strong> ${_drFormatCurrency(
          amount,
          currencySymbol
        )}</div>
      </div>

      <div style="margin-top:12px;">
        <label>Select account</label>
        <select id="pay-exp-account" style="width:100%; padding:8px; margin-top:6px;">
          <option value="">Choose an account</option>
          ${
            (window.accounts || [])
              .map(
                (a) =>
                  `<option value="${a.id}">${a.name} (${_drFormatCurrency(
                    a.currentBalance ?? a.balance ?? 0,
                    currencySymbol
                  )})</option>`
              )
              .join("") || ""
          }
        </select>
      </div>

      <div style="margin-top:12px;">
        <label>Payment amount</label>
        <input id="pay-exp-amount" type="number" value="${amount ||
          ""}" style="width:100%; padding:8px; margin-top:6px;" />
      </div>

      <div style="margin-top:12px;">
        <label>Notes (optional)</label>
        <textarea id="pay-exp-notes" style="width:100%; padding:8px; margin-top:6px;"></textarea>
      </div>

      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
        <button id="pay-exp-cancel" class="btn">Cancel</button>
        <button id="pay-exp-confirm" class="btn-primary">Pay</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add("show"), 10);

  const close = () => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 220);
  };

  overlay
    .querySelector("#pay-exp-cancel")
    ?.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay
    .querySelector("#pay-exp-confirm")
    ?.addEventListener("click", async () => {
      const accountId =
        overlay.querySelector("#pay-exp-account")?.value || "";
      const amountValue = Number(
        overlay.querySelector("#pay-exp-amount")?.value || 0
      );
      const notes =
        overlay.querySelector("#pay-exp-notes")?.value?.trim() || "";

      if (!accountId || !amountValue) {
        showAlert("Please fill account and amount fields.", "error");
        return;
      }

      try {
        // TODO: integrate with real payment logic when available
        // e.g. await payExpense(expense.id, { accountId, amount: amountValue, notes });

        _drAddDismissedExpenseIds([expense.id]);
        showAlert("Payment successful!", "success");
        close();
      } catch (err) {
        console.error(err);
        showAlert("Payment failed.", "error");
      }
    });
}

/**
 * Open contribution modal focused on a specific goal.
 * Reuses the existing `type: "contribute"` flow from showModal().
 */
export function showGoalContributionModal(goal = {}, opts = {}) {
  const currencySymbol = opts.currencySymbol || "€";

  showModal({
    title: "Contribute to Goal",
    type: "contribute",
    prefill: {
      "#contrib-goal": goal.id || "",
      "#contrib-amount": "",
      "#contrib-note": ""
    },
    onConfirm: async (modalInstance) => {
      try {
        const goalEl = modalInstance.getField("#contrib-goal");
        const amountEl = modalInstance.getField("#contrib-amount");
        const noteEl = modalInstance.getField("#contrib-note");

        if (!goalEl.value || !amountEl.value) {
          showAlert("Fill all fields.", "error");
          return false;
        }

        const rawAmount = Number(amountEl.value) || 0;
        if (rawAmount <= 0) {
          showAlert("Amount must be greater than zero.", "error");
          return false;
        }

        // Aqui você pluga o addContribution real, se quiser:
        // const result = await addContribution(goalEl.value, rawAmount, noteEl.value);
        // e depois atualiza analytics/dashboard.

        showAlert("Contribution added!", "success");
        return true;
      } catch (err) {
        console.error(err);
        showAlert("Failed to add contribution.", "error");
        return false;
      }
    }
  });
}
