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

  // === BUTTON ELEMENT ===
  const btn = document.getElementById("generateBtn");

  // CLEAR UI
  textResult.innerHTML = "";
  imageGrid.innerHTML = "";

  // === ACTIVATE BUTTON LOADING STATE ===
  btn.disabled = true;
  btn.classList.add("loading");
  btn.innerHTML = `Loading <div class="spinner-btn"></div>`;

  loadingText.style.display = "block";
  loadingImages.style.display = "none";

  // ==== TEXT REQUEST (GROQ) ====
  const textResponse = await fetch("/api/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Buatkan deskripsi interior untuk ${roomType} dengan warna ${color}, luas ${size}m2, gaya ${style}, dan budget ${budget} juta rupiah.`
    }),
  });

  const textData = await textResponse.json();
  loadingText.style.display = "none";

  textResult.innerHTML = textData.text
    .split(". ")
    .map((sentence) => `<p>${sentence.trim()}.</p>`)
    .join("");

  // ==== IMAGE LOADING ====
  loadingImages.style.display = "block";

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
  loadingImages.style.display = "none";

  if (!imgData.images) {
    imageGrid.innerHTML = "<p>Gagal membuat gambar.</p>";
  } else {
    imgData.images.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      imageGrid.appendChild(img);
    });
  }

  // === RESTORE BUTTON STATE ===
  btn.disabled = false;
  btn.classList.remove("loading");
  btn.innerHTML = `Generate Design`;
});
