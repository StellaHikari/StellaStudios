/* =========================
   CONFIG
========================= */
const ADMIN_USERNAME = "Stella";
const ADMIN_PASSWORD = "Admin123";

/* =========================
   STORAGE
========================= */
let data = JSON.parse(localStorage.getItem("stellastudio")) || {
  projects: [],
  current: null
};

let isAdmin = false;       // Admin flag
let viewProjectId = null;  // View-only project

const save = () => localStorage.setItem("stellastudio", JSON.stringify(data));

/* =========================
   LOGIN SYSTEM
========================= */
function showLogin() {
  const loginForm = document.createElement("div");
  loginForm.id = "loginForm";
  loginForm.innerHTML = `
    <div class="login-box">
      <h2>Admin Login</h2>
      <input id="loginUser" placeholder="Username">
      <input id="loginPass" type="password" placeholder="Password">
      <button onclick="login()">Login</button>
      <button onclick="enterViewOnly()">View Only</button>
    </div>
  `;
  document.body.prepend(loginForm);
  document.querySelectorAll("body > *:not(#loginForm)").forEach(el => el.style.display = "none");
}

function login() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    isAdmin = true;
    document.getElementById("loginForm").remove();

    document.querySelectorAll("body > *")
      .forEach(el => el.style.display = "block");

    toggleNav(true);
    renderAll();

    showBackToLoginButton(); // ✅ ADD THIS

    alert("Admin access granted!");
  } else {
    alert("Incorrect username or password.");
  }
}

function enterViewOnly() {
  isAdmin = false;

  document.getElementById("loginForm").remove();

  document.querySelectorAll("body > *")
    .forEach(el => el.style.display = "block");

  toggleNav(false);

  renderAll();
  renderHomeFolders();

  showBackToLoginButton(); // ✅ use shared button

  alert("View-only mode enabled.");
}

function showBackToLoginButton() {
  // Prevent duplicates
  if (document.getElementById("backToLogin")) return;

  const backButton = document.createElement("button");
  backButton.id = "backToLogin";
  backButton.textContent = "Back to Login";

  backButton.style.position = "fixed";
  backButton.style.top = "10px";
  backButton.style.right = "10px";
  backButton.style.zIndex = 9999;
  backButton.style.display = "block";

  backButton.onclick = () => {
    backButton.remove();
    isAdmin = false;
    viewProjectId = null;
    data.current = null;

    document.querySelectorAll("body > *:not(#loginForm)")
      .forEach(el => el.style.display = "none");

    showLogin();
  };

  document.body.appendChild(backButton);
}

/* =========================
   NAVIGATION
========================= */
function toggleNav(showAdminNav) {
  document.querySelectorAll("header nav button").forEach(btn => {
    btn.style.display = btn.textContent === "Home" || showAdminNav ? "inline-block" : "none";
  });
}


/* =========================
   PROJECT HELPERS
========================= */
const getProject = (id = data.current || viewProjectId) =>
  data.projects.find(p => p.id === id) || null;

/* =========================
   ADMIN PROJECTS
========================= */
function addProject() {
  if (!isAdmin) return alert("Admin only!");
  const name = document.getElementById("projectName").value.trim();
  if (!name) return;

  data.projects.push({ id: Date.now(), name, images: [], logs: [], tasks: [] });
  save();
  renderProjects();
  renderHomeFolders();
  document.getElementById("projectName").value = "";
}

