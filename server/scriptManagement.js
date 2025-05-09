import express from 'express';
import auth from './authMiddleware.js';
import { uploadFile, deleteFile, fileExists } from './githubHelper.js';
import multer from 'multer';

const upload = multer(); // 内存存储，适合小文件

// 脚本管理路由
export default (pool) => {
  const router = express.Router();
  router.use(auth);

  // 上传脚本（支持form-data和json）
  router.post('/upload', upload.single('file'), async (req, res) => {
    // 兼容form-data和json
    let name, description, file_name, file_content_base64, execution_config, exec_args, file_type;
    if (req.is('multipart/form-data')) {
      name = req.body.name;
      description = req.body.description;
      file_name = req.body.file_name || (req.file && req.file.originalname);
      file_content_base64 = req.body.file_content_base64 || (req.file && req.file.buffer && req.file.buffer.toString('base64'));
      execution_config = req.body.execution_config;
      exec_args = req.body.exec_args;
      file_type = req.body.file_type;
    } else {
      ({ name, description, file_name, file_content_base64, execution_config, exec_args, file_type } = req.body || {});
    }
    if (!file_name || !file_content_base64) return res.status(400).json({ error: '参数缺失' });
    const scriptsPath = process.env.GITHUB_SCRIPTS_PATH;
    const ghPath = `${scriptsPath}/${Date.now()}_${file_name}`;
    try {
      console.log('上传 execution_config:', execution_config);
      await uploadFile(ghPath, file_content_base64, `upload script ${file_name}`);
      // execution_config 需转为对象再存入
      let execConfObj = null;
      if (execution_config) {
        try {
          execConfObj = typeof execution_config === 'string' ? JSON.parse(execution_config) : execution_config;
        } catch (e) {
          return res.status(400).json({ error: 'execution_config 不是合法JSON' });
        }
        if (typeof execConfObj !== 'object' || execConfObj === null || Array.isArray(execConfObj)) {
          return res.status(400).json({ error: 'execution_config 必须是对象' });
        }
      }
      console.log('存入 execConfObj:', execConfObj);
      const result = await pool.query('INSERT INTO "Scripts" (name, description, file_path_obfuscated, execution_config, exec_args, file_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, description, ghPath, execConfObj, exec_args, file_type]);
      const script = result.rows[0];
      res.json({ ...script, uploadTime: script.created_at });
    } catch (e) {
      console.error('脚本上传数据库异常', e);
      res.status(500).json({ error: '上传失败' });
    }
  });

  // 列表
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT *, created_at as "uploadTime" FROM "Scripts" ORDER BY id DESC');
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: '查询失败' });
    }
  });

  // 更新
  router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
      await pool.query('UPDATE "Scripts" SET name=$1, description=$2 WHERE id=$3', [name, description, req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: '更新失败' });
    }
  });

  // 删除
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT file_path_obfuscated FROM "Scripts" WHERE id=$1', [req.params.id]);
      if (result.rows[0]) {
        const ghPath = result.rows[0].file_path_obfuscated;
        try {
          if (await fileExists(ghPath)) await deleteFile(ghPath, `delete script ${ghPath}`);
        } catch (e) {
          // 文件不存在或删除失败都忽略，继续删数据库
        }
      }
      // 先查所有相关IST id
      const istRes = await pool.query('SELECT id FROM "InstallSessionTokens" WHERE fk_script_id=$1', [req.params.id]);
      const istIds = istRes.rows.map(r => r.id);
      if (istIds.length > 0) {
        // 先删所有激活记录
        await pool.query('DELETE FROM "ActivatedInstallations" WHERE fk_ist_id = ANY($1)', [istIds]);
        // 再删IST
        await pool.query('DELETE FROM "InstallSessionTokens" WHERE id = ANY($1)', [istIds]);
      }
      // 最后删脚本
      await pool.query('DELETE FROM "Scripts" WHERE id=$1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      console.error('脚本删除数据库异常', e);
      res.status(500).json({ error: '删除失败' });
    }
  });

  return router;
}; 