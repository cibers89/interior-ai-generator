/* D2F iOS SUPER PACK — app.js
   - tab navigation
   - generate flow (text + images)
   - progress simulation
   - modal preview + download
   - history stored in localStorage
*/

const PAGES = ["page-home","page-generate","page-history","page-profile"];
const MODELS = []; // placeholder if needed

// UTIL: show page
function showPage(id){
  PAGES.forEach(p => document.getElementById(p).classList.remove("active"));
  document.getElementById(id).classList.add("active");
  // update tabs
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.target === id));
}

// TABBAR events
document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=> showPage(btn.dataset.target));
});

// FAB and header quick open
document.getElementById("fabGenerate").addEventListener("click", ()=> {
  showPage("page-generate");
  window.scrollTo({ top: 0, behavior: "smooth" });
});
document.getElementById("btnOpenGenerate").addEventListener("click", ()=> {
  showPage("page-generate");
});

// history opener
document.getElementById("btnOpenHistory").addEventListener("click", ()=> {
  showPage("page-history");
  populateHistory();
});

// toggle dark mode from profile
const toggleDark = document.getElementById("toggleDark");
toggleDark.addEventListener("change", (e)=>{
  document.documentElement.style.background = e.target.checked ? "#0f1724":"#eef4ff";
  // quick visual: invert accent maybe
});

// modal controls
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const modalDownload = document.getElementById("modalDownload");
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e)=> { if(e.target === modal) closeModal(); });

function openModal(imageDataUrl){
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  modalContent.innerHTML = `<img src="${imageDataUrl}" style="width:100%; border-radius:12px; display:block;" alt="Preview">`;
  modalDownload.href = imageDataUrl;
  modalDownload.setAttribute("download","design.png");
}
function closeModal(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  modalContent.innerHTML = "";
}

// progress simulator
function simulateProgress(barId, duration=2500){
  const bar = document.getElementById(barId);
  if(!bar) return null;
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

// history (localStorage)
function saveToHistory(item){
  try{
    const list = JSON.parse(localStorage.getItem("d2f_history")||"[]");
    list.unshift(item);
    // keep 40 items
    localStorage.setItem("d2f_history", JSON.stringify(list.slice(0,40)));
  }catch(e){}
}
function populateHistory(){
  const wrap = document.getElementById("historyList");
  wrap.innerHTML = "";
  const list = JSON.parse(localStorage.getItem("d2f_history")||"[]");
  if(!list.length){ wrap.innerHTML = `<div class="muted">No saved designs yet.</div>`; return; }
  list.forEach((it, idx)=>{
    const el = document.createElement("div");
    el.className = "history-item";
    const img = document.createElement("img");
    img.src = it.images?.[0] || "";
    const meta = document.createElement("div");
    meta.innerHTML = `<div style="font-weight:700">${it.roomType} • ${it.style}</div><div class="muted" style="font-size:13px;margin-top:6px">${it.date}</div>`;
    el.append(img, meta);
    el.addEventListener("click", ()=> {
      // open modal with first image and details
      openModal(it.images?.[0]);
    });
    wrap.appendChild(el);
  });
}
document.getElementById("clearHistory").addEventListener("click", ()=>{
  localStorage.removeItem("d2f_history");
  populateHistory();
});

// Design form handling (text + pollinations images)
document.getElementById("designForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  // read inputs
  const color = document.getElementById("color").value.trim();
  const size = document.getElementById("size").value.trim();
  const roomType = document.getElementById("roomType").value.trim();
  const budget = document.getElementById("budget").value;
  const style = document.getElementById("style").value;

  // ui refs
  const loadingText = document.getElementById("loadingText");
  const loadingImages = document.getElementById("loadingImages");
  const textCard = document.getElementById("textCard");
  const imagesCard = document.getElementById("imagesCard");
  const textResult = document.getElementById("textResult");
  const imageGrid = document.getElementById("imageGrid");
  const btn = document.getElementById("generateBtn");

  // clear
  textResult.innerHTML=""; imageGrid.innerHTML=""; textCard.hidden=true; imagesCard.hidden=true;

  // button loading state
  btn.disabled = true;
  btn.classList.add("loading");
  btn.innerHTML = `Loading <span class="spinner-btn"></span>`;

  // start text progress
  loadingText.hidden = false;
  const txtProg = simulateProgress("progressTextBar", 2200);

  // call /api/text
  let textData = { text: "" };
  try{
    const r = await fetch("/api/text", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ prompt: `Buatkan deskripsi interior untuk ${roomType} dengan warna ${color}, luas ${size}m2, gaya ${style}, dan budget ${budget} juta rupiah.` })
    });
    textData = await r.json();
  }catch(err){
    textData = { text: "Gagal membuat deskripsi (network error)." };
    console.error(err);
  }

  // finish text progress
  clearInterval(txtProg);
  document.getElementById("progressTextBar").style.width = "100%";
  setTimeout(()=>{ loadingText.hidden = true; }, 300);

  // format text paragraphs cleanly
  textCard.hidden = false;
  const formatted = (textData.text || "").split(/\.\s+/).filter(Boolean).map(s=>`<p>${s.trim()}.</p>`).join("");
  textResult.innerHTML = formatted || "<p class='muted'>No description returned.</p>";

  // images: start
  loadingImages.hidden = false;
  imagesCard.hidden = true;
  const imgProg = simulateProgress("progressImageBar", 3600);

  // create 4 angle prompts (short to avoid pollinations 400)
  const angles = [
    "corner view, wide angle",
    "front view, eye-level",
    "slightly elevated view",
    "side cinematic view"
  ];
  const prompts = angles.map(a => `${style} ${roomType} interior, ${color} theme, ${a}`);

  // call /api/image (expects prompts array, Pollinations handler will simplify)
  let imgData = { images: [] };
  try {
    const r = await fetch("/api/image", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ prompts })
    });
    imgData = await r.json();
  } catch(err) {
    console.error("Image fetch failed", err);
  }

  // finish image progress
  clearInterval(imgProg);
  document.getElementById("progressImageBar").style.width = "100%";
  setTimeout(()=>{ loadingImages.hidden = true; }, 300);

  // render images
  imagesCard.hidden = false;
  if(!imgData.images || !imgData.images.length){
    imageGrid.innerHTML = `<div class="muted">No images returned.</div>`;
  } else {
    imageGrid.innerHTML = "";
    imgData.images.forEach((src, idx)=>{
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Design ${idx+1}`;
      img.addEventListener("click", ()=> openModal(src));
      imageGrid.appendChild(img);
    });
    // save to history
    saveToHistory({
      date: new Date().toLocaleString(),
      roomType, style, color, size, budget,
      images: imgData.images,
      text: textData.text
    });
  }

  // restore button
  btn.disabled = false;
  btn.classList.remove("loading");
  btn.innerHTML = `Generate Design`;
});

// initial setup
(function init(){
  // default page
  showPage("page-home");
  // wire profile dark toggle state
  const darkChk = document.getElementById("toggleDark");
  darkChk.checked = false;
  // populate history
  populateHistory();
})();
