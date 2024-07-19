document.addEventListener('DOMContentLoaded', () => {
    loadHTML('components/navbar.html', renderNavbar);
    loadHTML('pages/login.html', renderLoginPage);
});

function loadHTML(url, callback) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('app');
            container.innerHTML = html;
            if (callback) callback(container);
        });
}

function renderNavbar() {
    const navbar = document.getElementById('navbar');
    fetch('components/navbar.html')
        .then(response => response.text())
        .then(html => {
            navbar.innerHTML = html;
            setupNavbarEventListeners();
        });
}

function setupNavbarEventListeners() {
    document.querySelector('.menu-icon').addEventListener('click', toggleSidebar);
    document.getElementById('search-notes').addEventListener('input', searchNotes);
    document.addEventListener('click', closeSidebarOnOutsideClick);
}

function closeSidebarOnOutsideClick(event) {
    const sidebar = document.getElementById('sidebar');
    const menuIcon = document.querySelector('.menu-icon');
    if (!sidebar.contains(event.target) && event.target !== menuIcon) {
        sidebar.classList.remove('active');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function renderLoginPage(container) {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-button').addEventListener('click', () => {
        loadHTML('pages/signup.html', renderSignupPage);
    });
}

function renderSignupPage(container) {
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('useremail').value;
    const password = document.getElementById('userpassword').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        document.getElementById('navbar').style.display = 'block';
        document.getElementById('profile-icon').innerText = user.username[0];
        loadHTML('pages/app.html', renderAppPage);
    } else {
        document.getElementById('error-message').innerText = 'User not found. Please signup.';
    }
}

function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        document.getElementById('error-message').innerText = 'Passwords do not match.';
        return;
    }

    if (!validatePassword(password)) {
        document.getElementById('error-message').innerText = 'Password must be at least 8 characters long, include at least one uppercase letter, one number, and one special character.';
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    loadHTML('pages/login.html', renderLoginPage);
}

function validatePassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
}

function renderAppPage(container) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    renderNotes(notes);

    document.getElementById('create-note').addEventListener('click', openNoteCreation);
    setupSidebarEventListeners();
}

function setupSidebarEventListeners() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', handleSidebarClick);
    });
}

function handleSidebarClick(event) {
    const action = event.target.dataset.action;
    switch(action) {
        case 'showNotes':
            showNotes();
            break;
        case 'showReminders':
            showReminders();
            break;
        case 'editLabels':
            editLabels();
            break;
        case 'showArchived':
            showArchived();
            break;
        case 'showBin':
            showBin();
            break;
    }
}

function openNoteCreation() {
    const noteCreationContainer = document.getElementById('note-creation-container');
    noteCreationContainer.classList.add('active');

    document.getElementById('reminder-button').addEventListener('click', () => {
        document.getElementById('due-date').style.display = 'block';
    });

    document.getElementById('archive-button').addEventListener('click', () => {
        document.getElementById('note-creation-container').dataset.archived = 'true';
    });

    document.getElementById('color-picker-button').addEventListener('click', () => {
        document.getElementById('color-picker').style.display = 'block';
    });

    const colorCircles = document.querySelectorAll('.color-circle');
    colorCircles.forEach(circle => {
        circle.addEventListener('click', event => {
            document.getElementById('note-creation-container').style.backgroundColor = event.target.style.backgroundColor;
        });
    });

    document.getElementById('note-form').addEventListener('submit', saveNote);
}

function saveNote() {
    event.preventDefault();
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const createdAt = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    notes.push({
        title: document.getElementById('note-title').value,
        content: document.getElementById('note-content').value,
        label: document.getElementById('note-label').value,
        dueDate: document.getElementById('due-date').value,
        archived: document.getElementById('note-creation-container').dataset.archived === 'true',
        createdAt: createdAt,
        trashed: false
    });
    localStorage.setItem('notes', JSON.stringify(notes));

    document.getElementById('note-creation-container').classList.remove('active');
    document.getElementById('note-form').reset();
    document.getElementById('due-date').style.display = 'none';
    document.getElementById('note-creation-container').style.backgroundColor = '#fff';
    document.getElementById('note-creation-container').dataset.archived = 'false';

    renderNotes(notes);
}

