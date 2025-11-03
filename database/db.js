const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const cryptoUtils = require('../utils/crypto');

let db = null;
let SQL = null;

async function initDatabase() {
  if (db) return db;

  try {
    SQL = await initSqlJs();
    const dbPath = path.join(app.getPath('userData'), 'privacy-browser.db');
    
    // Carregar banco existente ou criar novo
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
      createTables();
    }
    
    // Executar migrações se necessário
    migrateDatabase();

    return db;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      favicon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      favicon TEXT,
      visit_count INTEGER DEFAULT 1,
      last_visit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      path TEXT NOT NULL,
      total_bytes INTEGER,
      received_bytes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'downloading',
      error TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      paused_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
    CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit_at DESC);
    CREATE INDEX IF NOT EXISTS idx_favorites_url ON favorites(url);
    CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
  `);
  saveDatabase();
}

// Função para migrar banco de dados existente
function migrateDatabase() {
  if (!db) return;
  
  try {
    // Verificar se a tabela history existe e se tem a coluna favicon
    const tables = execQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='history'");
    if (tables.length > 0) {
      const columns = execQuery("PRAGMA table_info(history)");
      const hasFaviconColumn = columns.some(col => col.name === 'favicon');
      
      if (!hasFaviconColumn) {
        console.log('🔄 Migrando tabela history para adicionar coluna favicon...');
        
        // Backup dos dados existentes
        const existingData = execQuery('SELECT id, title, url, visit_count, last_visit_at, created_at FROM history');
        
        // Deletar índices
        try {
          db.run('DROP INDEX IF EXISTS idx_history_url');
          db.run('DROP INDEX IF EXISTS idx_history_last_visit');
        } catch (e) {
          // Índices podem não existir
        }
        
        // Recriar tabela com a coluna favicon
        db.run('DROP TABLE history');
        db.run(`
          CREATE TABLE history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            favicon TEXT,
            visit_count INTEGER DEFAULT 1,
            last_visit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Restaurar dados
        if (existingData.length > 0) {
          const stmt = db.prepare('INSERT INTO history (id, title, url, visit_count, last_visit_at, created_at, favicon) VALUES (?, ?, ?, ?, ?, ?, ?)');
          existingData.forEach(row => {
            stmt.bind([row.id, row.title, row.url, row.visit_count, row.last_visit_at, row.created_at, null]);
            stmt.step();
            stmt.reset();
          });
          stmt.free();
        }
        
        // Recriar índices
        db.run('CREATE INDEX IF NOT EXISTS idx_history_url ON history(url)');
        db.run('CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit_at DESC)');
        
        saveDatabase();
        console.log('✅ Migração concluída: coluna favicon adicionada à tabela history');
      }
    }
  } catch (error) {
    console.error('Erro ao migrar banco de dados:', error);
    // Não bloquear a inicialização se a migração falhar
  }
}

function saveDatabase() {
  if (!db) return;
  
  try {
    const dbPath = path.join(app.getPath('userData'), 'privacy-browser.db');
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Erro ao salvar banco de dados:', error);
  }
}

// Funções auxiliares para executar queries
function execQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}

function execRun(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    db.run(sql, params);
    saveDatabase();
  } catch (error) {
    // Re-throw para que o código chamador possa lidar com o erro
    throw error;
  }
}

// Inicializar banco quando módulo for carregado
let dbInitPromise = null;

function getDb() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase();
  }
  return dbInitPromise;
}

