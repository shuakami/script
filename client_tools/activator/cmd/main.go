//go:build !cgo
// +build !cgo

// 本程序为生产环境版本，在不改变业务逻辑的前提下，
// 提升整体安全性(SS+ 等级)、性能、日志与进度条表现。

package main

import (
	"bytes"
	"crypto"
	"crypto/rsa"
	"encoding/base64"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"runtime/debug"
	"strings"
	"time"

	"activator/internal"

	"github.com/fatih/color"
	progressbar "github.com/schollz/progressbar/v3"
	"go.uber.org/zap"
)

// -----------------------------------------------------------------------------
// 常量与全局变量
// -----------------------------------------------------------------------------

// Version 定义软件版本
const Version = "1.0.0"

var (
	// 编译时通过 -ldflags 注入盐值，以强化密钥衍生：
	// go build -ldflags "-X main.SaltForPrivateKeyEncryption=$(openssl rand -hex 16) -X main.ApiURL=https://your.api.url -s -w -buildmode=pie -linkmode=external -extldflags='-Wl,-zrelro,-znow'"
	SaltForPrivateKeyEncryption string
	ApiURL                      string

	// 配色方案（Material Design inspired)
	titleColor    = color.New(color.FgHiCyan)
	infoColor     = color.New(color.FgCyan)
	successColor  = color.New(color.FgHiGreen)
	errorColor    = color.New(color.FgRed)
	progressColor = color.New(color.FgHiBlue)
	detailColor   = color.New(color.FgHiBlack)

	// 结构化日志对象 (zap) —— 在 init() 中初始化
	logger *zap.SugaredLogger
)

// -----------------------------------------------------------------------------
// 初始化函数
// -----------------------------------------------------------------------------

func init() {
	// 初始化 zap 结构化日志，文件 + 终端双通道输出
	cfg := zap.NewProductionConfig()
	cfg.OutputPaths = []string{"stdout", "activator.log"}
	cfg.ErrorOutputPaths = []string{"stderr", "activator.log"}
	coreLogger, err := cfg.Build()
	if err != nil {
		panic(fmt.Sprintf("无法初始化日志系统: %v", err))
	}
	logger = coreLogger.Sugar()
}

// -----------------------------------------------------------------------------
// banner & 进度条
// -----------------------------------------------------------------------------

// printBanner 打印启动横幅
func printBanner() {
	titleColor.Printf("Client Toolset v%s | %s-%s\n", Version, runtime.GOOS, runtime.GOARCH)
	titleColor.Println(strings.Repeat("─", 60))
}

// createProgressBar 创建实时进度条（0~100）
func createProgressBar() *progressbar.ProgressBar {
	return progressbar.NewOptions(100,
		progressbar.OptionEnableColorCodes(true),
		progressbar.OptionSetWidth(40),
		progressbar.OptionSetDescription("[cyan]准备中..."),
		progressbar.OptionSetTheme(progressbar.Theme{
			Saucer:        "[cyan]━",
			SaucerHead:    "[cyan]▶",
			SaucerPadding: "-",
			BarStart:      "[",
			BarEnd:        "]",
		}),
		progressbar.OptionShowCount(),
		progressbar.OptionThrottle(65*time.Millisecond), // 控制刷新频率，避免过度占用 CPU
		progressbar.OptionOnCompletion(func() { fmt.Println() }),
	)
}

// stepToPercent 将步骤序号映射为目标百分比
func stepToPercent(step, totalSteps int) int {
	// 均匀分布，多余百分比在最后一步补齐
	base := 100 / totalSteps
	if step == totalSteps {
		return 100
	}
	return step * base
}

// smoothAdvance 平滑推进进度条到指定百分比
func smoothAdvance(bar *progressbar.ProgressBar, target int) {
	current := int(bar.State().CurrentPercent * 100)
	if target <= current {
		return
	}
	for i := current; i <= target; i++ {
		_ = bar.Set(i)
		time.Sleep(15 * time.Millisecond)
	}
}

