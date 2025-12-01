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
    'home.quick_access': '🔥 Quick Access',
    'home.tap_enter': '👉 Tap anywhere to enter',
    'home.dashboard.title': '📊 Dashboard',
    'home.dashboard.desc': 'Real-time overview of your finances',
    'home.analytics.title': '📈 Analytics',
    'home.analytics.desc': 'Visualize your spending patterns',
    'home.profile.title': '👤 Profile',
    'home.profile.desc': 'Your profile and settings',
    'home.features.title': '✨ Main Features',
    'home.features.1': 'Track income & expenses',
    'home.features.2': 'Charts & monthly summaries',
    'home.features.3': 'Create and monitor financial goals',
    'home.features.4': 'Custom alert notifications',
    'home.features.5': 'Multi-currency support',
    'home.features.6': 'Recurring transactions',
    'home.cta.title': 'Ready to take control?',
    'home.cta.subtitle': 'Start managing your finances today!',
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
    'dashboard.this_month': 'This month',
    'dashboard.all_accounts': 'All accounts',
    'dashboard.bank_accounts': '💳 Bank Accounts',
    'dashboard.checking_savings': 'Checking & Savings',
    'dashboard.cash': '💵 Cash',
    'dashboard.cash_on_hand': 'Cash on hand',
    'dashboard.credit_debt': '💳 Credit Card Debt',
    'dashboard.outstanding': 'Outstanding balance',
    'dashboard.income_minus_expenses': 'Income - Expenses',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.view_details': '📊 View Detailed Analytics',
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
    'start_new_goal': 'Start New Goal',
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
    'time.and': 'and',
    
    // Analytics
    'analytics.title': '📊 Financial Analytics',
    'analytics.subtitle': 'Visualize your spending patterns and trends',
    'analytics.period': 'Period:',
    'analytics.summary': 'Summary',
    'analytics.net_balance': 'Net Balance',
    'analytics.monthly_overview': 'Monthly Overview',
    'analytics.category_breakdown': 'Spending by Category',
    'analytics.spending_trend': 'Spending Trend',
    'analytics.top_expenses': 'Top Expense Categories',
    'analytics.largest_expenses': 'Largest Expenses',
    'analytics.no_data': 'No data available',
    
    // Recurring
    'recurring.title': '🔄 Recurring Transactions',
    'recurring.subtitle': 'Manage your recurring income and expenses',
    'recurring.all': 'All',
    'recurring.income_tab': 'Income',
    'recurring.expenses_tab': 'Expenses',
    'recurring.monthly_income': 'Monthly Recurring Income',
    'recurring.monthly_expenses': 'Monthly Recurring Expenses',
    'recurring.monthly_net': 'Net Monthly',
    'recurring.loading': 'Loading recurring transactions...',
    'recurring.no_recurring': 'No Recurring Transactions',
    'recurring.no_recurring_desc': 'You haven\'t set up any recurring transactions yet.',
    'recurring.go_dashboard': 'Go to Dashboard',
    
    // Navigation extras
    'nav.analytics': 'Analytics',
    'nav.recurring': 'Recurring',
    'nav.accounts': 'Accounts',
    
    // Accounts
    'accounts.title': '🏦 Accounts & Cards',
    'accounts.subtitle': 'Manage your bank accounts and credit cards',
    'accounts.total_balance': 'Total Balance',
    'accounts.bank_accounts': 'Bank Accounts',
    'accounts.credit_debt': 'Credit Card Debt',
    'accounts.cash': 'Cash',
    'accounts.add_account': '+ Add Account',
    'accounts.transfer': '↔️ Transfer',
    'accounts.recalculate': '🔄 Recalculate Balances',
    'accounts.all': 'All',
    'accounts.checking': 'Checking',
    'accounts.savings': 'Savings',
    'accounts.credit_cards': 'Credit Cards',
    'accounts.cash_tab': 'Cash',
    'accounts.archived': 'Archived',
    'accounts.loading': 'Loading accounts...',
    'accounts.no_accounts': 'No Accounts Yet',
    'accounts.no_accounts_desc': 'Add your first bank account or credit card to start tracking your finances across multiple accounts.',
    'accounts.add_first': '+ Add Your First Account',
    'accounts.name': 'Account Name',
    'accounts.type': 'Account Type',
    'accounts.currency': 'Currency',
    'accounts.bank': 'Bank (optional)',
    'accounts.last_four': 'Last 4 Digits (optional)',
    'accounts.credit_limit': 'Credit Limit',
    'accounts.color': 'Color',
    'accounts.icon': 'Icon',
    'accounts.notes': 'Notes (optional)',
    'accounts.edit_account': 'Edit Account',
    'accounts.from_account': 'From Account',
    'accounts.to_account': 'To Account',
    'accounts.amount': 'Amount',
    'accounts.date': 'Date',
    'accounts.transfer_btn': 'Transfer',
    
    // Sidebar
    'sidebar.profile': 'Profile',
    'sidebar.settings': 'Settings',
    'sidebar.password': 'Password',
    'sidebar.activity': 'Activity Log',
    
    // Activity Log
    'activity.title': '📄 Activity Log',
    'activity.subtitle': 'Tracking your actions for transparency and security.',
    'activity.filter.period': 'Period',
    'activity.filter.today': 'Today',
    'activity.filter.7days': 'Last 7 days',
    'activity.filter.30days': 'Last 30 days',
    'activity.filter.all': 'All time',
    'activity.filter.action': 'Action type',
    'activity.filter.all_actions': 'All actions',
    'activity.filter.transactions': 'Transactions',
    'activity.filter.goals': 'Goals',
    'activity.filter.settings': 'Settings',
    'activity.filter.login': 'Login/Logout',
    'activity.filter.entity': 'Entity',
    'activity.filter.all_entities': 'All entities',
    'activity.filter.transaction': 'Transaction',
    'activity.filter.goal': 'Goal',
    'activity.filter.settings_entity': 'Settings',
    'activity.filter.profile': 'Profile',
    'activity.empty': 'No activity found for the selected filters.',
    'activity.transaction_added': 'Transaction added',
    'activity.transaction_edited': 'Transaction edited',
    'activity.transaction_deleted': 'Transaction deleted',
    'activity.goal_created': 'Goal created',
    'activity.goal_edited': 'Goal edited',
    'activity.goal_completed': 'Goal completed',
    'activity.goal_archived': 'Goal archived',
    'activity.goal_unarchived': 'Goal unarchived',
    'activity.contribution': 'Contribution to goal',
    'activity.withdrawal': 'Withdrawal from goal',
    'activity.settings_changed': 'Settings changed',
    'activity.profile_updated': 'Profile updated',
    'activity.login': 'Logged in',
    'activity.logout': 'Logged out',
    'activity.target': 'target'
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
    'home.quick_access': '🔥 Acesso Rápido',
    'home.tap_enter': '👉 Toque em qualquer lugar para entrar',
    'home.dashboard.title': '📊 Dashboard',
    'home.dashboard.desc': 'Visão geral das suas finanças em tempo real',
    'home.analytics.title': '📈 Análises',
    'home.analytics.desc': 'Visualize seus padrões de gastos',
    'home.profile.title': '👤 Perfil',
    'home.profile.desc': 'Seu perfil e configurações',
    'home.features.title': '✨ Recursos Principais',
    'home.features.1': 'Controle receitas e despesas',
    'home.features.2': 'Gráficos e resumos mensais',
    'home.features.3': 'Crie e monitore metas financeiras',
    'home.features.4': 'Alertas e notificações personalizadas',
    'home.features.5': 'Suporte multi-moeda',
    'home.features.6': 'Transações recorrentes',
    'home.cta.title': 'Pronto para assumir o controle?',
    'home.cta.subtitle': 'Comece a gerenciar suas finanças hoje!',
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
    'dashboard.this_month': 'Este mês',
    'dashboard.all_accounts': 'Todas as contas',
    'dashboard.bank_accounts': '💳 Contas Bancárias',
    'dashboard.checking_savings': 'Corrente e Poupança',
    'dashboard.cash': '💵 Dinheiro',
    'dashboard.cash_on_hand': 'Dinheiro em caixa',
    'dashboard.credit_debt': '💳 Dívida do Cartão',
    'dashboard.outstanding': 'Saldo devedor',
    'dashboard.income_minus_expenses': 'Receita - Despesas',
    'dashboard.quick_actions': 'Ações Rápidas',
    'dashboard.view_details': '📊 Ver Análises Detalhadas',
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
    'start_new_goal': 'Iniciar Nova Meta',
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
    'time.and': 'e',
    
    // Analytics
    'analytics.title': '📊 Análises Financeiras',
    'analytics.subtitle': 'Visualize seus padrões de gastos e tendências',
    'analytics.period': 'Período:',
    'analytics.summary': 'Resumo',
    'analytics.net_balance': 'Saldo Líquido',
    'analytics.monthly_overview': 'Visão Mensal',
    'analytics.category_breakdown': 'Gastos por Categoria',
    'analytics.spending_trend': 'Tendência de Gastos',
    'analytics.top_expenses': 'Maiores Categorias de Despesas',
    'analytics.largest_expenses': 'Maiores Despesas',
    'analytics.no_data': 'Sem dados disponíveis',
    
    // Recurring
    'recurring.title': '🔄 Transações Recorrentes',
    'recurring.subtitle': 'Gerencie suas receitas e despesas recorrentes',
    'recurring.all': 'Todas',
    'recurring.income_tab': 'Receitas',
    'recurring.expenses_tab': 'Despesas',
    'recurring.monthly_income': 'Receita Mensal Recorrente',
    'recurring.monthly_expenses': 'Despesas Mensais Recorrentes',
    'recurring.monthly_net': 'Líquido Mensal',
    'recurring.loading': 'Carregando transações recorrentes...',
    'recurring.no_recurring': 'Nenhuma Transação Recorrente',
    'recurring.no_recurring_desc': 'Você ainda não configurou nenhuma transação recorrente.',
    'recurring.go_dashboard': 'Ir para o Dashboard',
    
    // Navigation extras
    'nav.analytics': 'Análises',
    'nav.recurring': 'Recorrentes',
    'nav.accounts': 'Contas',
    
    // Accounts
    'accounts.title': '🏦 Contas e Cartões',
    'accounts.subtitle': 'Gerencie suas contas bancárias e cartões de crédito',
    'accounts.total_balance': 'Saldo Total',
    'accounts.bank_accounts': 'Contas Bancárias',
    'accounts.credit_debt': 'Dívida do Cartão',
    'accounts.cash': 'Dinheiro',
    'accounts.add_account': '+ Adicionar Conta',
    'accounts.transfer': '↔️ Transferir',
    'accounts.recalculate': '🔄 Recalcular Saldos',
    'accounts.all': 'Todas',
    'accounts.checking': 'Corrente',
    'accounts.savings': 'Poupança',
    'accounts.credit_cards': 'Cartões de Crédito',
    'accounts.cash_tab': 'Dinheiro',
    'accounts.archived': 'Arquivadas',
    'accounts.loading': 'Carregando contas...',
    'accounts.no_accounts': 'Nenhuma Conta Ainda',
    'accounts.no_accounts_desc': 'Adicione sua primeira conta bancária ou cartão de crédito para começar a rastrear suas finanças em múltiplas contas.',
    'accounts.add_first': '+ Adicionar Primeira Conta',
    'accounts.name': 'Nome da Conta',
    'accounts.type': 'Tipo de Conta',
    'accounts.currency': 'Moeda',
    'accounts.bank': 'Banco (opcional)',
    'accounts.last_four': 'Últimos 4 Dígitos (opcional)',
    'accounts.credit_limit': 'Limite de Crédito',
    'accounts.color': 'Cor',
    'accounts.icon': 'Ícone',
    'accounts.notes': 'Notas (opcional)',
    'accounts.edit_account': 'Editar Conta',
    'accounts.from_account': 'Da Conta',
    'accounts.to_account': 'Para Conta',
    'accounts.amount': 'Valor',
    'accounts.date': 'Data',
    'accounts.transfer_btn': 'Transferir',
    
    // Sidebar
    'sidebar.profile': 'Perfil',
    'sidebar.settings': 'Configurações',
    'sidebar.password': 'Senha',
    'sidebar.activity': 'Histórico',
    
    // Activity Log
    'activity.title': '📄 Histórico de Atividades',
    'activity.subtitle': 'Acompanhe suas ações para transparência e segurança.',
    'activity.filter.period': 'Período',
    'activity.filter.today': 'Hoje',
    'activity.filter.7days': 'Últimos 7 dias',
    'activity.filter.30days': 'Últimos 30 dias',
    'activity.filter.all': 'Todo o período',
    'activity.filter.action': 'Tipo de ação',
    'activity.filter.all_actions': 'Todas as ações',
    'activity.filter.transactions': 'Transações',
    'activity.filter.goals': 'Metas',
    'activity.filter.settings': 'Configurações',
    'activity.filter.login': 'Login/Logout',
    'activity.filter.entity': 'Entidade',
    'activity.filter.all_entities': 'Todas as entidades',
    'activity.filter.transaction': 'Transação',
    'activity.filter.goal': 'Meta',
    'activity.filter.settings_entity': 'Configurações',
    'activity.filter.profile': 'Perfil',
    'activity.empty': 'Nenhuma atividade encontrada para os filtros selecionados.',
    'activity.transaction_added': 'Transação adicionada',
    'activity.transaction_edited': 'Transação editada',
    'activity.transaction_deleted': 'Transação excluída',
    'activity.goal_created': 'Meta criada',
    'activity.goal_edited': 'Meta editada',
    'activity.goal_completed': 'Meta concluída',
    'activity.goal_archived': 'Meta arquivada',
    'activity.goal_unarchived': 'Meta desarquivada',
    'activity.contribution': 'Contribuição para meta',
    'activity.withdrawal': 'Retirada da meta',
    'activity.settings_changed': 'Configurações alteradas',
    'activity.profile_updated': 'Perfil atualizado',
    'activity.login': 'Login realizado',
    'activity.logout': 'Logout realizado',
    'activity.target': 'meta'
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