function renderProjects() {
  const list = document.getElementById("projectList");
  if (!list) return;
  list.innerHTML = "";

  data.projects.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${p.name}</span>
      <div>
        <button onclick="openProject(${p.id})">Open</button>
        ${isAdmin ? `<button onclick="deleteProject(${p.id})">Delete</button>` : ""}
      </div>
    `;
    list.appendChild(li);
  });
}

function openProject(id) {
  data.current = id;
  viewProjectId = null;
  save();

  const proj = getProject();
  if (!proj) return;

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const workspace = document.getElementById("workspace");
  workspace.classList.add("active");

  const currentTitle = document.getElementById("currentProject");
  if (currentTitle) currentTitle.textContent = "📁 " + proj.name;

  enableWorkspaceEditing(proj);
  openTab("portfolio");

  toggleNav(isAdmin);
}

function enableWorkspaceEditing(proj) {
  document.querySelectorAll(".upload-box input, .upload-box button, .log-form input, .log-form textarea, .log-form button, .task-input input, .task-input button")
          .forEach(el => el.disabled = !isAdmin ? false : el.disabled);
}

function deleteProject(id) {
  if (!isAdmin) return alert("Admin only!");
  if (!confirm("Delete this project?")) return;

  data.projects = data.projects.filter(p => p.id !== id);
  if (data.current === id) data.current = null;
  save();
  renderProjects();
  renderHomeFolders();
  renderAll();
}

/* =========================
   PORTFOLIO / DEVLOG / TASKS
========================= */
function addImage() {
  if (!isAdmin) return alert("Admin only!");
  const proj = getProject();
  if (!proj) return;

  const input = document.getElementById("imgInput");
  const title = document.getElementById("imgTitle").value.trim();
  const desc = document.getElementById("imgDesc").value.trim();
  if (!input.files[0] || !title) return;

  const reader = new FileReader();
  reader.onload = () => {
    proj.images.push({ 
      id: Date.now(), 
      src: reader.result, 
      title, 
      desc, 
      type: input.files[0].type
    });
    save();
    renderImages();
  };
  reader.readAsDataURL(input.files[0]);
}

function renderImages() {
  const proj = getProject();
  const grid = document.getElementById("portfolioGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!proj) return;

  proj.images.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    let mediaHTML = "";
    if (item.type.startsWith("image/")) mediaHTML = `<img src="${item.src}" alt="${item.title}">`;
    else if (item.type.startsWith("video/") || item.type === "video/mp4") mediaHTML = `<video controls src="${item.src}"></video>`;
    else if (item.type.startsWith("audio/") || item.type === "audio/mpeg" || item.type === "audio/wav") mediaHTML = `<audio controls src="${item.src}"></audio>`;

    card.innerHTML = `
      ${mediaHTML}
      <h3>${item.title}</h3>
      <p>${item.desc || ""}</p>
    `;

    // Admin delete button
    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";
      delBtn.style.background = "#e74c3c";
      delBtn.style.color = "#fff";
      delBtn.style.border = "none";
      delBtn.style.padding = "5px 10px";
      delBtn.style.cursor = "pointer";
      delBtn.style.borderRadius = "4px";
      delBtn.style.marginTop = "5px";

      delBtn.addEventListener("click", () => {
        if (confirm("Delete this media?")) {
          deleteMedia(item.id); // Works for all media types
          renderImages();       // Re-render workspace grid
          renderFolderTab("portfolio"); // Also update folder tab if open
        }
      });

      card.appendChild(delBtn);
    }

    grid.appendChild(card);
  });
}


function addLog() {
  if (!isAdmin) return alert("Admin only!");
  const proj = getProject();
  if (!proj) return;

  const title = document.getElementById("logTitle").value.trim();
  const text = document.getElementById("logText").value.trim();
  if (!title || !text) return;

  proj.logs.push({ id: Date.now(), title, text, date: new Date().toLocaleString() });
  save();
  renderLogs();
}

function renderLogs() {
  const proj = getProject();
  const logList = document.getElementById("logList");
  if (!logList) return;
  logList.innerHTML = "";
  if (!proj) return;

  proj.logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "log-post";
    if (!isAdmin) div.classList.add("view-only");
    div.innerHTML = `<h3>${log.title}</h3><small>${log.date}</small><p>${log.text}</p>${isAdmin ? `<div class="controls"><button class="delete-btn" onclick="deleteLog(${log.id})">Delete</button></div>` : ""}`;
    logList.appendChild(div);
  });
}

function addTask() {
  if (!isAdmin) return alert("Admin only!");
  const proj = getProject();
  if (!proj) return;

  const text = document.getElementById("taskText").value.trim();
  if (!text) return;

  proj.tasks.push({ id: Date.now(), text, done: false });
  save();
  renderTasks();
}

function renderTasks() {
  const proj = getProject();
  const list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";
  if (!proj) return;

  proj.tasks.forEach(task => {
    const li = document.createElement("li");
    li.innerHTML = `<input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleTask(${task.id}, this)"><span>${task.text}</span>${isAdmin ? `<button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>` : ""}`;
    if (!isAdmin) li.classList.add("view-only");
    list.appendChild(li);
  });
}

function toggleTask(id, checkbox) {
  if (!isAdmin) return;
  const proj = getProject();
  const task = proj?.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = checkbox.checked;
  save();
}

/* =========================
   HOME FOLDERS & VIEW-ONLY
========================= */
function renderHomeFolders() {
  const folderGrid = document.getElementById("homeFolders");
  if (!folderGrid) return;

  folderGrid.innerHTML = "";

  data.projects.forEach(project => {
    const folder = document.createElement("div");
    folder.className = "folder-card";
    folder.innerHTML = `<div class="folder-icon">📁</div><span>${project.name}</span>`;
    folder.onclick = () => openFolderView(project.id);
    folderGrid.appendChild(folder);
  });

  // Don't hide summary at all
  const summary = document.getElementById("summary");
  if (summary) summary.style.display = "block";
}


