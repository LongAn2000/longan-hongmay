// Local design reference assets. Run manually only when refreshing sample images.
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'public', 'assets');
await mkdir(root, { recursive: true });
const origin = 'https://assets.motdoi.com.vn';
const photos = {
  hero: '1c62e521-fe26-4410-8665-2592a0e23827',
  invitation: '61b026ec-5f64-4454-93ea-8c066339f7e7',
  couple: '1cbf71cb-7be9-4b6e-8418-4717f4cc1fba',
  groom: 'a2a65ed1-999d-4d49-b06f-53962b5294d6',
  bride: '8b9203d9-02ec-4e2b-ab9a-a03f09819827',
  celebration: 'd21cfcab-eb8b-4394-894e-8f92c89dc538',
  calendar: '40e6432f-e85b-402b-a1f0-b48c47973aff',
  guestbook: '7add6f2d-0333-4865-815b-052e2d0a7ef5',
  footer: '7b4ef266-f5a4-447c-8f56-90b271069c12',
  share: '16612240-afc0-4f02-a66c-f7d78c458ccb',
};
const gallery = [
  '156bcfe7-60ec-418a-8f14-c20f52376d7a', '1c99c90d-3031-4bfa-9511-f21e51b931d5',
  'dd0b05b9-d855-4f9d-8ad3-2a1c0dcecff0', '7ee72312-5240-4aa2-b521-b686ae8a2e9f',
  '20f80f7c-e76d-4e14-a049-dc3f76f08c5f', '75bf51fc-8cd4-4310-b7bc-0f2b587edfcb',
  '002e1610-51d7-4f3d-b243-198b84ea67c5', '88c7c4ea-faf7-4642-95e7-1cb6fdccd315',
  '3be116aa-33df-4945-8e14-c1abcff1fb2e', '54413f0d-b3bf-45bc-8171-c007ca1dd3fa',
  '63f1a1bc-7bfd-4f66-b61a-dfbea5d71555', '07bbdac6-a2c9-4810-a688-c6b89de439fa',
  '39a39d1c-7202-4ab6-885d-f271878c066f', '7fde7d66-093f-4cf7-a9fd-e903a5b14333',
  '6314410b-a2ea-4813-b84f-50aafa791243', '946e74ed-c67e-4478-b362-785d6ca50352',
];
const jobs = Object.entries(photos).map(([name, id]) => [`${name}.jpg`, `${origin}/images/${id}.jpg`]);
gallery.forEach((id, index) => jobs.push([`album-${index + 1}.jpg`, `${origin}/images/${id}.jpg`]));
for (const name of ['paper2', 'a-peace-of-paper', 'red-line-flower-2', 'red-line-flower-3', 'red-line-flower-4', 'red-line-flower-7', 'sealing-wax-red']) {
  jobs.push([`${name}.png`, `${origin}/static/images/${name}.png`]);
}
jobs.push(['music.mp3', 'https://motdoi.b-cdn.net/audio/0fc8e555-7b49-4088-b841-6c5d974bc357.mp3']);

// Keep the original font subsets, including Vietnamese, available offline.
let fontCss = '';
for (const chunk of ['95dd09d9b61ef748', '3a9bf9a09d6bd724', '9fa24d30f49d67d6']) {
  const response = await fetch(`https://motdoi.com.vn/_next/static/chunks/${chunk}.css`);
  if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
  const css = await response.text();
  for (const rule of css.matchAll(/@font-face\{[^}]+\}/g)) {
    if (!/Playfair|Cormorant|Great.?Vibes/i.test(rule[0])) continue;
    let localRule = rule[0].replace(/font-family:[^;]+/, match => {
      if (/Fallback/i.test(match)) return match;
      if (/playfair/i.test(match)) return 'font-family:WeddingSerif';
      if (/cormorant/i.test(match)) return 'font-family:WeddingBody';
      return 'font-family:WeddingScript';
    });
    localRule = localRule.replace(/url\(([^)]+)\)/g, (match, url) => {
      const clean = url.replace(/["']/g, '');
      const resolved = new URL(clean, 'https://motdoi.com.vn/_next/static/chunks/main.css');
      const file = path.basename(resolved.pathname);
      if (!jobs.some(job => job[0] === file)) jobs.push([file, resolved.href]);
      return `url('/assets/${file}')`;
    });
    fontCss += localRule + '\n';
  }
}
await writeFile(path.join(root, 'fonts.css'), fontCss);
let done = 0;
async function worker() {
  while (jobs.length) {
    const [name, url] = jobs.shift();
    try { await access(path.join(root, name)); continue; } catch { /* Download missing assets. */ }
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
        if (!response.ok) throw new Error(`${response.status}: ${name}`);
        await writeFile(path.join(root, name), Buffer.from(await response.arrayBuffer()));
        done++;
        lastError = null;
        break;
      } catch (error) { lastError = error; }
    }
    if (lastError) throw lastError;
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`Downloaded ${done} sample assets and local fonts.`);
