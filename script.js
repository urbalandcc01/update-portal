const API = "https://script.google.com/macros/s/AKfycbzNbXUntOMdd3fXlT-HqUumMMvHOrX47_O_wKNT1a8GKfumBBRJnbRjP6ok2Pxd41OrWQ/exec";

let updates = [];
let reads = [];
let currentUser = null;

async function loadData(){
  try{
    const response = await fetch(API);
    const data = await response.json();

    updates = data.updates.slice(1);
    reads = data.reads.slice(1);

    renderUpdates();

  }catch(error){
    console.log(error);
  }
}

function login(){
  const user = document.getElementById("userInput").value.trim();

  if(!user){
    alert("Enter User ID");
    return;
  }

  fetch(API)
    .then(res => res.json())
    .then(data => {
      // Debug: log raw users for diagnosis (can remove later)
      console.log('Login: users raw:', data.users);

      const usersRaw = data.users || [];
      const users = Array.isArray(usersRaw) && usersRaw.length && Array.isArray(usersRaw[0]) ? usersRaw.slice(1) : usersRaw;

      const normalize = v => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

      const found = users.find(u => {
        // support both array rows like [id, name...] and objects like {id:..., name:...}
        let candidate = '';
        if (Array.isArray(u)) {
          candidate = u[0];
        } else if (u && typeof u === 'object') {
          candidate = u.id ?? u.userId ?? u.employeeId ?? u[0] ?? '';
        } else {
          candidate = u;
        }
        return normalize(candidate) === normalize(user);
      });

      if(found){
        currentUser = user;
        localStorage.setItem("user", user);

        document.getElementById("loginPage").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        loadData();

      }else{
        alert("Invalid User ID");
      }

    })
    .catch(error => {
      console.log(error);
      alert("Login failed. Please try again.");
    });
}

function logout(){
  currentUser = null;
  localStorage.removeItem("user");
  location.reload();
}

function toggleTheme(){
  document.body.classList.toggle("light");

  if(document.body.classList.contains("light")){
    localStorage.setItem("theme","light");
  }else{
    localStorage.setItem("theme","dark");
  }
}

function renderUpdates(){
  const search = document.getElementById("searchInput").value.toLowerCase();

  const left = document.getElementById("recentUpdates");
  const right = document.getElementById("allUpdates");

  left.innerHTML = "";
  right.innerHTML = "";

  [...updates].reverse().forEach((update, index)=>{

    if(!update[1].toLowerCase().includes(search)) return;

    // Check if already read
    const isRead = reads.some(r => r[0] === update[1] && r[1] === currentUser);

    const card = document.createElement("div");

    card.className = isRead ? "card read" : "card unread";

    card.innerHTML = `
      <h2>${update[1]}</h2>
      <p>${update[2]}</p>
      <small>Date: ${update[3]}</small><br>
      <small>Priority: ${update[4]}</small><br><br>

      <label>
        <input class="checkbox" type="checkbox" ${isRead ? 'checked' : ''} onchange="markRead(this, '${update[1].replace(/'/g, "\\'")}')">
        Mark as Read
      </label>
    `;

    left.appendChild(card);

    const small = document.createElement("div");

    small.className = "card smallCard";

    small.innerHTML = `
      <strong>${update[1]}</strong><br>
      <small>${update[3]}</small>
    `;

    small.onclick = ()=>{
      left.innerHTML = "";
      left.appendChild(card);
    }

    right.appendChild(small);

  });
}

function markRead(el, updateTitle){
  if(!currentUser){
    alert('No user is logged in. Please login first.');
    // revert checkbox
    el.checked = !el.checked;
    return;
  }

  const isChecked = el.checked;
  
  // Update UI immediately (optimistic)
  el.parentElement.parentElement.classList.toggle("unread", !isChecked);
  el.parentElement.parentElement.classList.toggle("read", isChecked);

  // Send to Google Sheet
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'markRead',
      updateTitle: updateTitle,
      user: currentUser,
      readTime: timestamp
    })
  })
  .then(async res => {
    // read raw text first to avoid res.json() failing on empty/non-json
    const text = await res.text();
    let data = null;
    try{
      data = text ? JSON.parse(text) : null;
    }catch(err){
      throw new Error('Invalid JSON response from server: ' + text);
    }

    if(!res.ok || !data || !data.success){
      const msg = (data && data.error) ? data.error : ('Server error, status ' + res.status);
      throw new Error(msg);
    }

    // success: update local reads array
    if(isChecked){
      reads.push([updateTitle, currentUser, timestamp]);
    } else {
      reads = reads.filter(r => !(r[0] === updateTitle && r[1] === currentUser));
    }
  })
  .catch(error => {
    console.error('Error marking read:', error);
    alert('Failed to update status. Please try again.\n' + (error.message || ''));
    // Revert UI on error
    el.checked = !isChecked;
    el.parentElement.parentElement.classList.toggle("unread");
    el.parentElement.parentElement.classList.toggle("read");
  });
}

if(localStorage.getItem("theme") === "light"){
  document.body.classList.add("light");
}

// Validate stored user on load instead of trusting localStorage blindly
if(localStorage.getItem("user")){
  const stored = localStorage.getItem("user");
  // Verify against API
  fetch(API)
    .then(res => res.json())
    .then(data => {
      const usersRaw = data.users || [];
      const users = Array.isArray(usersRaw) && usersRaw.length && Array.isArray(usersRaw[0]) ? usersRaw.slice(1) : usersRaw;
      const normalize = v => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

      const found = users.find(u => {
        let candidate = '';
        if (Array.isArray(u)) {
          candidate = u[0];
        } else if (u && typeof u === 'object') {
          candidate = u.id ?? u.userId ?? u.employeeId ?? u[0] ?? '';
        } else {
          candidate = u;
        }
        return normalize(candidate) === normalize(stored);
      });

      if(found){
        currentUser = stored;
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        loadData();
      }else{
        // stored user invalid - clear and show login
        localStorage.removeItem("user");
        currentUser = null;
        document.getElementById("loginPage").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
      }
    })
    .catch(err => {
      console.error('Error validating stored user:', err);
      // fallback: clear stored user to avoid auto-login into invalid session
      localStorage.removeItem("user");
      currentUser = null;
    });
}