// Funções para uso no main.js
const dbFunctions = {
  // Favoritos
  insertFavorite: async (title, url, favicon) => {
    await getDb();
    
    // Criptografar se habilitado
    const encryptEnabled = cryptoUtils.isEncryptionEnabled();
    let encryptedTitle = title;
    let encryptedUrl = url;
    
    if (encryptEnabled) {
      encryptedTitle = cryptoUtils.encrypt(title);
      encryptedUrl = cryptoUtils.encrypt(url);
    }
    
    // Verificar se já existe (buscar por URL descriptografado se necessário)
    let existing;
    if (encryptEnabled) {
      // Buscar todos os favoritos e descriptografar para comparar
      const allFavorites = execQuery('SELECT * FROM favorites');
      existing = allFavorites.filter(fav => {
        const decryptedUrl = cryptoUtils.decrypt(fav.url);
        return decryptedUrl === url;
      });
    } else {
      existing = execQuery('SELECT id FROM favorites WHERE url = ?', [url]);
    }
    
    if (existing.length > 0) {
      // Atualizar existente
      const existingId = existing[0].id;
      execRun('UPDATE favorites SET title = ?, url = ?, favicon = ?, updated_at = datetime("now") WHERE id = ?', 
        [encryptedTitle, encryptedUrl, favicon || null, existingId]);
      return { lastInsertRowid: existingId };
    } else {
      // Inserir novo
      const stmt = db.prepare('INSERT INTO favorites (title, url, favicon, updated_at) VALUES (?, ?, ?, datetime("now"))');
      stmt.bind([encryptedTitle, encryptedUrl, favicon || null]);
      stmt.step();
      stmt.free();
      
      saveDatabase();
      
      const result = execQuery('SELECT id FROM favorites ORDER BY id DESC LIMIT 1');
      return { lastInsertRowid: result[0]?.id || null };
    }
  },

  deleteFavorite: async (id) => {
    await getDb();
    execRun('DELETE FROM favorites WHERE id = ?', [id]);
  },

  deleteFavoriteByUrl: async (url) => {
    await getDb();
    const encryptEnabled = cryptoUtils.isEncryptionEnabled();
    
    if (encryptEnabled) {
      // Buscar todos os favoritos e descriptografar para encontrar
      const allFavorites = execQuery('SELECT * FROM favorites');
      const found = allFavorites.find(fav => {
        const decryptedUrl = cryptoUtils.decrypt(fav.url);
        return decryptedUrl === url;
      });
      
      if (found) {
        execRun('DELETE FROM favorites WHERE id = ?', [found.id]);
      }
    } else {
      execRun('DELETE FROM favorites WHERE url = ?', [url]);
    }
  },

  getFavorite: async (url) => {
    await getDb();
    const encryptEnabled = cryptoUtils.isEncryptionEnabled();
    
    if (encryptEnabled) {
      // Buscar todos e descriptografar para encontrar
      const allFavorites = execQuery('SELECT * FROM favorites');
      const found = allFavorites.find(fav => {
        const decryptedUrl = cryptoUtils.decrypt(fav.url);
        return decryptedUrl === url;
      });
      
      if (found) {
        return cryptoUtils.decryptObject(found, ['title', 'url']);
      }
      return null;
    } else {
      const result = execQuery('SELECT * FROM favorites WHERE url = ?', [url]);
      return result[0] || null;
    }
  },

  getAllFavorites: async () => {
    await getDb();
    const allFavorites = execQuery('SELECT * FROM favorites ORDER BY updated_at DESC');
    
    // Descriptografar se habilitado
    if (cryptoUtils.isEncryptionEnabled()) {
      return allFavorites.map(fav => cryptoUtils.decryptObject(fav, ['title', 'url']));
    }
    
    return allFavorites;
  },

  // Histórico
  insertHistory: async (title, url, favicon) => {
    await getDb();
    try {
      // Criptografar se habilitado
      const encryptEnabled = cryptoUtils.isEncryptionEnabled();
      let encryptedTitle = title;
      let encryptedUrl = url;
      
      if (encryptEnabled) {
        encryptedTitle = cryptoUtils.encrypt(title);
        encryptedUrl = cryptoUtils.encrypt(url);
      }
      
      // Buscar existente
      let existing;
      if (encryptEnabled) {
        const allHistory = execQuery('SELECT * FROM history');
        existing = allHistory.filter(item => {
          const decryptedUrl = cryptoUtils.decrypt(item.url);
          return decryptedUrl === url;
        });
      } else {
        existing = execQuery('SELECT id, visit_count FROM history WHERE url = ?', [url]);
      }
      
      if (existing.length > 0) {
        // Atualizar existente - incrementar contador e atualizar favicon se fornecido
        const existingId = existing[0].id;
        if (favicon) {
          execRun('UPDATE history SET visit_count = visit_count + 1, last_visit_at = datetime("now"), title = ?, url = ?, favicon = ? WHERE id = ?', 
            [encryptedTitle, encryptedUrl, favicon, existingId]);
        } else {
          execRun('UPDATE history SET visit_count = visit_count + 1, last_visit_at = datetime("now"), title = ?, url = ? WHERE id = ?', 
            [encryptedTitle, encryptedUrl, existingId]);
        }
      } else {
        // Inserir novo registro
        execRun('INSERT INTO history (title, url, favicon, last_visit_at, visit_count) VALUES (?, ?, ?, datetime("now"), 1)', 
          [encryptedTitle, encryptedUrl, favicon || null]);
      }
    } catch (error) {
      // Se ainda assim houver erro de UNIQUE (race condition), tentar apenas atualizar
      if (error.message && error.message.includes('UNIQUE')) {
        try {
          if (favicon) {
            execRun('UPDATE history SET visit_count = visit_count + 1, last_visit_at = datetime("now"), title = ?, favicon = ? WHERE url = ?', 
              [title, favicon, url]);
          } else {
            execRun('UPDATE history SET visit_count = visit_count + 1, last_visit_at = datetime("now"), title = ? WHERE url = ?', 
              [title, url]);
          }
        } catch (updateError) {
          console.error('Erro ao atualizar histórico após UNIQUE:', updateError);
          throw error;
        }
      } else {
        console.error('Erro ao inserir histórico:', error);
        throw error;
      }
    }
  },

  updateHistoryTitle: async (url, title) => {
    await getDb();
    // Atualizar o título do histórico para esta URL
    // Atualizar apenas se o título atual for igual à URL (título temporário) ou diferente do novo título
    execRun('UPDATE history SET title = ? WHERE url = ?', [title, url]);
  },

  updateHistoryFavicon: async (url, favicon) => {
    await getDb();
    // Atualizar o favicon do histórico para esta URL
    if (favicon) {
      execRun('UPDATE history SET favicon = ? WHERE url = ?', [favicon, url]);
    }
  },

  deleteHistory: async (id) => {
    await getDb();
    execRun('DELETE FROM history WHERE id = ?', [id]);
  },

  deleteHistoryByUrl: async (url) => {
    await getDb();
    const encryptEnabled = cryptoUtils.isEncryptionEnabled();
    
    if (encryptEnabled) {
      // Buscar todos e descriptografar para encontrar
      const allHistory = execQuery('SELECT * FROM history');
      const found = allHistory.find(item => {
        const decryptedUrl = cryptoUtils.decrypt(item.url);
        return decryptedUrl === url;
      });
      
      if (found) {
        execRun('DELETE FROM history WHERE id = ?', [found.id]);
      }
    } else {
      execRun('DELETE FROM history WHERE url = ?', [url]);
    }
  },

  clearHistory: async () => {
    await getDb();
    execRun('DELETE FROM history');
  },

  getHistory: async (limit = 50, offset = 0) => {
    await getDb();
    const allHistory = execQuery('SELECT * FROM history ORDER BY last_visit_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    
    // Descriptografar se habilitado
    if (cryptoUtils.isEncryptionEnabled()) {
      return allHistory.map(item => cryptoUtils.decryptObject(item, ['title', 'url']));
    }
    
    return allHistory;
  },

  searchHistory: async (query, limit = 20) => {
    await getDb();
    const allHistory = execQuery('SELECT * FROM history ORDER BY last_visit_at DESC');
    
    // Descriptografar se habilitado e filtrar
    let results = allHistory;
    if (cryptoUtils.isEncryptionEnabled()) {
      results = allHistory.map(item => cryptoUtils.decryptObject(item, ['title', 'url']));
    }
    
    // Filtrar por query (busca case-insensitive)
    const searchTerm = query.toLowerCase();
    results = results.filter(item => 
      item.title.toLowerCase().includes(searchTerm) || 
      item.url.toLowerCase().includes(searchTerm)
    ).slice(0, limit);
    
    return results;
  },

  deleteOldHistory: async (days = 30) => {
    await getDb();
    execRun('DELETE FROM history WHERE last_visit_at < datetime("now", "-" || ? || " days")', [days]);
  },

  // Downloads
  insertDownload: async (filename, url, filePath, totalBytes, status) => {
    await getDb();
    
    // Para sql.js, fazer o INSERT e depois buscar o ID inserido
    const stmt = db.prepare('INSERT INTO downloads (filename, url, path, total_bytes, status) VALUES (?, ?, ?, ?, ?)');
    stmt.bind([filename, url, filePath, totalBytes || 0, status]);
    stmt.step();
    stmt.free();
    
    saveDatabase();
    
    // Buscar o ID do registro recém-inserido
    const result = execQuery('SELECT id FROM downloads WHERE filename = ? AND url = ? ORDER BY id DESC LIMIT 1', [filename, url]);
    const insertedId = result[0]?.id || null;
    
    return { lastInsertRowid: insertedId };
  },

  updateDownload: async (receivedBytes, status, error, completedAt, pausedAt, id, totalBytes = null) => {
    await getDb();
    if (totalBytes !== null) {
      execRun('UPDATE downloads SET received_bytes = ?, status = ?, error = ?, completed_at = ?, paused_at = ?, total_bytes = ? WHERE id = ?', 
        [receivedBytes, status, error, completedAt, pausedAt, totalBytes, id]);
    } else {
      execRun('UPDATE downloads SET received_bytes = ?, status = ?, error = ?, completed_at = ?, paused_at = ? WHERE id = ?', 
        [receivedBytes, status, error, completedAt, pausedAt, id]);
    }
  },

  getDownload: async (id) => {
    await getDb();
    const result = execQuery('SELECT * FROM downloads WHERE id = ?', [id]);
    return result[0] || null;
  },

  getAllDownloads: async (limit = 50, offset = 0) => {
    await getDb();
    return execQuery('SELECT * FROM downloads ORDER BY started_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  },

  deleteDownload: async (id) => {
    await getDb();
    execRun('DELETE FROM downloads WHERE id = ?', [id]);
  },

  clearCompletedDownloads: async () => {
    await getDb();
    execRun('DELETE FROM downloads WHERE status = ?', ['completed']);
  },
};

module.exports = dbFunctions;
