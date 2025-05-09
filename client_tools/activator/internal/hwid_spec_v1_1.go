package internal

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// * 系统信息收集模块 V1.1
// * Author: Shuakami
// * Date: 2025-05-09

const (
	SysInfoSpecVersion = "V1.1"
	SysInfoUnavailable = "INFO_UNAVAILABLE_V1.1"
)

// 获取5项系统信息，返回规范化后的字符串切片
func GetStandardizedSysInfoV1_1() []string {
	var infos [5]string
	needElevate := false
	alreadyElevated := os.Getenv("ELEVATE_FLAG") == "1"
	AppendTestLog("GetStandardizedSysInfoV1_1 start, alreadyElevated: " + fmt.Sprint(alreadyElevated))

	switch runtime.GOOS {
	case "windows":
		tmp, ne := getInfoWithElevateWin(
			[]cmdSpec{
				{"powershell", []string{"-Command", "Get-WmiObject -Class Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID"}},
			},
			1,
			"info1",
		)
		infos[0] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateWin(
			[]cmdSpec{
				{"powershell", []string{"-Command", `Get-WmiObject -Class Win32_BIOS | Select-Object -ExpandProperty SerialNumber`}},
				{"powershell", []string{"-Command", `Get-ItemPropertyValue -Path 'HKLM:\HARDWARE\DESCRIPTION\System\BIOS' -Name 'BIOSSerialNumber'`}},
				{"powershell", []string{"-Command", `Get-WmiObject -Namespace 'root\cimv2\mdm\dmmap' -Class 'MSFT_Firmware' | Select-Object -ExpandProperty SerialNumber`}},
			},
			1,
			"info2",
		)
		infos[1] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateWin(
			[]cmdSpec{
				{"powershell", []string{"-Command", "Get-WmiObject -Class Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer"}},
			},
			1,
			"info3",
		)
		infos[2] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateWin(
			[]cmdSpec{
				{"powershell", []string{"-Command", "Get-WmiObject -Class Win32_ComputerSystem | Select-Object -ExpandProperty Model"}},
			},
			1,
			"info4",
		)
		infos[3] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateWin(
			[]cmdSpec{
				{"powershell", []string{"-Command", `Get-PhysicalDisk | Where-Object {$_.MediaType -ne 'Unspecified'} | Select-Object -First 1 -ExpandProperty SerialNumber`}},
				{"powershell", []string{"-Command", `Get-WmiObject Win32_DiskDrive | Where-Object {$_.MediaType -like '*Fixed hard disk*'} | Select-Object -First 1 -ExpandProperty SerialNumber`}},
			},
			0,
			"info5",
		)
		infos[4] = tmp
		needElevate = needElevate || ne
	case "linux":
		tmp, ne := getInfoWithElevateLinux(
			[]fileOrCmdSpec{
				{"file", "/sys/class/dmi/id/product_uuid"},
				{"cmd", "dmidecode -s system-uuid"},
			},
			"info1",
		)
		infos[0] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateLinux(
			[]fileOrCmdSpec{
				{"file", "/sys/class/dmi/id/board_serial"},
				{"cmd", "dmidecode -s baseboard-serial-number"},
			},
			"info2",
		)
		infos[1] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateLinux(
			[]fileOrCmdSpec{
				{"file", "/sys/class/dmi/id/sys_vendor"},
				{"cmd", "dmidecode -s system-manufacturer"},
			},
			"info3",
		)
		infos[2] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateLinux(
			[]fileOrCmdSpec{
				{"file", "/sys/class/dmi/id/product_name"},
				{"cmd", "dmidecode -s system-product-name"},
			},
			"info4",
		)
		infos[3] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateLinux(
			[]fileOrCmdSpec{
				{"file", "/sys/block/sda/serial"},
				{"file", "/sys/block/nvme0n1/serial"},
				{"cmd", `lsblk -ndo SERIAL $(lsblk -no pkname $(df / | awk 'NR==2{print $1}')) | head -n 1`},
			},
			"info5",
		)
		infos[4] = tmp
		needElevate = needElevate || ne
	case "darwin":
		tmp, ne := getInfoWithElevateMac([]string{`system_profiler SPHardwareDataType | grep 'Hardware UUID' | awk '{print $3}'`}, "info1")
		infos[0] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateMac([]string{`system_profiler SPHardwareDataType | grep 'Serial Number (system)' | awk '{print $4}'`}, "info2")
		infos[1] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateMac([]string{`system_profiler SPHardwareDataType | grep 'Model Identifier' | awk '{print $3}'`}, "info3")
		infos[2] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateMac([]string{`system_profiler SPHardwareDataType | grep 'Model Name' | sed 's/.*: //'`}, "info4")
		infos[3] = tmp
		needElevate = needElevate || ne

		tmp, ne = getInfoWithElevateMac(
			[]string{
				`diskutil info disk0 | grep "Serial Number" | awk -F': ' '{print $2}'`,
				`system_profiler SPNVMeDataType | grep "Serial Number" | awk -F': ' '{print $2}' | head -n 1`,
				`system_profiler SPSerialATADataType | grep "Serial Number" | awk -F': ' '{print $2}' | head -n 1`,
			},
			"info5",
		)
		infos[4] = tmp
		needElevate = needElevate || ne
	}

	AppendTestLog("GetStandardizedSysInfoV1_1, needElevate: " + fmt.Sprint(needElevate) + ", alreadyElevated: " + fmt.Sprint(alreadyElevated))
	if needElevate && !alreadyElevated {
		AppendTestLog("elevateAndRerunForInfo called")
		elevateAndRerunForInfo()
		os.Exit(0)
	}

	return infos[:]
}

