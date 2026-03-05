
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../Cetak Daftar Siswa.xlsx');
const OUTPUT_DIR = path.join(__dirname, '../output_kelas');

// Regex to parse email: [code]2023[nis].siswa@smkn12malang.sch.id
const EMAIL_RE = /^([a-z]+)2023(\d{4})\.siswa@smkn12malang\.sch\.id$/i;

const JURUSAN_MAP = {
  "akl": "AKL",
  "bcf": "BCF",
  "dkv": "DKV",
  "jkt": "TJKT",
  "klr": "KLR",
  "oto": "TO",   // Special handling for TO
  "plg": "PPLG",
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function detectColumns(headers) {
  const lowerHeaders = headers.map(h => String(h).trim().toLowerCase());
  
  // Moodle style columns fallback (Prioritize these first if found)
  let firstNameIdx = lowerHeaders.findIndex(h => h === 'firstname');
  let lastNameIdx = lowerHeaders.findIndex(h => h === 'lastname');
  
  // Standard columns
  let emailIdx = lowerHeaders.findIndex(h => h.includes('email') || h.includes('e-mail') || h.includes('mail'));
  let namaIdx = -1;
  let kelasIdx = lowerHeaders.findIndex(h => h.includes('rombel') || h.includes('kelas'));

  if (firstNameIdx === -1) {
    // Only search fuzzy 'name' if explicit 'firstname' is missing
    namaIdx = lowerHeaders.findIndex(h => (h.includes('nama') || h.includes('name')) && !h.includes('user'));
  }
  
  if (kelasIdx === -1) {
    kelasIdx = lowerHeaders.findIndex(h => h === 'profile_field_rmbl' || h === 'department');
  }

  // ... rest of function ...

  const hasName = namaIdx !== -1 || firstNameIdx !== -1;

  if (emailIdx === -1 || !hasName) {
    throw new Error(`Could not find required columns. Found: ${headers.join(', ')}`);
  }

  return { emailIdx, namaIdx, kelasIdx, firstNameIdx, isUserpass: lowerHeaders.includes('profile_field_rmbl') };
}

function getSubprogram(jurusanCode, kelasText) {
  if (jurusanCode !== 'TO') return null;
  
  // Look for "TO <number>" or similar pattern in class name
  // e.g., "XII TO 1", "XII TO-1", etc.
  const match = String(kelasText).toUpperCase().match(/\bTO\s*[-]?\s*(\d+)\b/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 3) return 'TKRO';
    if (num >= 4 && num <= 5) return 'TBSM';
  }
  return 'TO (Unknown)';
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`File not found: ${INPUT_FILE}`);
    console.log('Please make sure "Cetak Daftar Siswa.xlsx" is in the project root directory.');
    return;
  }

  console.log(`Reading file: ${INPUT_FILE}`);
  const workbook = XLSX.readFile(INPUT_FILE);
  
  // Find "Userpass" sheet
  let sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('userpass'));
  
  if (!sheetName) {
    console.log('Sheet "Userpass" not found. Falling back to the first sheet.');
    sheetName = workbook.SheetNames[0];
  } else {
    console.log(`Using sheet: ${sheetName}`);
  }
  
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON (array of arrays for easier column detection by index, or array of objects)
  // Array of arrays is safer if headers are not on first row, but assuming standard format:
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  if (data.length === 0) {
    console.error('File is empty.');
    return;
  }

  const headers = data[0];
  let colIndices;
  try {
    colIndices = detectColumns(headers);
  } catch (e) {
    console.error(e.message);
    return;
  }

  const { emailIdx, namaIdx, kelasIdx, firstNameIdx, isUserpass } = colIndices;
  const processedRows = [];

  // Find lastname index for Userpass format
  const lastnameIdx = headers.findIndex(h => String(h).toLowerCase() === 'lastname');
  
  console.log(`Indices - Email: ${emailIdx}, Firstname: ${firstNameIdx}, Lastname (Class): ${lastnameIdx}, IsUserpass: ${isUserpass}`);

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIdx];
    
    let nama = '';
    let kelas = '';

    if (isUserpass) {
       // Special handling for Userpass sheet
       nama = row[firstNameIdx] || '';
       kelas = row[lastnameIdx] || ''; // Class name is in lastname column
    } else {
       // Standard format
       nama = row[namaIdx];
       kelas = row[kelasIdx];
    }

    if (!email || !nama || !kelas) {
        if (i < 5) console.log(`Skipping Row ${i}: Missing data. Email: ${email}, Name: ${nama}, Class: ${kelas}`);
        continue;
    }

    const emailStr = String(email).trim();
    const match = emailStr.match(EMAIL_RE);
    
    if (i < 5) console.log(`Row ${i} Email: ${emailStr}, Match: ${!!match}`);

    if (match) {
      const code = match[1].toLowerCase();
      const nis = match[2];
      
      if (JURUSAN_MAP[code]) {
        const jurusanCode = JURUSAN_MAP[code];
        let finalJurusan = jurusanCode;
        
        if (jurusanCode === 'TO') {
          const sub = getSubprogram(jurusanCode, kelas);
          if (sub) finalJurusan = sub;
        }

        processedRows.push({
          Nama: String(nama).trim(),
          Email: emailStr,
          Kelas: String(kelas).trim(),
          Jurusan: finalJurusan,
          NIS: nis,
          RawCode: code
        });
      }
    }
  }

  console.log(`Found ${processedRows.length} students matching criteria (Class XII / 2023).`);

  // Sort by Name (A-Z)
  processedRows.sort((a, b) => a.Nama.localeCompare(b.Nama));

  // Group by Class
  const classes = {};
  processedRows.forEach(row => {
    if (!classes[row.Kelas]) {
      classes[row.Kelas] = [];
    }
    classes[row.Kelas].push(row);
  });

  ensureDir(OUTPUT_DIR);

  Object.keys(classes).forEach(className => {
    const students = classes[className];
    const safeClassName = className.replace(/[\\/:*?"<>|]/g, '_'); // Sanitize filename
    const outputPath = path.join(OUTPUT_DIR, `${safeClassName}.xlsx`);
    
    const newSheet = XLSX.utils.json_to_sheet(students);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newSheet, "Siswa");
    
    XLSX.writeFile(newWb, outputPath);
    console.log(`Created: ${outputPath} (${students.length} students)`);
  });

  console.log('Processing complete.');
}

main();
