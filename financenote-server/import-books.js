const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('crypto');

// 源图书目录
const BOOKS_DIR = 'C:\\Users\\Laplace\\Desktop\\书籍';
// 目标存放在 FinanceNote 受保护上传目录
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'documents');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function generateUuid() {
  // 生成标准的 UUID v4 格式字符串
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function splitTextIntoChunks(text, chunkSize = 600) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - 100;
  }
  return chunks;
}

async function findFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    if (file === '.git') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(await findFilesRecursively(filePath));
    } else {
      if (/\.(pdf|epub|mobi|azw3|txt|md)$/i.test(file)) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function importBooks() {
  try {
    if (!fs.existsSync(BOOKS_DIR)) {
      console.log(`⚠️ 目录不存在: ${BOOKS_DIR}`);
      return;
    }

    console.log('🔍 开始扫描目录下的图书文件:', BOOKS_DIR);
    const files = await findFilesRecursively(BOOKS_DIR);
    console.log(`📚 共检索到 ${files.length} 个图书文件！`);

    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'financenote',
    });

    // 获取 用户 ddc 的 userId (id = 2)
    const [userRows] = await connection.query('SELECT id FROM users WHERE username = ?', ['ddc']);
    const userId = userRows.length > 0 ? userRows[0].id : 2;

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const srcFile = files[i];
      const filename = path.basename(srcFile);
      const ext = path.extname(filename).toLowerCase();
      const title = path.basename(filename, ext);
      const fileFormat = ext === '.epub' ? 'EPUB' : 'PDF';
      const fileSize = fs.statSync(srcFile).size;

      const docId = generateUuid();
      const targetFileName = `${Date.now()}-${i}-${filename}`;
      const destPath = path.join(UPLOAD_DIR, targetFileName);

      // 复制物理文件到 FinanceNote 保护存储目录
      fs.copyFileSync(srcFile, destPath);

      // 写入 documents 数据库记录
      await connection.query(
        `INSERT INTO documents 
         (id, userId, title, docType, fileFormat, filePath, fileSize, status, isPublic, createdAt, updatedAt) 
         VALUES (?, ?, ?, 'BOOK', ?, ?, ?, 'PROCESSING', 0, NOW(), NOW())`,
        [docId, userId, title, fileFormat, destPath, fileSize]
      );

      console.log(`[${i + 1}/${files.length}] 写入图书记录: ${title} (${fileFormat})`);

      // 若为 PDF 文件，同步提取文字切块并写入 document_chunks 表
      if (ext === '.pdf') {
        try {
          const dataBuffer = fs.readFileSync(destPath);
          const pageTexts = [];

          await pdfParse(dataBuffer, {
            pagerender: (pageData) => {
              return pageData.getTextContent().then((textContent) => {
                const pageText = textContent.items.map((item) => item.str).join(' ');
                pageTexts.push({ pageNum: pageData.pageIndex + 1, text: pageText });
                return pageText;
              });
            },
          });

          for (const page of pageTexts) {
            if (!page.text.trim()) continue;
            const chunks = splitTextIntoChunks(page.text, 600);
            for (const chunkText of chunks) {
              const chunkId = generateUuid();
              await connection.query(
                `INSERT INTO document_chunks (id, docId, pageNumber, content, metadata, createdAt) VALUES (?, ?, ?, ?, ?, NOW())`,
                [chunkId, docId, page.pageNum, chunkText, JSON.stringify({ pageNumber: page.pageNum })]
              );
            }
          }

          await connection.query(`UPDATE documents SET status = 'PROCESSED' WHERE id = ?`, [docId]);
          console.log(`   └─ 📄 PDF 解析切块完成 (${pageTexts.length} 页)`);
        } catch (parseErr) {
          console.warn(`   └─ ⚠️ PDF 纯文本提取警告: ${parseErr.message}`);
          await connection.query(`UPDATE documents SET status = 'PROCESSED' WHERE id = ?`, [docId]);
        }
      } else {
        await connection.query(`UPDATE documents SET status = 'PROCESSED' WHERE id = ?`, [docId]);
      }

      successCount++;
    }

    console.log(`🎉 批量处理完成！成功将 ${successCount} 本图书同步录入数据库与工作台！`);
    await connection.end();
  } catch (err) {
    console.error('❌ 导入过程出错:', err.message, err.stack);
  }
}

importBooks();
