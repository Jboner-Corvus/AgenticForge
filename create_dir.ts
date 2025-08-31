import { mkdir } from 'fs/promises';
import { join } from 'path';

async function createDirectory() {
  try {
    const dirPath = join(__dirname, 'test_dir');
    await mkdir(dirPath);
    console.log('Directory created successfully');
  } catch (err) {
    console.error('Error creating directory:', err);
  }
}

createDirectory();
