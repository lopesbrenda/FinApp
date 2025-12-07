## 🌐 Idiomas
[🇺🇸 English](./README.md) | [🇧🇷 Português (BR)](./README.pt-BR.md)

---

# FinApp
*Gerenciador Financeiro Pessoal com Sincronização em Tempo Real*

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)

## 🏗️ Arquitetura do Projeto

### Visão Geral
FinApp é uma aplicação financeira completa construída com **Flask (backend Python)** + **Firebase (banco realtime)** + **JavaScript modular (frontend SPA-like)**.

**Stack tecnológico**:
Backend: Flask + Firebase Admin SDK     
Frontend: Vanilla JS (modular) + CSS modular + i18n + Design Tokens     
Banco: Firestore (NoSQL realtime)       
Autenticação: Firebase Auth     


### Estrutura de Diretórios
FinApp/     
├── app.py # App Flask principal + rotas        
├── config.py # Configurações (Firebase, Flask)     
├── auth.py # Lógica autenticação backend       
├── firebase_service.py # Cliente Firebase Admin SDK        
├── templates/ # Templates HTML (9 páginas)     
│ ├── index.html, login.html, dashboard.html...     
├── static/     
│ ├── style/ # CSS modular (7 arquivos)     
│ │ ├── main.css, components.css, profile.css...        
│ └── js/       
│ ├── app.js # Core da aplicação        
│ ├── i18n.js # Internacionalização (28k+ linhas!)      
│ ├── design-tokens.json # Tokens de design     
│ ├── firebase/ # Firebase SDK (4 arquivos)     
│ ├── pages/ # Lógica das páginas (6 arquivos ~130k linhas)     
│ │ ├── dashboard.js, analytics.js (38k+), profile.js...        
│ ├── services/ # Services de negócio (5 arquivos)      
│ │ ├── accounts-service.js (18k+), currency-service.js...      
│ └── utils/ # Utilitários transversais (8 arquivos)        
│ ├── modal.js (31k+), projections.js...        


### Fluxo de Dados
Usuário acessa /login → Flask renderiza login.html

JS (auth.js) → Firebase Auth → login bem-sucedido

Redireciona para /dashboard → renderiza dashboard.html

dashboard.js → carrega services → Firestore queries → popula UI

Interações → utils + services → Firestore mutations (realtime)

i18n.js gerencia textos multilíngue

theme.js + design-tokens.json aplicam estilos dinâmicos


## 🚀 Início Rápido

### Pré-requisitos
- Python 3.8+
- Node.js (opcional, ferramentas dev)
- Projeto Firebase com Firestore + Auth

### Instalação
Clonar repositório      
git clone https://github.com/lopesbrenda/FinApp.git     
cd FinApp       

Instalar dependências Python        
pip install -r requirements.txt     

Configurar Firebase (veja instruções abaixo)        
cp serviceAccount.json.example serviceAccount.json      

Executar servidor de desenvolvimento        
python app.py       


**Acesse**: `http://localhost:5000`

## 🔧 Configuração Firebase

1. Criar projeto Firebase em [console.firebase.google.com](https://console.firebase.google.com)
2. Habilitar **Authentication** (Email/Senha)
3. Habilitar **Firestore Database**
4. Baixar **Service Account JSON** → renomear para `serviceAccount.json`
5. Atualizar `config.py` com dados do projeto

## 📱 Funcionalidades

- ✅ Suporte multi-moeda
- ✅ Transações recorrentes
- ✅ Metas financeiras com progresso
- ✅ Analytics & projeções em tempo real
- ✅ Multi-idioma (i18n pronto)
- ✅ Design responsivo (mobile-first)
- ✅ Sincronização Firebase realtime

## 🛠️ Desenvolvimento
Executar com auto-reload        
python app.py       

Lint & formatar     
pip install black flake8        
black .     
flake8 .        


## 📄 Licença
Licença MIT - veja [LICENSE](LICENSE) para detalhes.

