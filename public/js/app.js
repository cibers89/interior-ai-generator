// Frontend logic: enhanced UI, toasts, dark mode, skeletons

const $ = (id) => document.getElementById(id);

function toast(msg, timeout = 3500) {
  const t = document.createElement('div');
  t.className = 'fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded shadow';
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

function setLoading(isLoading) {
  const btn = $('generate');
  if (isLoading) { btn.disabled = true; btn.innerText = 'Generating...'; }
  else { btn.disabled = false; btn.innerText = 'Generate Design + Images'; }
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'Request failed');
  }
  return res.json();
}

function renderText(text) {
  const out = $('resultText');
  out.innerHTML = `<h3 class="font-semibold">Desain</h3><pre class="whitespace-pre-wrap">${text}</pre>`;
}

function renderImages(images) {
  const container = $('images');
  container.innerHTML = '';
  images.forEach(src => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    const img = document.createElement('img');
    img.src = src;
    img.className = 'rounded';
    wrapper.appendChild(img);
    container.appendChild(wrapper);
  });
}

async function onGenerate() {
  const jenis = $('jenis').value;
  const luas = $('luas').value;
  const gaya = $('gaya').value;
  const warna = $('warna').value;
  const budget = $('budget').value;
  const khusus = $('khusus').value;
  const numImages = Math.min(4, Math.max(1, +$('num_images').value || 2));

  const promptText = `Buatkan konsep desain interior rinci untuk:\n- Jenis ruangan: ${jenis}\n- Luas: ${luas} m²\n- Gaya: ${gaya}\n- Warna dominan: ${warna}\n- Budget: ${budget}\n- Kebutuhan khusus: ${khusus}\n\nBerikan: Konsep desain, layout, furniture, material, estimasi biaya.`;

  const promptImage = `Interior design render of a ${jenis} in ${gaya} style, ${luas}m2, dominant colors ${warna}. Photorealistic interior photography, soft natural lighting, high detail.`;

  try {
    setLoading(true);
    renderText('Menghasilkan teks...');
    renderImages([]);

    const textResp = await postJson('/api/text', { prompt: promptText });
    renderText(textResp.text || 'No text returned');

    $('images').innerHTML = '<div class="small">Menghasilkan gambar, tunggu sebentar...</div>';
    const imgResp = await postJson('/api/image', { prompt: promptImage, num_images: numImages });

    if (imgResp.error) throw new Error(imgResp.error);
    renderImages(imgResp.images || []);
    toast('Selesai!');
  } catch (e) {
    console.error(e);
    renderText('Error: ' + (e.message || e));
    toast('Terjadi error: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

function setup() {
  $('generate').addEventListener('click', onGenerate);
  $('darkToggle').addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
  });
}

window.addEventListener('DOMContentLoaded', setup);
