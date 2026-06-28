/* ═══════════════════════════════════════════════════════
   main.js — Single-Page WebAR Controller
   WebAR Portfolio — Firmas Habibi Cyber Red & 3D Gaze
   ═══════════════════════════════════════════════════════ */

// 1. Registrasi Komponen A-Frame Link Handler Kustom (Harus sebelum parsing DOM)
if (window.AFRAME) {
  AFRAME.registerComponent('link-handler', {
    schema: {
      url: { type: 'string' }
    },
    init: function () {
      const url = this.data.url;
      
      // Efek Hover warna merah ketika disorot kursor
      this.el.addEventListener('mouseenter', () => {
        this.el.setAttribute('material', 'color', '#ef4444');
        this.el.setAttribute('material', 'emissiveIntensity', '0.6');
      });
      
      this.el.addEventListener('mouseleave', () => {
        this.el.setAttribute('material', 'color', '#0c0d12');
        this.el.setAttribute('material', 'emissiveIntensity', '0.1');
      });

      // Memicu klik untuk membuka tautan baru
      this.el.addEventListener('click', () => {
        window.open(url, '_blank');
      });
    }
  });
}

let currentPattUrl = null;

document.addEventListener('DOMContentLoaded', async () => {

  // 2. Cek Ketersediaan Kamera
  const cameraOk = await checkCamera();
  if (!cameraOk) {
    const noCamPanel = document.getElementById('no-cam');
    if (noCamPanel) noCamPanel.style.display = 'flex';
    return;
  }

  // 3. Hubungkan Handler Pendeteksi Marker (A-Frame)
  bindMarkerEvents();

  // 4. Kontrol Popup Pratinjau Marker Real Madrid
  const btnMarker = document.getElementById('btn-marker-preview');
  const modal = document.getElementById('marker-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');

  if (btnMarker && modal) {
    btnMarker.addEventListener('click', () => {
      modal.classList.add('open');
    });
  }

  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  // 5. Logika Unggah Gambar PNG Kustom (Dikonversi ke .patt di Memori)
  const pattFileInput = document.getElementById('patt-file');
  if (pattFileInput) {
    pattFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        loadPattFile(file);
      } else {
        alert('Tipe file salah! Harap pilih berkas gambar (.png atau .jpg)');
      }
    });
  }
});

function loadPattFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.value || e.target.result;
    
    if (window.MarkerCreator && window.MarkerCreator.ArPatternFile) {
      window.MarkerCreator.ArPatternFile.encodeImageURL(dataUrl, (patternString) => {
        const blob = new Blob([patternString], { type: 'text/plain' });
        currentPattUrl = URL.createObjectURL(blob);

        // Tampilkan notifikasi singkat berkas terpasang
        const toast = document.getElementById('patt-toast');
        if (toast) {
          toast.classList.add('active');
          setTimeout(() => toast.classList.remove('active'), 3000);
        }

        // Bangun ulang scene kamera AR untuk memuat pola kustom
        rebuildARScene();
      });
    } else {
      alert("Gagal memuat konverter marker. Pastikan koneksi internet Anda aktif.");
    }
  };
  reader.readAsDataURL(file);
}

