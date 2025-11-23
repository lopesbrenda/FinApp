// Alert/Toast notification system

export function showAlert(message, type = "info") {
  // Remove existing alerts
  const existingAlert = document.querySelector(".alert-toast");
  if (existingAlert) existingAlert.remove();

  const alertBox = document.createElement("div");
  alertBox.className = `alert-toast alert-${type}`;
  alertBox.textContent = message;
  
  // Style based on type
  const colors = {
    info: "#3498db",
    success: "#2ecc71",
    error: "#e74c3c",
    warning: "#f39c12"
  };
  
  alertBox.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 15px;
    font-weight: 500;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(alertBox);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    alertBox.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => alertBox.remove(), 300);
  }, 4000);
}

// Add animations
if (!document.getElementById('alert-animations')) {
  const style = document.createElement('style');
  style.id = 'alert-animations';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
