document.getElementById("designForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const color = document.getElementById("color").value;
  const size = document.getElementById("size").value;
  const roomType = document.getElementById("roomType").value;
  const budget = document.getElementById("budget").value;
  const style = document.getElementById("style").value;

  const textResult = document.getElementById("textResult");
  const imageGrid = document.getElementById("imageGrid");
  const loading = document.getElementById("loading");

  textResult.innerHTML = "";
  imageGrid.innerHTML = "";
  loading.style.display = "block";

  // Generate description from Groq
  const textResponse = await fetch("/api/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Buatkan deskripsi interior untuk ${roomType} dengan warna ${color}, luas ${size}m2, gaya ${style}, dengan budget sekitar ${budget} juta rupiah.`
    }),
  });

  const textData = await textResponse.json();
  textResult.innerHTML = `<p>${textData.text}</p>`;

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


  const imgRes = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompts }),
  });

  const imgData = await imgRes.json();

  loading.style.display = "none";

  if (!imgData.images) {
    imageGrid.innerHTML = "<p>Gagal membuat gambar.</p>";
    return;
  }

  imgData.images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    imageGrid.appendChild(img);
  });
});
