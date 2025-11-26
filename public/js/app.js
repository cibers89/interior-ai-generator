document.getElementById("designForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const color = document.getElementById("color").value;
  const size = document.getElementById("size").value;
  const roomType = document.getElementById("roomType").value;
  const budget = document.getElementById("budget").value;
  const style = document.getElementById("style").value;

  const textResult = document.getElementById("textResult");
  const imageGrid = document.getElementById("imageGrid");

  // >>> LOADER ELEMENTS
  const loadingText = document.getElementById("loadingText");
  const loadingImages = document.getElementById("loadingImages");

  // Clear UI
  textResult.innerHTML = "";
  imageGrid.innerHTML = "";
  loadingText.style.display = "block";
  loadingImages.style.display = "none";

  // 1) Generate description from Groq
  const textResponse = await fetch("/api/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Buatkan deskripsi interior untuk ${roomType} dengan warna ${color}, luas ${size}m2, gaya ${style}, dan budget ${budget} juta rupiah.`
    }),
  });

  const textData = await textResponse.json();
  loadingText.style.display = "none";

  // Format text lebih rapih
  textResult.innerHTML = textData.text
    .split(". ")
    .map((sentence) => `<p>${sentence.trim()}.</p>`)
    .join("");

  // 2) Start image loader
  loadingImages.style.display = "block";

  // CAMERA ANGLES for 4 images
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

  // 3) Image API
  const imgRes = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompts }),
  });

  const imgData = await imgRes.json();
  loadingImages.style.display = "none";

  // 4) Render images
  if (!imgData.images) {
    imageGrid.innerHTML = "<p>Terjadi kesalahan saat membuat gambar.</p>";
    return;
  }

  imgData.images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    imageGrid.appendChild(img);
  });
});
