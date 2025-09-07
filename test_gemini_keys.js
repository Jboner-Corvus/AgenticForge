import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
config();

// Liste des clés à tester depuis les variables d'environnement
const keys = [
  process.env.LLM_API_KEY,
  process.env.LLM_API_KEY_GEMINI_FLASH_2,
  process.env.LLM_API_KEY_GEMINI_PRO_2,
  process.env.LLM_API_KEY_GEMINI_FLASH_3,
  process.env.LLM_API_KEY_GEMINI_PRO_3,
  process.env.LLM_API_KEY_GEMINI_FLASH_4,
  process.env.LLM_API_KEY_GEMINI_PRO_4,
  process.env.GEMINI_API_KEY, // Fallback pour compatibilité
].filter((key) => key && key.trim() !== ''); // Filtrer les clés vides ou undefined

async function testKey(key) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent('Hello, test message');
    const response = await result.response;
    const text = response.text();

    console.log(`✅ Key ${key.substring(0, 10)}... is VALID`);
    return true;
  } catch (error) {
    console.log(
      `❌ Key ${key.substring(0, 10)}... is INVALID: ${error.message}`,
    );
    return false;
  }
}

async function testAllKeys() {
  console.log('🔍 Testing Gemini API keys...\n');

  for (const key of keys) {
    await testKey(key);
    // Petit délai entre les tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n📝 All keys tested. Invalid keys need to be replaced.');
}

testAllKeys().catch(console.error);