// updateProgress 更新进度描述并推进到百分比
func updateProgress(bar *progressbar.ProgressBar, step, totalSteps int, message string) {
	pct := stepToPercent(step, totalSteps)
	bar.Describe(fmt.Sprintf("[cyan]%s", message))
	smoothAdvance(bar, pct)
}

// -----------------------------------------------------------------------------
// 错误处理
// -----------------------------------------------------------------------------

// printError 统一错误处理，输出到屏幕 + 日志，并安全退出
func printError(prefix string, err error) {
	// 彩色输出
	errorColor.Printf("\n⚠ %s\n", prefix)
	detailColor.Printf("  %v\n", err)

	// 日志记录（包含堆栈）
	logger.Errorf("%s: %v", prefix, err)
	logger.Debug(string(debug.Stack()))

	// 如果是脚本执行错误，尽量输出 stderr
	if exitErr, ok := err.(*exec.ExitError); ok && exitErr.Stderr != nil {
		scriptOutput := string(exitErr.Stderr)
		if scriptOutput != "" {
			detailColor.Println("\n程序输出:")
			for _, line := range strings.Split(scriptOutput, "\n") {
				if line != "" {
					detailColor.Printf("  %s\n", line)
				}
			}
		}
	}

	// 堆栈信息（只突出 activator 项目相关行）
	stackLines := strings.Split(string(debug.Stack()), "\n")
	detailColor.Println("\n调用堆栈:")
	for i, line := range stackLines {
		if i < 2 || line == "" { // 跳过 debug.Stack 自身
			continue
		}
		if strings.Contains(line, "activator/") {
			progressColor.Printf("  → %s\n", line)
		}
	}

	// 系统环境
	detailColor.Println("\n系统环境:")
	detailColor.Printf("  • 操作系统: %s\n", runtime.GOOS)
	detailColor.Printf("  • 系统架构: %s\n", runtime.GOARCH)
	detailColor.Printf("  • Go版本: %s\n", runtime.Version())

	fmt.Println()
	logger.Sync()
	os.Exit(1)
}

// -----------------------------------------------------------------------------
// 内存擦除辅助函数（覆盖敏感字节）
// -----------------------------------------------------------------------------

func wipe(b []byte) {
	for i := range b {
		b[i] = 0
	}
}

// -----------------------------------------------------------------------------
// 主程序入口
// -----------------------------------------------------------------------------

