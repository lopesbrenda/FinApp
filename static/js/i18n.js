// Internationalization system for FinLife

const translations = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.logout': 'Logout',
    
    // Home page
    'home.title': 'Welcome to FinLife 💜',
    'home.subtitle': 'Manage your personal finances smartly and efficiently.',
    'home.dashboard.title': '📊 Dashboard',
    'home.dashboard.desc': 'Visualize your finances in real-time',
    'home.profile.title': '👤 Profile',
    'home.profile.desc': 'Manage your personal information',
    'home.settings.title': '⚙️ Settings',
    'home.settings.desc': 'Customize your experience',
    'home.features.title': 'Main Features',
    'home.features.1': '💰 Expense and income tracking',
    'home.features.2': '📈 Detailed charts and reports',
    'home.features.3': '🎯 Financial goal setting',
    'home.features.4': '🔔 Custom alerts and notifications',
    'home.features.5': '💱 Multi-currency support',
    'btn.access': 'Access',
    
    // Dashboard
    'dashboard.title': '📊 Financial Dashboard',
    'dashboard.subtitle': 'Overview of your finances',
    'dashboard.welcome': 'Welcome',
    'dashboard.balance': '💰 Total Balance',
    'dashboard.expenses': '📉 Expenses',
    'dashboard.income': '📈 Income',
    'dashboard.goals': '🎯 Goals',
    'dashboard.transactions': 'Recent Transactions',
    'dashboard.addIncome': '+ Income',
    'dashboard.addExpense': '+ Expense',
    'dashboard.addGoal': '+ Goal',
    'dashboard.contributeGoal':'💰 Contribute',
    'dashboard.noTransactions': 'No transactions yet. Click + Income or + Expense to start!',
    'dashboard.myGoals': 'My Goals',
    'dashboard.noGoals': 'No goals yet. Click + Goal to create one!',
    'dashboard.month': 'this month',
    'dashboard.transaction.grocery': 'Grocery Store',
    'dashboard.transaction.salary': 'Salary',
    'dashboard.transaction.rent': 'Rent',
    
    // Profile
    'profile.title': '👤 Profile Details',
    'profile.edit': '✏️ Edit Information',
    'profile.fullname': 'Full name',
    'profile.phone': 'Phone',
    'profile.email': 'Email',
    'profile.save': 'Save',
    'profile.since': 'Since:',
    
    // Settings
    'settings.title': '⚙️ Settings',
    'settings.general': '💼 General',
    'settings.currency': 'Default Currency',
    'settings.language': 'Language',
    'settings.notifications': '🔔 Notifications',
    'settings.alerts.expenses': 'Expense Alerts',
    'settings.alerts.goals': 'Goal Alerts',
    'settings.alerts.email': 'Email Notifications',
    'settings.privacy': '🔒 Privacy',
    'settings.twofa': 'Two-Factor Authentication',
    'settings.twofa.soon': '(Coming soon)',
    'settings.save': 'Save Settings',
    
    // Password
    'password.title': '🔒 Change Password',
    'password.new': 'New password',
    'password.confirm': 'Confirm new password',
    'password.change': 'Change Password',
    
    // Login
    'login.title': '🔐 Login',
    'login.subtitle': 'Sign in to your FinLife account',
    'login.email.placeholder': 'Email',
    'login.password.placeholder': 'Password',
    'login.submit': 'Sign In',
    'login.forgot': 'Forgot password?',
    'login.noaccount': "Don't have an account?",
    'login.signup': 'Sign up',
    
    // Signup
    'signup.title': '✨ Create Account',
    'signup.subtitle': 'Start managing your finances today',
    'signup.name.placeholder': 'Full name',
    'signup.email.placeholder': 'Email',
    'signup.password.placeholder': 'Password',
    'signup.confirm.placeholder': 'Confirm password',
    'signup.submit': 'Create Account',
    'signup.hasaccount': 'Already have an account?',
    'signup.login': 'Sign in',
    
    // Modal
    'modal.crop.title': 'Crop Image',
    'modal.crop.use': 'Use Image',
    'modal.crop.cancel': 'Cancel',
    
    // Forgot Password
    'forgot.title': 'Reset Password',
    'forgot.description': "Enter your email address and we'll send you a link to reset your password.",
    'forgot.email.label': 'Email Address',
    'forgot.cancel': 'Cancel',
    'forgot.send': 'Send Reset Link',
    
    // Sidebar
    'sidebar.profile': 'Profile',
    'sidebar.settings': 'Settings',
    'sidebar.password': 'Password',
    
    // Goal Completion
    'goal_completed_title': 'Goal Completed!',
    'goal_completed_subtitle': 'Congratulations! You\'ve reached your goal.',
    'what_would_you_like': 'What would you like to do?',
    'archive_goal': 'Archive Goal',
    'restart_goal': 'Restart Goal',
    'keep_visible': 'Keep Visible',
    'goal_name': 'Goal',
    'target_amount': 'Target',
    'time_to_complete': 'Time to complete',
    'day': 'day',
    'days': 'days',
    'close': 'Close',
    'goal_archived_success': 'Goal archived successfully!',
    'goal_archived_error': 'Error archiving goal. Please try again.',
    'goal_restarted_success': 'Goal restarted successfully!',
    'goal_restarted_error': 'Error restarting goal. Please try again.',
    'active_goals': 'Active Goals',
    'completed_goals': 'Completed Goals',
    'archived_goals': 'Archived Goals',
    'no_completed_goals': 'No completed goals yet. Complete your first goal to see it here!',
    'no_archived_goals': 'No archived goals yet. Archive a completed goal to see it here!',
    'completed_on': 'Completed on',
    'unarchive': 'Unarchive',
    'mark_as_achieved': 'Mark as Achieved',
    'edit_goal': 'Edit Goal',
    
    // Filters
    'filter.current_month': 'This Month',
    'filter.last_month': 'Last Month',
    'filter.last_3_months': 'Last 3 Months',
    'filter.current_year': 'This Year',
    'filter.all': 'All Time',
    'filter.filters': 'Filters',
    'advanced_filters': 'Advanced Filters',
    'filter.type': 'Transaction Type',
    'filter.all_types': 'All Types',
    'filter.income_only': 'Income Only',
    'filter.expenses_only': 'Expenses Only',
    'filter.category': 'Category',
    'filter.all_categories': 'All Categories',
    'filter.show_recurring': 'Show Recurring Transactions',
    'filter.apply': 'Apply Filters',
    
    // Goal & Projections
    'goal.title': 'Goal Title',
    'goal.target_amount': 'Target Amount',
    'goal.due_date': 'Due Date',
    'goal.monthly_contribution': 'Monthly Contribution (Optional)',
    'goal.monthly_help': 'How much do you plan to save per month?',
    'goal.mark_priority': '⭐ Mark as priority goal',
    'goal.select_goal': 'Select Goal',
    'goal.choose_goal': 'Choose a goal...',
    'goal.amount': 'Amount',
    'goal.amount_help': 'Use positive for contribution, negative for withdrawal',
    'goal.note': 'Note (Optional)',
    'goal.operation_type': 'Operation Type',
    'goal.contribution': 'Contribution',
    'goal.withdrawal': 'Withdrawal',
    'goal.contribution_help': 'Enter the amount to add to your goal',
    'goal.withdrawal_help': 'Enter the amount to withdraw from your goal',
    
    // Projections
    'projection.estimated': 'Estimated',
    'projection.remaining': 'remaining',
    'projection.ahead_schedule': 'Ahead of schedule',
    'projection.behind_schedule': 'Behind schedule',
    'projection.on_track': 'On track',
    'projection.set_monthly': 'Set monthly contribution to see projection',
    
    // Time units
    'time.year': 'year',
    'time.years': 'years',
    'time.month': 'month',
    'time.months': 'months',
    'time.and': 'and'
  },
  pt: {
    // Navbar
    'nav.home': 'Início',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configurações',
    'nav.login': 'Entrar',
    'nav.signup': 'Cadastrar',
    'nav.logout': 'Sair',
    
    // Home page
    'home.title': 'Bem-vindo ao FinLife 💜',
    'home.subtitle': 'Gerencie suas finanças pessoais de forma inteligente e eficiente.',
    'home.dashboard.title': '📊 Dashboard',
    'home.dashboard.desc': 'Visualize suas finanças em tempo real',
    'home.profile.title': '👤 Perfil',
    'home.profile.desc': 'Gerencie suas informações pessoais',
    'home.settings.title': '⚙️ Configurações',
    'home.settings.desc': 'Personalize sua experiência',
    'home.features.title': 'Recursos Principais',
    'home.features.1': '💰 Controle de despesas e receitas',
    'home.features.2': '📈 Gráficos e relatórios detalhados',
    'home.features.3': '🎯 Definição de metas financeiras',
    'home.features.4': '🔔 Alertas e notificações personalizadas',
    'home.features.5': '💱 Suporte para múltiplas moedas',
    'btn.access': 'Acessar',
    
    // Dashboard
    'dashboard.title': '📊 Dashboard Financeiro',
    'dashboard.subtitle': 'Visão geral das suas finanças',
    'dashboard.welcome': 'Bem-vindo',
    'dashboard.balance': '💰 Saldo Total',
    'dashboard.expenses': '📉 Despesas',
    'dashboard.income': '📈 Receitas',
    'dashboard.goals': '🎯 Metas',
    'dashboard.transactions': 'Transações Recentes',
    'dashboard.addIncome': '+ Receita',
    'dashboard.addExpense': '+ Despesa',
    'dashboard.addGoal': '+ Meta',
    'dashboard.contributeGoal':'💰 Contribuir',
    'dashboard.noTransactions': 'Nenhuma transação ainda. Clique em + Receita ou + Despesa para começar!',
    'dashboard.myGoals': 'Minhas Metas',
    'dashboard.noGoals': 'Nenhuma meta ainda. Clique em + Meta para criar uma!',
    'dashboard.month': 'este mês',
    'dashboard.transaction.grocery': 'Supermercado',
    'dashboard.transaction.salary': 'Salário',
    'dashboard.transaction.rent': 'Aluguel',
    
    // Profile
    'profile.title': '👤 Detalhes do Perfil',
    'profile.edit': '✏️ Editar Informações',
    'profile.fullname': 'Nome completo',
    'profile.phone': 'Telefone',
    'profile.email': 'Email',
    'profile.save': 'Salvar',
    'profile.since': 'Desde:',
    
    // Settings
    'settings.title': '⚙️ Configurações',
    'settings.general': '💼 Geral',
    'settings.currency': 'Moeda Padrão',
    'settings.language': 'Idioma',
    'settings.notifications': '🔔 Notificações',
    'settings.alerts.expenses': 'Alertas de Despesas',
    'settings.alerts.goals': 'Alertas de Metas',
    'settings.alerts.email': 'Notificações por Email',
    'settings.privacy': '🔒 Privacidade',
    'settings.twofa': 'Autenticação de Dois Fatores',
    'settings.twofa.soon': '(Em breve)',
    'settings.save': 'Salvar Configurações',
    
    // Password
    'password.title': '🔒 Alterar Senha',
    'password.new': 'Nova senha',
    'password.confirm': 'Confirmar nova senha',
    'password.change': 'Alterar Senha',
    
    // Login
    'login.title': '🔐 Login',
    'login.subtitle': 'Entre na sua conta FinLife',
    'login.email.placeholder': 'Email',
    'login.password.placeholder': 'Senha',
    'login.submit': 'Entrar',
    'login.forgot': 'Esqueceu a senha?',
    'login.noaccount': 'Não tem uma conta?',
    'login.signup': 'Cadastre-se',
    
    // Signup
    'signup.title': '✨ Criar Conta',
    'signup.subtitle': 'Comece a gerenciar suas finanças hoje',
    'signup.name.placeholder': 'Nome completo',
    'signup.email.placeholder': 'Email',
    'signup.password.placeholder': 'Senha',
    'signup.confirm.placeholder': 'Confirmar senha',
    'signup.submit': 'Criar Conta',
    'signup.hasaccount': 'Já tem uma conta?',
    'signup.login': 'Faça login',
    
    // Modal
    'modal.crop.title': 'Cortar Imagem',
    'modal.crop.use': 'Usar Imagem',
    'modal.crop.cancel': 'Cancelar',
    
    // Forgot Password
    'forgot.title': 'Redefinir Senha',
    'forgot.description': 'Digite seu endereço de email e enviaremos um link para redefinir sua senha.',
    'forgot.email.label': 'Endereço de Email',
    'forgot.cancel': 'Cancelar',
    'forgot.send': 'Enviar Link',
    
    // Sidebar
    'sidebar.profile': 'Perfil',
    'sidebar.settings': 'Configurações',
    'sidebar.password': 'Senha',
    
    // Goal Completion
    'goal_completed_title': 'Meta Concluída!',
    'goal_completed_subtitle': 'Parabéns! Você atingiu sua meta.',
    'what_would_you_like': 'O que você gostaria de fazer?',
    'archive_goal': 'Arquivar Meta',
    'restart_goal': 'Recomeçar Meta',
    'keep_visible': 'Manter Visível',
    'goal_name': 'Meta',
    'target_amount': 'Valor',
    'time_to_complete': 'Tempo para completar',
    'day': 'dia',
    'days': 'dias',
    'close': 'Fechar',
    'goal_archived_success': 'Meta arquivada com sucesso!',
    'goal_archived_error': 'Erro ao arquivar meta. Tente novamente.',
    'goal_restarted_success': 'Meta reiniciada com sucesso!',
    'goal_restarted_error': 'Erro ao reiniciar meta. Tente novamente.',
    'active_goals': 'Metas Ativas',
    'completed_goals': 'Metas Concluídas',
    'archived_goals': 'Metas Arquivadas',
    'no_completed_goals': 'Nenhuma meta concluída ainda. Complete sua primeira meta para vê-la aqui!',
    'no_archived_goals': 'Nenhuma meta arquivada ainda. Arquive uma meta concluída para vê-la aqui!',
    'completed_on': 'Concluída em',
    'unarchive': 'Desarquivar',
    'mark_as_achieved': 'Marcar como Concluída',
    'edit_goal': 'Editar Meta',
    
    // Filters
    'filter.current_month': 'Este Mês',
    'filter.last_month': 'Mês Passado',
    'filter.last_3_months': 'Últimos 3 Meses',
    'filter.current_year': 'Este Ano',
    'filter.all': 'Todo Período',
    'filter.filters': 'Filtros',
    'advanced_filters': 'Filtros Avançados',
    'filter.type': 'Tipo de Transação',
    'filter.all_types': 'Todos os Tipos',
    'filter.income_only': 'Apenas Receitas',
    'filter.expenses_only': 'Apenas Despesas',
    'filter.category': 'Categoria',
    'filter.all_categories': 'Todas as Categorias',
    'filter.show_recurring': 'Mostrar Transações Recorrentes',
    'filter.apply': 'Aplicar Filtros',
    
    // Goal & Projections
    'goal.title': 'Título da Meta',
    'goal.target_amount': 'Valor Alvo',
    'goal.due_date': 'Data Limite',
    'goal.monthly_contribution': 'Contribuição Mensal (Opcional)',
    'goal.monthly_help': 'Quanto você planeja economizar por mês?',
    'goal.mark_priority': '⭐ Marcar como meta prioritária',
    'goal.select_goal': 'Selecione a Meta',
    'goal.choose_goal': 'Escolha uma meta...',
    'goal.amount': 'Valor',
    'goal.amount_help': 'Use positivo para contribuição, negativo para retirada',
    'goal.note': 'Nota (Opcional)',
    'goal.operation_type': 'Tipo de Operação',
    'goal.contribution': 'Contribuição',
    'goal.withdrawal': 'Retirada',
    'goal.contribution_help': 'Digite o valor para adicionar à sua meta',
    'goal.withdrawal_help': 'Digite o valor para retirar da sua meta',
    
    // Projections
    'projection.estimated': 'Previsão',
    'projection.remaining': 'restantes',
    'projection.ahead_schedule': 'Adiantado',
    'projection.behind_schedule': 'Atrasado',
    'projection.on_track': 'No caminho certo',
    'projection.set_monthly': 'Defina contribuição mensal para ver a projeção',
    
    // Time units
    'time.year': 'ano',
    'time.years': 'anos',
    'time.month': 'mês',
    'time.months': 'meses',
    'time.and': 'e'
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'en';
    this.init();
  }

  init() {
    this.applyLanguage();
    this.setupLanguageToggle();
  }

  t(key) {
    return translations[this.currentLang][key] || key;
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      this.applyLanguage();
    }
  }

  applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update language toggle button
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.textContent = this.currentLang === 'en' ? '🇧🇷 PT' : '🇺🇸 EN';
    }
  }

  setupLanguageToggle() {
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const newLang = this.currentLang === 'en' ? 'pt' : 'en';
        this.setLanguage(newLang);
      });
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Export for use in other modules
const i18n = new I18n();
export { i18n, I18n };
