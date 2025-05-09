import express from 'express';
import crypto from 'crypto';
import auth from './authMiddleware.js';

// IST管理路由
export default (pool) => {
  const router = express.Router();
  router.use(auth);

  // 生成IST
  router.post('/generate', async (req, res) => {
    const { script_id, customer_info, expires_in_hours } = req.body;
    if (!script_id) return res.status(400).json({ error: '参数缺失' });
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + (expires_in_hours || 24) * 3600 * 1000);
    try {
      const result = await pool.query('INSERT INTO "InstallSessionTokens" (token_value, fk_script_id, customer_info, status, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *', [token, script_id, customer_info || '', 'UNUSED', expiresAt]);
      const ist = result.rows[0];
      res.json({ ...ist, created_at: ist.created_at });
    } catch (e) {
      res.status(500).json({ error: '生成失败' });
    }
  });

  // 列表
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM "InstallSessionTokens" ORDER BY id DESC');
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: '查询失败' });
    }
  });

  // 删除IST
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM "InstallSessionTokens" WHERE id=$1', [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'IST不存在' });
      await pool.query('DELETE FROM "InstallSessionTokens" WHERE id=$1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: '删除失败' });
    }
  });

  return router;
}; 