function deleteMedia(id) {
  if (!isAdmin) return alert("Admin only!");
  const proj = getProject();
  if (!proj) return;

  proj.images = proj.images.filter(item => item.id !== id);
  save();
}


function renderFolderTab(tabName) {
  const proj = getProject(viewProjectId);
  const container = document.getElementById("folderTabContent");
  if (!container || !proj) return;

  container.innerHTML = "";

  // Highlight active tab
  document.querySelectorAll(".view-tabs button").forEach(b => b.classList.remove("active"));
  const btn = Array.from(document.querySelectorAll(".view-tabs button"))
    .find(b => b.textContent.toLowerCase().includes(tabName));
  if (btn) btn.classList.add("active");

  /* ========================
     PORTFOLIO
  ======================== */
  if (tabName === "portfolio") {
    const grid = document.createElement("div");
    grid.className = "grid";

    proj.images.forEach(item => {
      const card = document.createElement("div");
      card.className = isAdmin ? "card" : "card view-only";

      let mediaHTML = "";
      if (item.type.startsWith("image/")) {
        mediaHTML = `<img src="${item.src}" alt="${item.title}">`;
      } else if (item.type.startsWith("video/")) {
        mediaHTML = `<video controls src="${item.src}"></video>`;
      } else if (item.type.startsWith("audio/")) {
        mediaHTML = `<audio controls src="${item.src}"></audio>`;
      }

      card.innerHTML = `
        ${mediaHTML}
        <h3>${item.title}</h3>
        <p>${item.desc || ""}</p>
      `;

      // Admin delete button
      if (isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "delete-btn";
        delBtn.style.background = "#e74c3c";
        delBtn.style.color = "#fff";
        delBtn.style.border = "none";
        delBtn.style.padding = "5px 10px";
        delBtn.style.cursor = "pointer";
        delBtn.style.borderRadius = "4px";
        delBtn.style.marginTop = "5px";

        delBtn.addEventListener("click", () => {
          if (confirm("Delete this media?")) {
            deleteMedia(item.id); // ✅ Works for images, videos, audio
            renderFolderTab("portfolio");
          }
        });

        card.appendChild(delBtn);
      }

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  /* ========================
     DEVLOG
  ======================== */
  if (tabName === "log") {
    proj.logs.forEach(log => {
      const div = document.createElement("div");
      div.className = isAdmin ? "log-post" : "log-post view-only";

      div.innerHTML = `
        <h3>${log.title}</h3>
        <small>${log.date}</small>
        <p>${log.text}</p>
      `;

      if (isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "delete-btn";
        delBtn.style.background = "#e74c3c";
        delBtn.style.color = "#fff";
        delBtn.style.border = "none";
        delBtn.style.padding = "5px 10px";
        delBtn.style.cursor = "pointer";
        delBtn.style.borderRadius = "4px";
        delBtn.style.marginTop = "5px";

        delBtn.addEventListener("click", () => {
          if (confirm("Delete this log?")) {
            deleteLog(log.id);
            renderFolderTab("log");
          }
        });

        div.appendChild(delBtn);
      }

      container.appendChild(div);
    });
  }

/* ========================
   TASKS / TRACKER
======================== */
if (tabName === "tracker") {
  const ul = document.createElement("ul");

  proj.tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = isAdmin ? "task-item" : "task-item view-only";

    // Show checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    if (isAdmin) {
      // Admin can interact
      checkbox.addEventListener("change", () => toggleTask(task.id, checkbox));
    } else {
      // View-only: disable interaction
      checkbox.disabled = true;
    }

    li.appendChild(checkbox);

    // Task text
    const span = document.createElement("span");
    span.textContent = task.text;
    if (!isAdmin && task.done) {
      span.textContent += " ✔️"; // Add a checkmark for done tasks
    }
    li.appendChild(span);

    // Delete button for admin
    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";
      delBtn.style.background = "#e74c3c";
      delBtn.style.color = "#fff";
      delBtn.style.border = "none";
      delBtn.style.padding = "3px 8px";
      delBtn.style.cursor = "pointer";
      delBtn.style.borderRadius = "4px";
      delBtn.style.marginLeft = "10px";

      delBtn.addEventListener("click", () => {
        if (confirm("Delete this task?")) {
          deleteTask(task.id);
          renderFolderTab("tracker");
        }
      });

      li.appendChild(delBtn);
    }

    ul.appendChild(li);
  });

  container.appendChild(ul);
}
}
// =========================
// HOME BUTTON FUNCTIONALITY
// =========================
function setupHomeButton() {
  const homeBtn = document.querySelector("header nav button.home");
  if (!homeBtn) return;

  homeBtn.onclick = () => {
    viewProjectId = null;
    data.current = null;

    renderHomeFolders();

    document.querySelectorAll(".page").forEach(p => {
      if (p.id !== "home") p.classList.remove("active");
    });

    // ✅ Summary always visible
    const summary = document.getElementById("summary");
    if (summary) summary.style.display = "block";

    toggleNav(isAdmin);
  };
}

