const sharp = require('sharp');
const path = require('path');

const outDir = path.join(__dirname, '../public');

async function generateIcon(size, outputPath) {
    const s = size;
    const radius = Math.round(s * 0.18);

    // Центральный человек — низ головы: cHy+cHr = 0.36+0.105 = 0.465
    const cHx = s * 0.50, cHy = s * 0.36, cHr = s * 0.105;
    const cB = `M ${s*0.17},${s*0.84} Q ${s*0.17},${s*0.49} ${s*0.50},${s*0.49} Q ${s*0.83},${s*0.49} ${s*0.83},${s*0.84}`;

    // Левый человек — низ головы: 0.41+0.08 = 0.49
    const lHx = s * 0.27, lHy = s * 0.41, lHr = s * 0.08;
    const lB = `M ${s*0.03},${s*0.86} Q ${s*0.03},${s*0.54} ${s*0.27},${s*0.54} Q ${s*0.51},${s*0.54} ${s*0.51},${s*0.86}`;

    // Правый человек — низ головы: 0.41+0.08 = 0.49
    const rHx = s * 0.73, rHy = s * 0.41, rHr = s * 0.08;
    const rB = `M ${s*0.49},${s*0.86} Q ${s*0.49},${s*0.54} ${s*0.73},${s*0.54} Q ${s*0.97},${s*0.54} ${s*0.97},${s*0.86}`;

    const svg = `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c1b4a"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <clipPath id="clip">
      <rect width="${s}" height="${s}" rx="${radius}" ry="${radius}"/>
    </clipPath>
  </defs>
  <rect width="${s}" height="${s}" rx="${radius}" ry="${radius}" fill="url(#grad)"/>
  <g clip-path="url(#clip)">
    <!-- Левый человек -->
    <circle cx="${lHx}" cy="${lHy}" r="${lHr}" fill="rgba(255,255,255,0.78)"/>
    <path d="${lB}" fill="rgba(255,255,255,0.78)"/>
    <!-- Правый человек -->
    <circle cx="${rHx}" cy="${rHy}" r="${rHr}" fill="rgba(255,255,255,0.78)"/>
    <path d="${rB}" fill="rgba(255,255,255,0.78)"/>
    <!-- Центральный человек (поверх) -->
    <circle cx="${cHx}" cy="${cHy}" r="${cHr}" fill="white"/>
    <path d="${cB}" fill="white"/>
  </g>
</svg>`;

    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    console.log(`Generated ${path.basename(outputPath)} (${size}x${size})`);
}

async function generate() {
    await generateIcon(192, path.join(outDir, 'logo192.png'));
    await generateIcon(512, path.join(outDir, 'logo512.png'));
    console.log('PWA icons generated successfully');
}

generate().catch((err) => {
    console.error('Failed to generate PWA icons:', err);
    process.exit(1);
});
