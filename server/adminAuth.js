import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 登录失败计数
const loginFailMap = {};
const MAX_FAIL = 5;
const BLOCK_TIME = 60 * 60 * 1000; // 1小时

// 用户名校验（3-32位，字母数字下划线）
function validUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9_]{3,32}$/.test(u);
}
// 密码校验（8-64位，必须包含字母和数字）
function validPassword(p) {
  return typeof p === 'string' && p.length >= 8 && p.length <= 64 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);
}

import auth from './authMiddleware.js';

// 管理员认证路由
export default (pool) => {
  const router = express.Router();

  // 管理员注册（仅首次）
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!validUsername(username) || !validPassword(password)) return res.status(400).json({ error: '用户名或密码格式不合法' });
    try {
      const result = await pool.query('SELECT COUNT(*) FROM "AdminUsers"');
      if (parseInt(result.rows[0].count) > 0) return res.status(403).json({ error: '已存在管理员' });
      const hash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO "AdminUsers" (username, password_hash) VALUES ($1, $2)', [username, hash]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: '注册失败' });
    }
  });

  // 管理员登录
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!validUsername(username) || !validPassword(password)) return res.status(400).json({ error: '用户名或密码格式不合法' });
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `${username}_${ip}`;
    const now = Date.now();
    if (loginFailMap[key] && loginFailMap[key].count >= MAX_FAIL && now - loginFailMap[key].last < BLOCK_TIME) {
      return res.status(429).json({ error: '登录失败次数过多，请稍后再试' });
    }
    try {
      const result = await pool.query('SELECT * FROM "AdminUsers" WHERE username=$1', [username]);
      if (!result.rows[0]) {
        loginFailMap[key] = { count: (loginFailMap[key]?.count || 0) + 1, last: now };
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      const valid = await bcrypt.compare(password, result.rows[0].password_hash);
      if (!valid) {
        loginFailMap[key] = { count: (loginFailMap[key]?.count || 0) + 1, last: now };
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      // 登录成功，清除计数
      delete loginFailMap[key];
      const token = jwt.sign({ id: result.rows[0].id, username }, process.env.JWT_SECRET, { expiresIn: '12h' });
      res.json({ token });
    } catch (e) {
      res.status(500).json({ error: '登录失败' });
    }
  });

  // 查询是否存在管理员
  router.get('/has-admin', async (req, res) => {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM "AdminUsers"');
      res.json({ hasAdmin: parseInt(result.rows[0].count) > 0 });
    } catch (e) {
      res.status(500).json({ hasAdmin: false });
    }
  });

  // 检查token是否有效
  router.get('/check', auth, (req, res) => {
    res.json({ 
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username
      }
    });
  });

  return router;
}; 