function renderNotes(notes) {
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = '';
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.style.backgroundColor = note.backgroundColor || '#fff';
        noteElement.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <div class="tags">${note.label}</div>
            <div class="due-date">${note.dueDate}</div>
            <div class="created-at">${note.createdAt}</div>
            <button class="edit-button">Edit</button>
            <button class="archive-button">Archive</button>
            <button class="delete-button">Delete</button>
        `;
        noteElement.querySelector('.edit-button').addEventListener('click', () => editNote(note));
        noteElement.querySelector('.archive-button').addEventListener('click', () => archiveNote(note));
        noteElement.querySelector('.delete-button').addEventListener('click', () => deleteNote(note));
        notesContainer.appendChild(noteElement);
    });
}

function searchNotes(event) {
    const query = event.target.value.toLowerCase();
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        note.label.toLowerCase().includes(query)
    );
    renderNotes(filteredNotes);
}

function showNotes() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const activeNotes = notes.filter(note => !note.archived && !note.trashed);
    renderNotes(activeNotes);
}

function showReminders() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const reminders = notes.filter(note => note.dueDate && !note.trashed);
    renderNotes(reminders);
}

function editLabels() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const labels = [...new Set(notes.map(note => note.label))];
    const labelContainer = document.createElement('div');
    labelContainer.innerHTML = `
        <h2>Edit Labels</h2>
        ${labels.map(label => `
            <div>
                <input type="text" value="${label}" onchange="updateLabel('${label}', this.value)" />
                <button onclick="deleteLabel('${label}')">Delete</button>
            </div>
        `).join('')}
    `;
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(labelContainer);
}

function updateLabel(oldLabel, newLabel) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.forEach(note => {
        if (note.label === oldLabel) {
            note.label = newLabel;
        }
    });
    localStorage.setItem('notes', JSON.stringify(notes));
    editLabels();
}

function deleteLabel(label) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.forEach(note => {
        if (note.label === label) {
            note.label = '';
        }
    });
    localStorage.setItem('notes', JSON.stringify(notes));
    editLabels();
}

function showArchived() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const archivedNotes = notes.filter(note => note.archived && !note.trashed);
    renderNotes(archivedNotes);
}

function showBin() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const trashedNotes = notes.filter(note => note.trashed);
    renderNotes(trashedNotes);
}

function openNoteDetails(createdAt) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const note = notes.find(note => note.createdAt === createdAt);
    const noteDetails = document.createElement('div');
    noteDetails.className = 'note-details';
    noteDetails.innerHTML = `
        <h2>${note.title}</h2>
        <p>${note.content}</p>
        <div class="tags">${note.label}</div>
        <div class="due-date">${note.dueDate}</div>
        <div class="created-at">${note.createdAt}</div>
        <button onclick="closeNoteDetails()">Close</button>
    `;
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(noteDetails);
}

function closeNoteDetails() {
    renderAppPage();
}

document.getElementById('notes-container').addEventListener('click', event => {
    if (event.target.closest('.note')) {
        const createdAt = event.target.closest('.note').querySelector('.created-at').textContent;
        openNoteDetails(createdAt);
    }
});
function deleteNote() {
    const noteId = this.getAttribute('data-id');
    let notes = JSON.parse(localStorage.getItem('notes'));
    notes = notes.filter(note => note.id !== parseInt(noteId));
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes(notes);
}

function archiveNote() {
    const noteId = this.getAttribute('data-id');
    let notes = JSON.parse(localStorage.getItem('notes'));
    const note = notes.find(note => note.id === parseInt(noteId));
    note.archived = true;
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes(notes);
}
function toggleNotes() {
    const notes = document.getElementById('note-form');
    notes.classList.toggle('active');
}