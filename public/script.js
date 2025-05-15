document.addEventListener('DOMContentLoaded', () => {
    // Инициализация темы
    initTheme();
    
    // Обработка форм
    setupAuthForms();
    
    // Проверка авторизации для профиля
    if(window.location.pathname === '/profile') {
        checkAuth();
        loadProfile();
    }
});

// Инициализация темы
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme;
}

// Переключение темы
function toggleTheme() {
    const newTheme = document.body.className === 'dark' ? 'light' : 'dark';
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
}

// Переключение между формами
function switchForm(formType) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    document.querySelector(`.tab[onclick*="${formType}"]`).classList.add('active');
    document.getElementById(`${formType}Form`).classList.add('active');
}

// Настройка обработчиков форм
function setupAuthForms() {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAuth('/login', e.target);
    });

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAuth('/register', e.target);
    });
}

// Обработка авторизации/регистрации
async function handleAuth(endpoint, form) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    
    const data = {
        username: form.username.value,
        password: form.password.value
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            window.location.href = '/profile';
        } else {
            const error = await response.json();
            showMessage(error.error || 'Ошибка авторизации', 'error');
        }
    } catch (err) {
        showMessage('Ошибка соединения', 'error');
    }
}

// Проверка авторизации
async function checkAuth() {
    try {
        const response = await fetch('/profile');
        if (response.status === 401) window.location.href = '/';
    } catch (err) {
        window.location.href = '/';
    }
}

// Загрузка профиля
function loadProfile() {
    const username = sessionStorage.getItem('username');
    if(username) {
        document.getElementById('username').textContent = username;
    }
}

// Получение данных
async function fetchData() {
    try {
        const response = await fetch('/data');
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        document.getElementById('dataContent').textContent = data.data;
    } catch (err) {
        showMessage('Ошибка загрузки данных', 'error');
    }
}

// Выход из системы
async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        sessionStorage.clear();
        window.location.href = '/';
    } catch (err) {
        showMessage('Ошибка выхода', 'error');
    }
}

// Вспомогательные функции
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    setTimeout(() => messageEl.textContent = '', 3000);
}