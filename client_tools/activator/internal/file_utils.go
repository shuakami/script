package internal

import (
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// 保存字节数据到文件
func SaveToFile(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(path, data, perm)
}

// 下载文件并保存到指定路径
func DownloadFile(url, destPath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	out, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	return err
}

// 设置文件为可执行（仅限Linux/macOS）
func SetExecutable(path string) error {
	if runtime.GOOS == "windows" {
		return nil // Windows下无需设置
	}
	return os.Chmod(path, 0755)
}

// 自动运行Launcher并等待其结束
func RunLauncher(launcherPath string) error {
	cmd := exec.Command(launcherPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// 获取Launcher文件名（根据平台）
func GetLauncherFileName() string {
	if runtime.GOOS == "windows" {
		return "Launcher.exe"
	}
	return "Launcher"
}

// 拼接完整路径
func JoinPath(elem ...string) string {
	return filepath.Join(elem...)
}

// 日志写入到log.txt，避免与test.txt混淆
func AppendTestLog(msg string) {
	f, _ := os.OpenFile("log.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	defer f.Close()
	f.WriteString(msg + "\n")
}