type cmdSpec struct {
	Name string
	Args []string
}

type fileOrCmdSpec struct {
	Type string // "file" or "cmd"
	Val  string
}

// Windows: 多方式+提权
func getInfoWithElevateWin(cmds []cmdSpec, skipHeader int, infoName string) (string, bool) {
	AppendTestLog("getInfoWithElevateWin for " + infoName)
	for i, c := range cmds {
		AppendTestLog(fmt.Sprintf("  attempt %d: %s %v", i+1, c.Name, c.Args))
		out, err := exec.Command(c.Name, c.Args...).CombinedOutput()
		if err != nil {
			AppendTestLog(fmt.Sprintf("    error: %v, output: %s", err, string(out)))
			if strings.Contains(strings.ToLower(err.Error()), "access is denied") || strings.Contains(strings.ToLower(err.Error()), "privileges") {
				return SysInfoUnavailable, true
			}
			continue
		}
		AppendTestLog(fmt.Sprintf("    success, output: %s", string(out)))
		id := getAndNormalizeInfo(string(out), skipHeader)
		if id != SysInfoUnavailable {
			return id, false
		}
	}
	AppendTestLog("  all attempts failed for " + infoName + ", returning unavailable, no elevation needed from this path")
	return SysInfoUnavailable, false
}

// Linux: 多方式+提权
func getInfoWithElevateLinux(specs []fileOrCmdSpec, infoName string) (string, bool) {
	AppendTestLog("getInfoWithElevateLinux for " + infoName)
	for i, s := range specs {
		var out []byte
		var err error
		if s.Type == "file" {
			AppendTestLog(fmt.Sprintf("  attempt %d (file): %s", i+1, s.Val))
			out, err = exec.Command("cat", s.Val).CombinedOutput()
		} else if s.Type == "cmd" {
			AppendTestLog(fmt.Sprintf("  attempt %d (cmd): %s", i+1, s.Val))
			out, err = exec.Command("bash", "-c", s.Val).CombinedOutput()
		}
		if err != nil {
			AppendTestLog(fmt.Sprintf("    error: %v, output: %s", err, string(out)))
			if strings.Contains(strings.ToLower(err.Error()), "permission denied") {
				return SysInfoUnavailable, true
			}
			continue
		}
		AppendTestLog(fmt.Sprintf("    success, output: %s", string(out)))
		id := getAndNormalizeInfo(string(out), 0)
		if id != SysInfoUnavailable {
			return id, false
		}
	}
	AppendTestLog("  all attempts failed for " + infoName + ", returning unavailable, no elevation needed from this path")
	return SysInfoUnavailable, false
}

