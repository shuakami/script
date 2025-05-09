import jwt from 'jsonwebtoken';

// JWT认证中间件
export default function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '无效token' });
    req.user = user;
    next();
  });
} 