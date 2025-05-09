import dotenv from 'dotenv';
dotenv.config();
import { Octokit } from '@octokit/rest';

// 初始化Octokit
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// 上传文件到GitHub指定路径
export async function uploadFile(filePath, contentBase64, message) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  console.log('uploadFile:', { owner, repo, filePath });
  return octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: message || `upload ${filePath}`,
    content: contentBase64,
    committer: { name: 'script-bot', email: 'script-bot@users.noreply.github.com' },
    author: { name: 'script-bot', email: 'script-bot@users.noreply.github.com' },
  });
}

// 删除GitHub文件
export async function deleteFile(filePath, message) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  console.log('deleteFile:', { owner, repo, filePath });
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
  return octokit.repos.deleteFile({
    owner,
    repo,
    path: filePath,
    message: message || `delete ${filePath}`,
    sha: data.sha,
    committer: { name: 'script-bot', email: 'script-bot@users.noreply.github.com' },
    author: { name: 'script-bot', email: 'script-bot@users.noreply.github.com' },
  });
}

// 获取GitHub文件内容（base64）
export async function getFileContent(filePath) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  console.log('getFileContent:', { owner, repo, filePath });
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
  return data.content;
}

// 检查文件是否存在
export async function fileExists(filePath) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  console.log('fileExists:', { owner, repo, filePath });
  try {
    await octokit.repos.getContent({ owner, repo, path: filePath });
    return true;
  } catch (e) {
    return false;
  }
} 