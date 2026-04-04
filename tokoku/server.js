/**
 * TokoKu — Backend Node.js + Express
 * =====================================
 * Cara menjalankan:
 *   1. npm install
 *   2. node server.js
 *   3. Buka http://localhost:3000
 */

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve semua file statis dari folder ini
app.use(express.static(__dirname));

/* ─── Database JSON ──────────────────────────────────────── */
const DB_FILE = path.join(__dirname, 'data', 'produk.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) { return []; }
}

function writeDB(data) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Seed data awal
if (!fs.existsSync(DB_FILE)) {
  writeDB([
    { id: uuidv4(), kode:'PRD-001', nama:'Laptop ASUS VivoBook 15', kategori:'Elektronik', hargaBeli:7500000, hargaJual:9500000, stok:12, satuan:'Unit', supplier:'PT. ASUS Indonesia', deskripsi:'Laptop 15.6 inch', createdAt: new Date().toISOString() },
    { id: uuidv4(), kode:'PRD-002', nama:'Kaos Polos Premium', kategori:'Pakaian', hargaBeli:35000, hargaJual:75000, stok:150, satuan:'Pcs', supplier:'CV. Textile Jaya', deskripsi:'Cotton combed 30s', createdAt: new Date().toISOString() },
    { id: uuidv4(), kode:'PRD-003', nama:'Mie Instan Goreng', kategori:'Makanan & Minuman', hargaBeli:2800, hargaJual:4000, stok:3, satuan:'Pcs', supplier:'PT. Indofood', deskripsi:'Rasa ayam goreng', createdAt: new Date().toISOString() },
  ]);
}

/* ─── Routes ─────────────────────────────────────────────── */
// Serve frontend — otomatis cari file HTML
app.get('/', (req, res) => {
  const candidates = ['index.html', 'Index.html'];
  for (const f of candidates) {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) return res.sendFile(p);
  }
  const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
  res.send(`<h2>File tidak ditemukan!</h2><p>HTML tersedia: ${htmlFiles.join(', ') || 'tidak ada'}</p>`);
});

// GET all
app.get('/api/produk', (req, res) => {
  let data = readDB();
  if (req.query.kategori) data = data.filter(p => p.kategori === req.query.kategori);
  res.json({ status: 'success', total: data.length, data });
});

// GET one
app.get('/api/produk/:id', (req, res) => {
  const p = readDB().find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ status: 'error', message: 'Tidak ditemukan' });
  res.json({ status: 'success', data: p });
});

// POST
app.post('/api/produk', (req, res) => {
  const data = readDB();
  if (data.find(p => p.kode === req.body.kode?.trim())) {
    return res.status(400).json({ status: 'error', message: 'Kode sudah ada' });
  }
  const newP = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  data.push(newP);
  writeDB(data);
  res.status(201).json({ status: 'success', data: newP });
});

// PUT
app.put('/api/produk/:id', (req, res) => {
  const data = readDB();
  const idx = data.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ status: 'error', message: 'Tidak ditemukan' });
  data[idx] = { ...data[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(data);
  res.json({ status: 'success', data: data[idx] });
});

// DELETE
app.delete('/api/produk/:id', (req, res) => {
  let data = readDB();
  const p = data.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ status: 'error', message: 'Tidak ditemukan' });
  writeDB(data.filter(d => d.id !== req.params.id));
  res.json({ status: 'success', message: `${p.nama} dihapus` });
});

/* ─── Start ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n✅ TokoKu Server: http://localhost:${PORT}`);
  const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
  console.log(`📄 File HTML: ${htmlFiles.join(', ') || 'TIDAK ADA!'}\n`);
});
