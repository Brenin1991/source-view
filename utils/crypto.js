const crypto = require('crypto');
const { app } = require('electron');
const Store = require('electron-store');

const store = new Store({
  name: 'encryption-config',
  encryptionKey: false // Não criptografar o próprio arquivo de configuração
});

// Algoritmo de criptografia
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Gera uma chave de criptografia a partir de uma senha usando PBKDF2
 */
function deriveKeyFromPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Gera uma chave aleatória segura
 */
function generateSecureKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Obtém ou gera a chave de criptografia principal
 * Se não existir, cria uma nova e armazena de forma segura
 */
function getEncryptionKey() {
  let key = store.get('encryptionKey');
  
  if (!key) {
    // Gerar nova chave baseada em identificadores únicos do sistema
    const machineId = app.getPath('userData');
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(32).toString('hex');
    
    // Combinar para criar uma chave única
    const combined = `${machineId}-${timestamp}-${randomBytes}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    key = hash;
    store.set('encryptionKey', key);
    
    console.log('🔐 Nova chave de criptografia gerada');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Criptografa um texto
 */
function encrypt(text) {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Retornar: iv + tag + encrypted (todos em hex)
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return text; // Retornar texto original em caso de erro
  }
}

/**
 * Descriptografa um texto
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }
  
  // Verificar se é texto criptografado (formato: iv:tag:encrypted)
  if (!encryptedText.includes(':')) {
    // Texto antigo não criptografado
    return encryptedText;
  }
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return encryptedText; // Formato inválido, retornar como está
    }
    
    const [ivHex, tagHex, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    // Se falhar, pode ser texto antigo não criptografado
    return encryptedText;
  }
}

/**
 * Criptografa campos sensíveis de um objeto
 */
function encryptObject(obj, fieldsToEncrypt = ['title', 'url']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const encrypted = { ...obj };
  
  fieldsToEncrypt.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  
  return encrypted;
}

/**
 * Descriptografa campos sensíveis de um objeto
 */
function decryptObject(obj, fieldsToDecrypt = ['title', 'url']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const decrypted = { ...obj };
  
  fieldsToDecrypt.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });
  
  return decrypted;
}

/**
 * Verifica se a criptografia está habilitada
 */
function isEncryptionEnabled() {
  return store.get('encryptionEnabled', false);
}

/**
 * Habilita ou desabilita a criptografia
 */
function setEncryptionEnabled(enabled) {
  store.set('encryptionEnabled', enabled);
  return enabled;
}

/**
 * Re-criptografa todos os dados (migração)
 * Esta função deve ser chamada quando a criptografia é habilitada pela primeira vez
 */
async function reEncryptAllData(encryptData) {
  const enabled = isEncryptionEnabled();
  if (!enabled) {
    console.log('⚠️ Criptografia não está habilitada');
    return { success: false, message: 'Criptografia não está habilitada' };
  }
  
  try {
    await encryptData();
    return { success: true, message: 'Todos os dados foram criptografados' };
  } catch (error) {
    console.error('Erro ao re-criptografar dados:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Limpa a chave de criptografia (use com cuidado!)
 */
function clearEncryptionKey() {
  store.delete('encryptionKey');
  store.set('encryptionEnabled', false);
  console.log('⚠️ Chave de criptografia removida');
}

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  isEncryptionEnabled,
  setEncryptionEnabled,
  generateSecureKey,
  getEncryptionKey,
  reEncryptAllData,
  clearEncryptionKey
};

