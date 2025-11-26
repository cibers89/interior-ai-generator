function simulateProgress(barId, duration = 2500) {
  const bar = document.getElementById(barId);
  bar.style.width = "0%";

  let progress = 0;
  const step = 100 / (duration / 120);

  return setInterval(() => {
    if (progress < 90) {
      progress += step;
      bar.style.width = progress + "%";
    }
  }, 120);
}

document.getElementById("designForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const color = document.getElementById("color").value;
  const size = document.getElementById("size").value;
  const roomType = document.getElementById("roomType").value;
  const budget = document.getElementById("budget").value;
  const style = document.getElementById("style").value;

  const textResult = document.getElementById("textResult");
  const imageGrid = document.getElementById("imageGrid");

  const loadingText = document.getElementById("loadingText");
  const loadingImages = document.getElementById("loadingImages");

  const btn = document.getElementById("generateBtn");

  textResult.innerHTML = "";
  imageGrid.innerHTML = "";

  // BUTTON STATE
  btn.disabled = true;
  btn.classList.add("loading");
  btn.innerHTML = `Loading <div class="spinner-btn"></div>`;

  // START TEXT LOADING
  loadingText.style.display = "block";
  const textProgress = simulateProgress("progressTextBar", 2500);

  // TEXT API REQUEST
  const textResponse = await fetch("/api/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Buatkan deskripsi interior untuk ${roomType} dengan warna ${color}, luas ${size}m2, gaya ${style}, dan budget ${budget} juta rupiah.`
    }),
  });

  const textData = await textResponse.json();

  // STOP TEXT LOADING
  clearInterval(textProgress);
  document.getElementById("progressTextBar").style.width = "100%";
  setTimeout(() => {
    loadingText.style.display = "none";
  }, 300);

  // FORMAT TEXT
  textResult.innerHTML = textData.text
    .split(". ")
    .map((sentence) => `<p>${sentence.trim()}.</p>`)
    .join("");

  // START IMAGE LOADING
  loadingImages.style.display = "block";
  const imgProgress = simulateProgress("progressImageBar", 3500);

  const angles = [
    "room view from the corner",
    "front view of the room",
    "slightly top side view",
    "side cinematic view"
  ];

  const prompts = angles.map(
    (angle) =>
      `${style} ${roomType} interior, ${color} theme, ${angle}`
  );

  const imgRes = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompts }),
  });

  const imgData = await imgRes.json();

  // STOP IMAGE LOADING
  clearInterval(imgProgress);
  document.getElementById("progressImageBar").style.width = "100%";
  setTimeout(() => {
    loadingImages.style.display = "none";
  }, 300);

  // RENDER IMAGES
  if (!imgData.images) {
    imageGrid.innerHTML = "<p>Gagal membuat gambar.</p>";
  } else {
    imgData.images.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      imageGrid.appendChild(img);
    });
  }

  // RESTORE BUTTON
  btn.disabled = false;
  btn.classList.remove("loading");
  btn.innerHTML = `Generate Design`;
});