func main() {
	printBanner()

	// -------------------- 解析命令行参数 --------------------
	installSessionToken := flag.String("token", "", "安装会话令牌")
	flag.Parse()

	if *installSessionToken == "" {
		printError("配置无效", fmt.Errorf("请提供安装会话令牌 (使用 --token 参数)"))
	}

	// -------------------- 环境变量检查 -> 改为检查编译时注入的 API 地址 --------------------
	if ApiURL == "" {
		printError("配置无效", fmt.Errorf("程序编译不完整：缺失 API 地址"))
	}

	// -------------------- 初始化进度条 --------------------
	const totalSteps = 8
	bar := createProgressBar()
	defer bar.Close()

	// -------------------- 步骤 1：收集系统信息 --------------------
	updateProgress(bar, 1, totalSteps, "正在收集系统信息")
	standardizedSysInfo := internal.GetStandardizedSysInfoV1_1()

	// -------------------- 步骤 2：派生密钥 --------------------
	updateProgress(bar, 2, totalSteps, "正在初始化安全组件")
	salt := []byte(SaltForPrivateKeyEncryption)
	_ = internal.DeriveSysInfoBindKeyV1_1(salt)

	// -------------------- 步骤 3：验证系统环境 --------------------
	updateProgress(bar, 3, totalSteps, "正在验证系统环境")
	allUnavailable := true
	for _, v := range standardizedSysInfo {
		if v != internal.SysInfoUnavailable {
			allUnavailable = false
			break
		}
	}
	if allUnavailable {
		printError("环境检查失败", fmt.Errorf("无法获取必要的系统信息，请检查程序权限"))
	}

	// -------------------- 步骤 4：生成密钥对 --------------------
	updateProgress(bar, 4, totalSteps, "正在生成安全密钥")
	privKey, err := internal.GenerateRSAKeyPair()
	if err != nil {
		printError("密钥生成失败", err)
	}
	pubKeyPEM, _ := internal.EncodePublicKeyToPEM(&privKey.PublicKey)

	// -------------------- 步骤 5：准备验证信息 --------------------
	updateProgress(bar, 5, totalSteps, "正在准备验证信息")
	pubKeyBase64 := base64.StdEncoding.EncodeToString(pubKeyPEM)
	platformInfo := fmt.Sprintf("%s-%s", runtime.GOOS, runtime.GOARCH)
	apiReq := &internal.ActivateMachineRequest{
		InstallSessionToken: *installSessionToken,
		HardwareIDs:         standardizedSysInfo,
		ClientPublicKey:     pubKeyBase64,
		PlatformInfo:        platformInfo + ",SysInfoSpec=" + internal.SysInfoSpecVersion,
	}

	// -------------------- 步骤 6：调用激活 API --------------------
	updateProgress(bar, 6, totalSteps, "正在验证客户端")
	apiResp, err := internal.CallActivateMachineAPI(ApiURL, apiReq)
	if err != nil {
		printError("验证失败", err)
	}

	// -------------------- 步骤 7：处理响应数据 --------------------
	updateProgress(bar, 7, totalSteps, "正在处理响应数据")
	logger.Debugw("解密API响应中的SSK", "encryptedSSK_base64", apiResp.EncryptedSessionScriptKey)

	encryptedSSK, err := internal.DecodeBase64String(apiResp.EncryptedSessionScriptKey)
	if err != nil {
		printError("数据处理失败 (SSK Base64解码)", err)
	}
	encryptedScript, err := internal.DecodeBase64String(apiResp.EncryptedScriptBlob)
	if err != nil {
		printError("数据处理失败 (ScriptBlob Base64解码)", err)
	}

	// 使用OAEP SHA256解密SSK
	sskRaw, err := privKey.Decrypt(nil, encryptedSSK, &rsa.OAEPOptions{Hash: crypto.SHA256, Label: nil})
	if err != nil {
		logger.Errorw("使用OAEP解密SSK失败", "error", err)
		printError("数据解密失败 (OAEP)", err)
	}
	defer wipe(sskRaw) // 使用后立即擦除

	if len(encryptedScript) < 12 {
		printError("数据验证失败", fmt.Errorf("响应数据格式无效"))
	}
	nonce := encryptedScript[:12]
	ciphertext := encryptedScript[12:]
	decryptedScript, err := internal.AESGCMDecrypt(sskRaw, nonce, ciphertext)
	if err != nil {
		printError("数据解密失败", err)
	}
	defer wipe(decryptedScript)

	// -------------------- 步骤 8：执行配置脚本 --------------------
	updateProgress(bar, 8, totalSteps, "正在完成配置")
	meta := apiResp.ScriptExecutionMetadata
	cmd := exec.Command(meta.Interpreter, meta.Args...)
	cmd.Stdin = bytes.NewReader(decryptedScript)

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf

	start := time.Now()
	err = cmd.Run()
	duration := time.Since(start)

	logger.Infow("脚本执行完成", "duration", duration.String())

	if err != nil {
		errorMsg := fmt.Sprintf("配置过程发生错误:\n%s\n%s", stdoutBuf.String(), stderrBuf.String())
		printError("配置失败", fmt.Errorf(errorMsg))
	}

	// -------------------- 全部完成 --------------------
	_ = bar.Finish()
	fmt.Println()
	successColor.Println("✓ 配置完成")
	infoColor.Println("程序已安全退出")
	logger.Sync()
}