function rebuildARScene() {
  const container = document.getElementById('ar-viewport-container');
  if (!container) return;

  // Hapus scene A-Frame lama
  const oldScene = document.querySelector('a-scene');
  if (oldScene) {
    if (window.AFRAME && Array.isArray(AFRAME.scenes)) {
      const idx = AFRAME.scenes.indexOf(oldScene);
      if (idx !== -1) AFRAME.scenes.splice(idx, 1);
    }
    oldScene.remove();
  }

  // Buat scene A-Frame baru dengan pola custom & kursor bulat gaze
  const scene = document.createElement('a-scene');
  scene.setAttribute('embedded', '');
  scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false;');
  scene.setAttribute('vr-mode-ui', 'enabled: false');
  scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; antialias: true;');
  scene.style.cssText = 'position:absolute;inset:0;';

  scene.innerHTML = `
    <a-assets>
      <img id="profile-pic" src="profile.jpg" crossorigin="anonymous">
    </a-assets>

    <a-marker id="hiro-marker" type="pattern" url="${currentPattUrl}">
      
      <!-- Glowing Ring (Alas Merah) -->
      <a-torus
        position="0 0.05 0"
        radius="0.65"
        radius-tubular="0.015"
        rotation="90 0 0"
        material="color:#ef4444; opacity:0.8; transparent:true; emissive:#ef4444; emissiveIntensity:1.5;"
        animation="property:rotation; from:90 0 0; to:90 360 0; loop:true; dur:4000; easing:linear;">
      </a-torus>

      <!-- Outer Ring (Rotasi Terbalik) -->
      <a-torus
        position="0 0.05 0"
        radius="0.8"
        radius-tubular="0.01"
        rotation="90 0 0"
        material="color:#7f1d1d; opacity:0.5; transparent:true; wireframe:true;"
        animation="property:rotation; from:90 360 0; to:90 0 0; loop:true; dur:6000; easing:linear;">
      </a-torus>

      <!-- Virtual Card Plane (Melayang Leaning back & Hover) -->
      <a-entity
        position="0 0.5 0"
        rotation="-60 0 0"
        animation="property:position; from:0 0.45 0; to:0 0.58 0; dir:alternate; loop:true; dur:2000; easing:easeInOutSine;"
        animation__rot="property:rotation; from:-60 -8 0; to:-60 8 0; dir:alternate; loop:true; dur:3200; easing:easeInOutSine;"
      >
        <!-- Background Kartu Hitam -->
        <a-box
          position="0 0 0"
          width="2.5"
          height="1.3"
          depth="0.02"
          material="color:#050508; opacity:0.95; transparent:true; roughness:0.8; metalness:0.2;"
        >
          <!-- Border glowing merah -->
          <a-box
            position="0 0 0"
            width="2.52"
            height="1.32"
            depth="0.025"
            material="color:#ef4444; wireframe:true; opacity:0.8; emissive:#ef4444; emissiveIntensity:0.5;"
          ></a-box>
        </a-box>

        <!-- Sisi Kiri: Frame Foto Profil -->
        <a-box
          position="-0.78 -0.05 0.015"
          width="0.66"
          height="0.86"
          depth="0.01"
          material="color:#ef4444; emissive:#ef4444; emissiveIntensity:0.3;"
        >
          <a-image
            src="#profile-pic"
            width="0.62"
            height="0.82"
            position="0 0 0.01"
          ></a-image>
        </a-box>

        <!-- Sisi Kanan: Teks Biodata Kustom -->
        <!-- Header -->
        <a-text
          value="// BIODATA"
          position="-0.38 0.48 0.02"
          color="#ef4444"
          width="3.2"
          font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
        ></a-text>
        <a-text
          value="ID_FRM205"
          position="0.52 0.48 0.02"
          color="#ef4444"
          width="2.6"
          font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
          align="right"
        ></a-text>
        <a-plane
          position="0.22 0.42 0.02"
          width="1.25"
          height="0.006"
          material="color:#ef4444; opacity:0.6;"
        ></a-plane>

        <!-- Row 1: Full Name -->
        <a-text value="FULL NAME //" position="-0.38 0.22 0.02" color="#ef4444" width="2.1" font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"></a-text>
        <a-text value="FIRMAS HABIBI" position="0.18 0.22 0.02" color="#ffffff" width="2.1" font="https://cdn.aframe.io/fonts/DejaVu-sdf.fnt"></a-text>

        <!-- Row 2: Role -->
        <a-text value="ROLE //" position="-0.38 0.07 0.02" color="#ef4444" width="2.1" font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"></a-text>
        <a-text value="FULLSTACK ENGINEER" position="0.18 0.07 0.02" color="#ffffff" width="2.1" font="https://cdn.aframe.io/fonts/DejaVu-sdf.fnt"></a-text>

        <!-- Row 3: Core Stack -->
        <a-text value="CORE STACK //" position="-0.38 -0.08 0.02" color="#ef4444" width="2.1" font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"></a-text>
        <a-text value="REACT * NODE.JS" position="0.18 -0.08 0.02" color="#ffffff" width="2.1" font="https://cdn.aframe.io/fonts/DejaVu-sdf.fnt"></a-text>

        <!-- Row 4: Location -->
        <a-text value="LOCATION //" position="-0.38 -0.23 0.02" color="#ef4444" width="2.1" font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"></a-text>
        <a-text value="INDONESIA * SUMATERA UTARA" position="0.18 -0.23 0.02" color="#ffffff" width="1.9" font="https://cdn.aframe.io/fonts/DejaVu-sdf.fnt"></a-text>

        <!-- Row 5: Focus -->
        <a-text value="FOCUS //" position="-0.38 -0.38 0.02" color="#ef4444" width="2.1" font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"></a-text>
        <a-text value="HIGH-PERFORMANCE SYSTEMS &\nINTERACTIVE APPS" position="0.18 -0.38 0.02" color="#ffffff" width="1.7" line-height="20" font="https://cdn.aframe.io/fonts/DejaVu-sdf.fnt"></a-text>

        <!-- 3D Clickable Buttons (Gaze 3 Detik) -->
        <!-- Button 1: Portfolio -->
        <a-box
          class="clickable"
          link-handler="url: https://www.frmshbi.dev/projects"
          position="-0.7 -0.85 0.02"
          width="0.55"
          height="0.2"
          depth="0.04"
          material="color: #0c0d12; roughness: 0.5; metalness: 0.5; emissive: #ef4444; emissiveIntensity: 0.1;"
        >
          <a-box
            position="0 0 0"
            width="0.57"
            height="0.22"
            depth="0.042"
            material="color: #ef4444; wireframe: true; opacity: 0.5;"
          ></a-box>
          <a-text
            value="Portfolio"
            align="center"
            position="0 0 0.025"
            color="#ffffff"
            width="2.0"
            font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
          ></a-text>
        </a-box>

        <!-- Button 2: GitHub -->
        <a-box
          class="clickable"
          link-handler="url: https://github.com/firmashabibii"
          position="0 -0.85 0.02"
          width="0.55"
          height="0.2"
          depth="0.04"
          material="color: #0c0d12; roughness: 0.5; metalness: 0.5; emissive: #ef4444; emissiveIntensity: 0.1;"
        >
          <a-box
            position="0 0 0"
            width="0.57"
            height="0.22"
            depth="0.042"
            material="color: #ef4444; wireframe: true; opacity: 0.5;"
          ></a-box>
          <a-text
            value="GitHub"
            align="center"
            position="0 0 0.025"
            color="#ffffff"
            width="2.0"
            font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
          ></a-text>
        </a-box>

        <!-- Button 3: Instagram -->
        <a-box
          class="clickable"
          link-handler="url: https://www.instagram.com/frmshbi/?hl=en"
          position="0.7 -0.85 0.02"
          width="0.55"
          height="0.2"
          depth="0.04"
          material="color: #0c0d12; roughness: 0.5; metalness: 0.5; emissive: #ef4444; emissiveIntensity: 0.1;"
        >
          <a-box
            position="0 0 0"
            width="0.57"
            height="0.22"
            depth="0.042"
            material="color: #ef4444; wireframe: true; opacity: 0.5;"
          ></a-box>
          <a-text
            value="Instagram"
            align="center"
            position="0 0 0.025"
            color="#ffffff"
            width="2.0"
            font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
          ></a-text>
        </a-box>

      </a-entity>

      <!-- Floating Tech Core (Red) -->
      <a-octahedron
        position="0 1.1 0"
        radius="0.14"
        material="color:#ef4444; metalness:0.8; roughness:0.2; emissive:#ef4444; emissiveIntensity:0.8;"
        animation="property:position; from:0 1.05 0; to:0 1.25 0; dir:alternate; loop:true; dur:1200; easing:easeInOutSine;"
        animation__rot="property:rotation; to:360 360 360; loop:true; dur:4000; easing:linear;">
      </a-octahedron>

      <!-- Satellites (Red) -->
      <a-sphere position=" 0.7 0.6  0.7" radius="0.045" material="color:#ef4444; emissive:#ef4444; emissiveIntensity:0.4;" animation="property:position; from:0.7 0.6 0.7; to:0.7 0.9 0.7; dir:alternate; loop:true; dur:900;"></a-sphere>
      <a-sphere position="-0.7 0.6 -0.7" radius="0.045" material="color:#991b1b; emissive:#991b1b; emissiveIntensity:0.4;" animation="property:position; from:-0.7 0.6 -0.7; to:-0.7 0.9 -0.7; dir:alternate; loop:true; dur:1100;"></a-sphere>

    </a-marker>
    
    <!-- Camera dengan Raycaster & Kursor Bulat Merah (Gaze 3 Detik) -->
    <a-entity camera>
      <a-cursor
        id="fuse-cursor"
        fuse="true"
        fuse-timeout="3000"
        raycaster="objects: .clickable"
        geometry="primitive: ring; radiusOuter: 0.03; radiusInner: 0.02;"
        material="color: #ef4444; shader: flat; opacity: 0.8;"
        position="0 0 -1"
        animation__fusing="property: scale; startEvents: fusing; easing: easeInQuad; dur: 3000; from: 1 1 1; to: 0.1 0.1 0.1;"
        animation__mouseleave="property: scale; startEvents: mouseleave; easing: easeInQuad; dur: 100; to: 1 1 1;"
      ></a-cursor>
    </a-entity>
  `;

  container.appendChild(scene);
  setARStatus('Mencari kustom marker...', 'searching');

  setTimeout(() => {
    bindMarkerEvents();
  }, 1000);
}

function bindMarkerEvents() {
  const marker = document.getElementById('hiro-marker');
  const statusCard = document.getElementById('ar-status');
  const statusMsg = statusCard ? statusCard.querySelector('.ar-msg') : null;

  if (!marker) return;

  marker.addEventListener('markerFound', () => {
    if (statusCard) statusCard.classList.add('found');
    if (statusMsg) statusMsg.textContent = 'Kartu Virtual Aktif! ✓';
  });

  marker.addEventListener('markerLost', () => {
    if (statusCard) statusCard.classList.remove('found');
    if (statusMsg) {
      statusMsg.textContent = currentPattUrl ? 'Mencari kustom marker...' : 'Mencari marker Hiro...';
    }
  });
}
