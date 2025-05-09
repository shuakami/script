import express from 'express';
import { getFileContent, fileExists } from './githubHelper.js';
const Buffer = global.Buffer;

// 支持的平台及后缀
const PLATFORM_MAP = {
  win_x64: 'exe',
  linux_x64: '',
  macos_x64: '',
};

// 下载接口
export default () => {
  const router = express.Router();
  router.get('/download-launcher', async (req, res) => {
    const { platform, version } = req.query;
    if (!platform || !PLATFORM_MAP[platform]) return res.status(400).json({ error: '不支持的平台' });
    const binPath = process.env.GITHUB_LAUNCHER_PATH;
    const ext = PLATFORM_MAP[platform];
    const ver = version ? `_v${version}` : '';
    const fileName = `launcher_${platform}${ver}${ext ? '.' + ext : ''}`;
    const ghPath = `${binPath}/${fileName}`;
    try {
      if (!(await fileExists(ghPath))) return res.status(404).json({ error: '文件不存在' });
      const base64 = await getFileContent(ghPath);
      const buf = Buffer.from(base64, 'base64');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(buf);
    } catch (e) {
      res.status(500).json({ error: '下载失败' });
    }
  });
  return router;
}; 