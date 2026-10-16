// Curation helper that runs inside GitHub Actions (which has open internet access).
// Reads scripts/commons/job.json, queries the Wikimedia Commons API, and writes
// results (JSON metadata + contact sheets + normalized images) to ./curation-out.
// The output is pushed to the `ci/curate-out` branch so it can be reviewed by hand.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'RealOrRenderedCuration/1.0 (https://github.com/abkytomar-spec/AI_vs_HUMAN; educational game)';
const OUT = path.resolve('curation-out');
const EXT_FIELDS = [
  'LicenseShortName', 'LicenseUrl', 'Artist', 'Credit', 'ImageDescription', 'DateTimeOriginal',
  'Categories', 'AttributionRequired', 'UsageTerms', 'ObjectName', 'Copyrighted',
].join('|');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params, attempt = 0) {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    if (attempt < 4) { await sleep(1500 * (attempt + 1)); return api(params, attempt + 1); }
    throw new Error(`API ${res.status} for ${url}`);
  }
  return res.json();
}

async function download(url, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    if (attempt < 4) { await sleep(2000 * (attempt + 1)); return download(url, attempt + 1); }
    throw new Error(`Download ${res.status} for ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const strip = (html) => (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function summarize(page) {
  const ii = page.imageinfo?.[0];
  if (!ii) return null;
  const em = ii.extmetadata ?? {};
  const cm = Object.fromEntries((ii.commonmetadata ?? []).map((m) => [m.name, m.value]));
  return {
    title: page.title,
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    width: ii.width, height: ii.height, mime: ii.mime, size: ii.size,
    url: ii.url, thumb: ii.thumburl ?? null,
    uploaded: ii.timestamp, uploader: ii.user,
    license: em.LicenseShortName?.value ?? null,
    licenseUrl: em.LicenseUrl?.value ?? null,
    artist: strip(em.Artist?.value),
    credit: strip(em.Credit?.value),
    description: strip(em.ImageDescription?.value).slice(0, 400),
    dateOriginal: strip(em.DateTimeOriginal?.value),
    categories: (em.Categories?.value ?? '').split('|').filter(Boolean),
    attributionRequired: em.AttributionRequired?.value ?? null,
    exif: { make: cm.Make ?? null, model: cm.Model ?? null, dateTimeOriginal: cm.DateTimeOriginal ?? null, software: cm.Software ?? null },
  };
}

const iiParams = (thumbWidth = 330) => ({
  prop: 'imageinfo',
  iiprop: 'url|size|mime|extmetadata|timestamp|user|commonmetadata',
  iiurlwidth: thumbWidth,
  iiextmetadatafilter: EXT_FIELDS,
});

async function collect(generatorParams, limit) {
  const results = [];
  let cont = {};
  while (results.length < limit) {
    const data = await api({ action: 'query', ...generatorParams, ...iiParams(), ...cont });
    const pages = data.query?.pages ?? [];
    for (const p of pages) { const s = summarize(p); if (s) results.push(s); }
    if (!data.continue) break;
    cont = data.continue;
    await sleep(300);
  }
  return results.slice(0, limit);
}

async function subcats(root, depth, seen = new Set()) {
  if (depth < 0 || seen.has(root)) return [];
  seen.add(root);
  const out = [];
  let cont = {};
  for (;;) {
    const data = await api({ action: 'query', generator: 'categorymembers', gcmtitle: root, gcmtype: 'subcat', gcmlimit: 500, prop: 'categoryinfo', ...cont });
    for (const p of data.query?.pages ?? []) {
      out.push({ title: p.title, parent: root, files: p.categoryinfo?.files ?? 0, subcats: p.categoryinfo?.subcats ?? 0 });
    }
    if (!data.continue) break;
    cont = data.continue;
  }
  const children = [];
  for (const c of out) if (c.subcats > 0) children.push(...(await subcats(c.title, depth - 1, seen)));
  return [...out, ...children];
}

async function contactSheets(items, name) {
  const cols = 5, cell = 300, label = 28, perSheet = 25;
  const sheets = [];
  for (let s = 0; s * perSheet < items.length; s++) {
    const chunk = items.slice(s * perSheet, (s + 1) * perSheet);
    const rows = Math.ceil(chunk.length / cols);
    const composites = [];
    for (let i = 0; i < chunk.length; i++) {
      const it = chunk[i];
      const idx = s * perSheet + i;
      const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + label);
      try {
        const buf = await download(it.thumb ?? it.url);
        const img = await sharp(buf).resize(cell, cell, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
        composites.push({ input: img, left: x, top: y + label });
      } catch (e) { it.thumbError = String(e.message); }
      const svg = `<svg width="${cell}" height="${label}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="20" font-family="DejaVu Sans, sans-serif" font-size="17" fill="#fff">#${idx} ${it.width}x${it.height}</text></svg>`;
      composites.push({ input: Buffer.from(svg), left: x, top: y });
      await sleep(120);
    }
    const file = `${name}-sheet-${String(s).padStart(2, '0')}.jpg`;
    await sharp({ create: { width: cols * cell, height: rows * (cell + label), channels: 3, background: '#ffffff' } })
      .composite(composites).jpeg({ quality: 80 }).toFile(path.join(OUT, file));
    sheets.push(file);
  }
  return sheets;
}

