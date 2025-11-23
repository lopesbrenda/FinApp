// Theme management system

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupThemeToggle();
  }

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  applyTheme() {
    if (this.currentTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Update theme toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
      themeBtn.setAttribute('aria-label', 
        this.currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Export for use in other modules
const themeManager = new ThemeManager();
export { themeManager, ThemeManager };
