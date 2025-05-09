package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
)

func main() {
	// 生成32字节的随机数
	salt := make([]byte, 32)
	_, err := rand.Read(salt)
	if err != nil {
		fmt.Fprintf(os.Stderr, "生成随机数失败: %v\n", err)
		os.Exit(1)
	}

	// 转换为base64编码
	saltBase64 := base64.StdEncoding.EncodeToString(salt)

	// 输出编译命令
	fmt.Printf("生成的随机盐值: %s\n\n", saltBase64)
	fmt.Printf("编译命令:\ngo build -ldflags \"-X main.SaltForPrivateKeyEncryption=%s\" ./cmd/main.go\n", saltBase64)
}