setupHomeButton();
/* =========================
   OPEN FOLDER VIEW
========================= */
function openFolderView(projectId) {
  viewProjectId = projectId;
  data.current = null;

  const proj = getProject(viewProjectId);
  if (!proj) return;

  const home = document.getElementById("home");

  // Show Home page (folders & summary always visible)
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  home.classList.add("active");

  // Summary always visible
  const summary = document.getElementById("summary");
  if (summary) summary.style.display = "block";

  // Remove any old folder overlay
  const oldFolderView = document.getElementById("folderView");
  if (oldFolderView) oldFolderView.remove();

  // Create new folder view container
  const folderView = document.createElement("div");
  folderView.id = "folderView";
  folderView.style.marginTop = "50px";
  folderView.innerHTML = `
    <button id="backToHome">← Back to Projects</button>
    <h2>${proj.name}</h2>
    <div class="view-tabs">
      <button onclick="renderFolderTab('portfolio')">Portfolio</button>
      <button onclick="renderFolderTab('log')">Devlog</button>
      <button onclick="renderFolderTab('tracker')">Tasks</button>
    </div>
    <div id="folderTabContent" class="folder-tab-content"></div>
  `;
  home.appendChild(folderView);

  // Render the first tab by default
  renderFolderTab("portfolio");
}

/* =========================
   BACK TO PROJECTS BUTTON (delegated)
========================= */
document.addEventListener("click", (e) => {
  if (e.target.id === "backToHome") {
    // Reset project view
    viewProjectId = null;

    const folderView = document.getElementById("folderView");
    if (folderView) folderView.remove();

    // Activate Home page
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const home = document.getElementById("home");
    home.classList.add("active");

    // Always show summary and folders
    const summary = document.getElementById("summary");
    if (summary) summary.style.display = "block";
    renderHomeFolders();

    toggleNav(isAdmin);
  }
});


/* =========================
   SHOW SECTION (NAV)
========================= */
function showSection(id) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // Show requested page
  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  // Summary only visible on Home
  const summary = document.getElementById("summary");
  if (summary) summary.style.display = "block"; // always visible in Home

  // Remove folderView when leaving Home
  if (id !== "home") {
    const folderView = document.getElementById("folderView");
    if (folderView) folderView.remove();
  }

  // Open first tab if Workspace
  if (id === "workspace") openTab("portfolio");

  toggleNav(isAdmin);
}

/* =========================
   HOME BUTTON SETUP
========================= */
function setupHomeButton() {
  const homeBtn = document.querySelector("header nav button.home");
  if (!homeBtn) return;

  homeBtn.onclick = () => {
    viewProjectId = null;
    data.current = null;

    // Remove folderView if it exists
    const folderView = document.getElementById("folderView");
    if (folderView) folderView.remove();

    // Show Home page
    document.querySelectorAll(".page").forEach(p => {
      if (p.id !== "home") p.classList.remove("active");
      else p.classList.add("active");
    });

    // Summary always visible
    const summary = document.getElementById("summary");
    if (summary) summary.style.display = "block";

    // Always render folders in Home
    renderHomeFolders();

    toggleNav(isAdmin);
  };
}

// Initialize home button
setupHomeButton();

/* =========================
   BACK TO PROJECTS FUNCTION
========================= */
function backToProjects() {
  // Reset project view
  viewProjectId = null;

  // Remove folderView if it exists
  const folderView = document.getElementById("folderView");
  if (folderView) folderView.remove();

  // Show Home page
  document.querySelectorAll(".page").forEach(p => {
    if (p.id !== "home") p.classList.remove("active");
    else p.classList.add("active");
  });

  // Summary always visible
  const summary = document.getElementById("summary");
  if (summary) summary.style.display = "block";

  // Render Home folders
  renderHomeFolders();

  // Update navigation buttons
  toggleNav(isAdmin);
}

/* =========================
   ATTACH BACK BUTTON HANDLER
========================= */
document.addEventListener("click", (e) => {
  if (e.target.id === "backToHome") {
    backToProjects();
  }
});



/* =========================
   INIT
========================= */
function renderAll() {
  renderProjects();
  renderImages();
  renderLogs();
  renderTasks();
  renderHomeFolders();
}

// Start the app
showLogin();
renderAll();
