import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import adminAuthRoutes from './adminAuth.js';
import scriptManagementRoutes from './scriptManagement.js';
import istManagementRoutes from './istManagement.js';
import activationRoutes from './activation.js';
import downloadRoutes from './download.js';
import { parse } from 'pg-connection-string';

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const dbConfig = parse(process.env.DATABASE_URL);
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: { rejectUnauthorized: false }
});

const corsOptions = {
  origin: 'https://admin.script.sdjz.wiki'
};
app.use(cors(corsOptions)); // 跨域
app.use(express.json()); // 解析JSON

// 路由挂载
app.use('/api/admin/auth', adminAuthRoutes(pool));
app.use('/api/admin/scripts', scriptManagementRoutes(pool));
app.use('/api/admin/ists', istManagementRoutes(pool));
app.use('/api', activationRoutes(pool));
app.use('/api', downloadRoutes());

export default app;