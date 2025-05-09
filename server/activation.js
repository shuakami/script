import express from 'express';
import crypto from 'crypto';
import { getFileContent } from './githubHelper.js';
const Buffer = global.Buffer;

// 激活接口
export default (pool) => {
  const router = express.Router();

  router.post('/activate-machine', async (req, res) => {
    const { install_session_token, hardware_ids, client_public_key, platform_info } = req.body;
    if (!install_session_token || !hardware_ids || !client_public_key) return res.status(400).json({ error: '参数缺失' });
    try {
      // 校验IST
      const istRes = await pool.query('SELECT * FROM "InstallSessionTokens" WHERE token_value=$1', [install_session_token]);
      const ist = istRes.rows[0];
      if (!ist) return res.status(404).json({ error: 'IST不存在' });
      if (ist.status !== 'UNUSED') return res.status(403).json({ error: 'IST已用' });
      if (new Date(ist.expires_at) < new Date()) return res.status(403).json({ error: 'IST过期' });
      // 获取脚本（通过GitHub API）
      const scriptRes = await pool.query('SELECT * FROM "Scripts" WHERE id=$1', [ist.fk_script_id]);
      const script = scriptRes.rows[0];
      if (!script) return res.status(500).json({ error: '脚本不存在' });
      const base64 = await getFileContent(script.file_path_obfuscated);
      const scriptBuf = Buffer.from(base64, 'base64');
      // 生成SSK
      const SSK_RAW = crypto.randomBytes(32);
      console.log('明文SSK:', SSK_RAW.toString('hex'));
      // AES-GCM加密脚本
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', SSK_RAW, iv);
      let encrypted = cipher.update(scriptBuf);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();
      const ENCRYPTED_SCRIPT_BLOB_DATA = Buffer.concat([iv, encrypted, authTag]);
      // RSA-OAEP加密SSK
      const clientPubKey = Buffer.from(client_public_key, 'base64').toString('utf-8');
      console.log('收到公钥:', clientPubKey);
      const ENCRYPTED_SSK_DATA_bytes = crypto.publicEncrypt({ key: clientPubKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, SSK_RAW);
      console.log('加密后SSK(base64):', ENCRYPTED_SSK_DATA_bytes.toString('base64'));
      // 数据库更新
      await pool.query('BEGIN');
      await pool.query('UPDATE "InstallSessionTokens" SET status=$1 WHERE token_value=$2', ['ACTIVATED', install_session_token]);
      await pool.query('INSERT INTO "ActivatedInstallations" (fk_ist_id, hardware_ids_hash, platform_info) VALUES ($1, $2, $3)', [ist.id, crypto.createHash('sha256').update(hardware_ids.join('|')).digest('hex'), platform_info || '']);
      await pool.query('COMMIT');
      // 解析平台
      let osKey = 'default';
      if (platform_info) {
        const plat = platform_info.toLowerCase();
        if (plat.includes('win')) osKey = 'windows';
        else if (plat.includes('linux')) osKey = 'linux';
        else if (plat.includes('darwin') || plat.includes('mac')) osKey = 'darwin';
      }
      let execConf = script.execution_config || {};
      if (typeof execConf === 'string') execConf = JSON.parse(execConf);
      let execMeta = execConf[osKey] || execConf['default'] || {};
      // 响应
      res.json({
        encrypted_session_script_key: ENCRYPTED_SSK_DATA_bytes.toString('base64'),
        encrypted_script_blob: ENCRYPTED_SCRIPT_BLOB_DATA.toString('base64'),
        script_execution_metadata: execMeta,
        status: "success"
      });
    } catch (e) {
      await pool.query('ROLLBACK').catch(()=>{});
      res.status(500).json({ error: '激活失败' });
    }
  });

  return router;
}; 