// Normalize an image for the game: fixed aspect ratio & size, re-encoded as baseline JPEG,
// all metadata stripped, opaque file name. This removes format/size/EXIF/filename clues.
async function normalize(item, salt) {
  const src = await download(item.sourceUrl);
  const id = crypto.createHash('sha256').update(`${salt}:${item.key}`).digest('hex').slice(0, 16);
  const base = sharp(src, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  let pipeline = sharp(src, { failOn: 'none' }).rotate();
  if (item.crop) {
    const W = meta.autoOrient?.width ?? meta.width, H = meta.autoOrient?.height ?? meta.height;
    const c = item.crop; // fractions of width/height
    pipeline = pipeline.extract({ left: Math.round(c.x * W), top: Math.round(c.y * H), width: Math.round(c.w * W), height: Math.round(c.h * H) });
  }
  const sizes = [[800, 1000], [480, 600]];
  const files = [];
  for (const [w, h] of sizes) {
    const buf = await pipeline.clone()
      .resize(w, h, { fit: 'cover', position: item.position ?? 'attention' })
      .toColorspace('srgb')
      .jpeg({ quality: 82, progressive: false, mozjpeg: true })
      .toBuffer();
    const file = `${id}-${w}.jpg`;
    await fs.mkdir(path.join(OUT, 'images'), { recursive: true });
    await fs.writeFile(path.join(OUT, 'images', file), buf);
    files.push({ file, bytes: buf.length });
  }
  return { key: item.key, id, files, sourceWidth: meta.width, sourceHeight: meta.height };
}

async function main() {
  const job = JSON.parse(await fs.readFile('scripts/commons/job.json', 'utf8'));
  await fs.mkdir(OUT, { recursive: true });
  const report = { startedAt: new Date().toISOString(), tasks: [] };
  for (const task of job.tasks) {
    console.log('Task', task.name, task.type);
    try {
      if (task.type === 'subcats') {
        const cats = await subcats(task.root, task.depth ?? 1);
        await fs.writeFile(path.join(OUT, `${task.name}.json`), JSON.stringify(cats, null, 1));
        report.tasks.push({ name: task.name, count: cats.length });
      } else if (task.type === 'category' || task.type === 'search') {
        const gen = task.type === 'category'
          ? { generator: 'categorymembers', gcmtitle: task.category, gcmtype: 'file', gcmlimit: 50, gcmsort: task.sort ?? 'timestamp', gcmdir: task.dir ?? 'desc' }
          : { generator: 'search', gsrsearch: task.query, gsrnamespace: 6, gsrlimit: 50 };
        let items = await collect(gen, (task.limit ?? 50) * 2);
        const minW = task.minWidth ?? 700;
        items = items.filter((i) => /image\/(jpeg|png|webp)/.test(i.mime) && i.width >= minW && i.height >= minW * 0.6).slice(0, task.limit ?? 50);
        const sheets = task.sheet === false ? [] : await contactSheets(items, task.name);
        await fs.writeFile(path.join(OUT, `${task.name}.json`), JSON.stringify(items, null, 1));
        report.tasks.push({ name: task.name, count: items.length, sheets });
      } else if (task.type === 'info') {
        const items = [];
        for (let i = 0; i < task.titles.length; i += 40) {
          const data = await api({ action: 'query', titles: task.titles.slice(i, i + 40).join('|'), ...iiParams(task.thumbWidth ?? 1280) });
          for (const p of data.query?.pages ?? []) { const s = summarize(p); items.push(s ?? { title: p.title, missing: true }); }
        }
        const sheets = task.sheet ? await contactSheets(items.filter((x) => !x.missing), task.name) : [];
        await fs.writeFile(path.join(OUT, `${task.name}.json`), JSON.stringify(items, null, 1));
        report.tasks.push({ name: task.name, count: items.length, sheets });
      } else if (task.type === 'preview') {
        // Larger single previews for close visual inspection.
        await fs.mkdir(path.join(OUT, 'preview'), { recursive: true });
        const data = [];
        for (let i = 0; i < task.titles.length; i += 40) {
          const d = await api({ action: 'query', titles: task.titles.slice(i, i + 40).join('|'), ...iiParams(task.width ?? 1280) });
          data.push(...(d.query?.pages ?? []));
        }
        let n = 0;
        for (const p of data) {
          const s = summarize(p); if (!s) continue;
          const buf = await download(s.thumb ?? s.url);
          const out = await sharp(buf).resize(task.width ?? 1280, task.width ?? 1280, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();
          const f = `${task.name}-${String(task.titles.indexOf(p.title)).padStart(2, '0')}.jpg`;
          await fs.writeFile(path.join(OUT, 'preview', f), out); n++;
          await sleep(200);
        }
        report.tasks.push({ name: task.name, count: n });
      } else if (task.type === 'normalize') {
        const results = [];
        for (const item of task.items) {
          if (!item.sourceUrl) {
            const d = await api({ action: 'query', titles: item.title, ...iiParams(task.width ?? 1920) });
            const s = summarize(d.query.pages[0]);
            item.sourceUrl = (s.width > (task.width ?? 1920) && s.thumb) ? s.thumb : s.url;
          }
          results.push(await normalize(item, task.salt));
          await sleep(300);
        }
        await fs.writeFile(path.join(OUT, `${task.name}.json`), JSON.stringify(results, null, 1));
        report.tasks.push({ name: task.name, count: results.length });
      }
    } catch (e) {
      console.error(e);
      report.tasks.push({ name: task.name, error: String(e.stack ?? e) });
    }
  }
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
