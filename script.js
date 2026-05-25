const API = "https://script.google.com/macros/s/AKfycbzNbXUntOMdd3fXlT-HqUumMMvHOrX47_O_wKNT1a8GKfumBBRJnbRjP6ok2Pxd41OrWQ/exec";

let updates = [];
let reads = [];

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

  localStorage.setItem("user", user);

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  loadData();
}

function logout(){
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

  [...updates].reverse().forEach(update=>{

    if(!update[1].toLowerCase().includes(search)) return;

    const card = document.createElement("div");

    card.className = "card unread";

    card.innerHTML = `
      <h2>${update[1]}</h2>
      <p>${update[2]}</p>
      <small>Date: ${update[3]}</small><br>
      <small>Priority: ${update[4]}</small><br><br>

      <label>
        <input class="checkbox" type="checkbox" onchange="markRead(this)">
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

function markRead(el){
  el.parentElement.parentElement.classList.remove("unread");
}

if(localStorage.getItem("theme") === "light"){
  document.body.classList.add("light");
}

if(localStorage.getItem("user")){
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  loadData();
}
