import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const artifactDir = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\23def309-e9c8-4522-a936-2a55e8d881b3';

function getMd5(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(buffer).digest('hex');
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

async function run() {
  const pt = path.join(artifactDir, 'pt_cover.png');
  const en = path.join(artifactDir, 'en_cover.png');
  const fr = path.join(artifactDir, 'fr_cover.png');

  console.log('PT Cover MD5:', getMd5(pt));
  console.log('EN Cover MD5:', getMd5(en));
  console.log('FR Cover MD5:', getMd5(fr));
}

run();