// macOS: 多方式+提权
func getInfoWithElevateMac(cmds []string, infoName string) (string, bool) {
	AppendTestLog("getInfoWithElevateMac for " + infoName)
	for i, c := range cmds {
		AppendTestLog(fmt.Sprintf("  attempt %d: %s", i+1, c))
		out, err := exec.Command("bash", "-c", c).CombinedOutput()
		if err != nil {
			AppendTestLog(fmt.Sprintf("    error: %v, output: %s", err, string(out)))
			continue
		}
		AppendTestLog(fmt.Sprintf("    success, output: %s", string(out)))
		id := getAndNormalizeInfo(string(out), 0)
		if id != SysInfoUnavailable {
			return id, false
		}
	}
	AppendTestLog("  all attempts failed for " + infoName)
	return SysInfoUnavailable, true
}

// 自动提权重启自身（与main.go一致，支持HWID场景）
func elevateAndRerunForInfo() {
	args := os.Args[1:]
	newEnv := os.Environ()
	newEnv = append(newEnv, "ELEVATE_FLAG=1")

	if runtime.GOOS == "windows" {
		exe, _ := os.Executable()
		cmdArgs := []string{"-Command", "Start-Process", exe, "-ArgumentList", "'" + strings.Join(args, "' '") + "'", "-Verb", "runAs"}
		cmd := exec.Command("powershell", cmdArgs...)
		cmd.Env = newEnv
		cmd.Stdout = nil
		cmd.Stderr = nil
		_ = cmd.Run()
	} else if runtime.GOOS == "linux" || runtime.GOOS == "darwin" {
		exe, _ := os.Executable()
		cmdArgs := append([]string{"-E", exe}, args...)
		cmd := exec.Command("sudo", cmdArgs...)
		cmd.Env = newEnv
		cmd.Stdout = nil
		cmd.Stderr = nil
		_ = cmd.Run()
	}
}

// 规范化处理：去首尾空格、转大写、去除- : 空格，空值用占位符
func getAndNormalizeInfo(raw string, skipHeader int) string {
	if skipHeader > 0 {
		lines := strings.Split(raw, "\n")
		for _, line := range lines[skipHeader:] {
			line = strings.TrimSpace(line)
			if line != "" {
				raw = line
				break
			}
		}
	}
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return SysInfoUnavailable
	}
	raw = strings.ToUpper(raw)
	raw = strings.ReplaceAll(raw, "-", "")
	raw = strings.ReplaceAll(raw, ":", "")
	raw = strings.ReplaceAll(raw, " ", "")
	if raw == "" {
		return SysInfoUnavailable
	}
	return raw
}

// 执行命令并返回输出
func runCmd(name string, args ...string) string {
	cmd := exec.Command(name, args...)
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return string(out)
}

// 读取文件首行
func readFileLine(path string) string {
	f, err := exec.Command("cat", path).Output()
	if err != nil {
		return ""
	}
	s := string(f)
	return strings.Split(strings.TrimSpace(s), "\n")[0]
}

// macOS专用命令
func runMacCmd(cmd string) string {
	c := exec.Command("bash", "-c", cmd)
	out, err := c.Output()
	if err != nil {
		return ""
	}
	return string(bytes.TrimSpace(out))
}

// 获取最终拼接字符串（顺序1-4，无分隔符）
func GetFinalConcatenatedSysInfoStringV1_1() string {
	infos := GetStandardizedSysInfoV1_1()
	return strings.Join(infos, "")
}

// 获取最终派生密钥（HMAC-SHA256）
func DeriveSysInfoBindKeyV1_1(salt []byte) []byte {
	finalStr := GetFinalConcatenatedSysInfoStringV1_1()
	mac := hmac.New(sha256.New, salt)
	mac.Write([]byte(finalStr))
	return mac.Sum(nil)
}
