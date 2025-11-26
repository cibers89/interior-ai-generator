/* D2F SUPER iOS PACK — Full app.js */

const PAGES = ["page-home","page-generate","page-history","page-profile"];

// Navigation system
function showPage(id){
  PAGES.forEach(p => document.getElementById(p).classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === id);
  });
}

// Tabbar
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=> showPage(btn.dataset.target));
});

// FAB
document.getElementById("fabGenerate").addEventListener("click",()=>{
  showPage("page-generate");
  window.scrollTo({ top:0, behavior:"smooth" });
});

// Buttons on Home
document.getElementById("btnOpenGenerate").addEventListener("click",()=> showPage("page-generate"));
document.getElementById("btnOpenHistory").addEventListener("click",()=>{
  showPage("page-history");
  populateHistory();
});

// Modal system
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const modalDownload = document.getElementById("modalDownload");

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click",e=>{ if(e.target===modal) closeModal(); });

function openModal(url){
  modal.classList.add("show");
  modalContent.innerHTML = `<img src="${url}" style="width:100%; border-radius:14px;" />`;
  modalDownload.href = url;
}
function closeModal(){
  modal.classList.remove("show");
  modalContent.innerHTML = "";
}

// Progress bar simulator
function simulateProgress(id, duration){
  const bar = document.getElementById(id);
  bar.style.width = "0%";
  let progress = 0;
  const step = 100 / (duration / 120);
  return setInterval(()=>{
    if(progress < 90){
      progress += step;
      bar.style.width = `${Math.round(progress)}%`;
    }
  },120);
}

// Save history
function saveToHistory(item){
  let list = JSON.parse(localStorage.getItem("d2f_history")||"[]");
  list.unshift(item);
  list = list.slice(0,50);
  localStorage.setItem("d2f_history", JSON.stringify(list));
}
function populateHistory(){
  const wrap = document.getElementById("historyList");
  wrap.innerHTML = "";
  const list = JSON.parse(localStorage.getItem("d2f_history")||"[]");

  if(list.length === 0){
    wrap.innerHTML = `<p class="muted">No saved designs yet.</p>`;
    return;
  }

  list.forEach(item =>{
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <img src="${item.images[0]}">
      <div>
        <strong>${item.roomType} • ${item.style}</strong>
        <div class="muted" style="font-size:13px">${item.date}</div>
      </div>`;
    div.addEventListener("click",()=> openModal(item.images[0]));
    wrap.appendChild(div);
  });
}
document.getElementById("clearHistory").addEventListener("click",()=>{
  localStorage.removeItem("d2f_history");
  populateHistory();
});

// API Workflow
document.getElementById("designForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const color = document.getElementById("color").value;
  const size = document.getElementById("size").value;
  const roomType = document.getElementById("roomType").value;
  const budget = document.getElementById("budget").value;
  const style = document.getElementById("style").value;


  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.innerHTML = `Loading <span class="spinner-btn"></span>`;
  btn.classList.add("loading");

  const loadingText = document.getElementById("loadingText");
  const loadingImages = document.getElementById("loadingImages");
  const textCard = document.getElementById("textCard");
  const imagesCard = document.getElementById("imagesCard");
  const textResult = document.getElementById("textResult");
  const imageGrid = document.getElementById("imageGrid");

  textResult.innerHTML = "";
  imageGrid.innerHTML = "";
  textCard.hidden = true;
  imagesCard.hidden = true;

  // TEXT GEN
  loadingText.hidden = false;
  const txtProg = simulateProgress("progressTextBar", 2300);

  const textRes = await fetch("/api/text", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      prompt:`Buatkan deskripsi interior untuk ${roomType} dengan warna ${color}, luas ${size}m2, gaya ${style}, dan budget ${budget} juta rupiah.`
    })
  }).then(r=>r.json()).catch(()=> ({text:"Gagal memuat deskripsi."}));

  clearInterval(txtProg);
  document.getElementById("progressTextBar").style.width = "100%";
  setTimeout(()=> loadingText.hidden = true, 300);

  textCard.hidden = false;
  textResult.innerHTML = textRes.text
    .split(". ")
    .map(s=>`<p>${s.trim()}.</p>`).join("");

  // IMAGE GEN
  loadingImages.hidden = false;
  const imgProg = simulateProgress("progressImageBar", 3500);

  const angles = [
    "corner view interior",
    "front angle interior",
    "slightly elevated angle",
    "side cinematic angle"
  ];
  const prompts = angles.map(a => `${style} ${roomType} interior, ${color} theme, ${a}`);

  const imgRes = await fetch("/api/image", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ prompts })
  }).then(r=>r.json()).catch(()=> ({images:[]}));

  clearInterval(imgProg);
  document.getElementById("progressImageBar").style.width = "100%";
  setTimeout(()=> loadingImages.hidden = true, 300);

  imagesCard.hidden = false;

  if(!imgRes.images || imgRes.images.length === 0){
    imageGrid.innerHTML = `<p class="muted">No images returned.</p>`;
  } else {
    imgRes.images.forEach(src=>{
      const img = document.createElement("img");
      img.src = src;
      img.addEventListener("click",()=> openModal(src));
      imageGrid.appendChild(img);
    });

    saveToHistory({
      date:new Date().toLocaleString(),
      color,size,roomType,budget,style,
      images:imgRes.images,
      text:textRes.text
    });
  }

  btn.disabled = false;
  btn.classList.remove("loading");
  btn.innerHTML = "Generate";
});

// INITIALIZATION
showPage("page-home");
