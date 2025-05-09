package internal

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"errors"
)

// 生成RSA密钥对（4096位）
func GenerateRSAKeyPair() (*rsa.PrivateKey, error) {
	return rsa.GenerateKey(rand.Reader, 4096)
}

// 将RSA公钥编码为PEM格式
func EncodePublicKeyToPEM(pub *rsa.PublicKey) ([]byte, error) {
	pubBytes, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		return nil, err
	}
	block := &pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes}
	return pem.EncodeToMemory(block), nil
}

// 将RSA私钥编码为PEM格式
func EncodePrivateKeyToPEM(priv *rsa.PrivateKey) ([]byte, error) {
	privBytes := x509.MarshalPKCS1PrivateKey(priv)
	block := &pem.Block{Type: "RSA PRIVATE KEY", Bytes: privBytes}
	return pem.EncodeToMemory(block), nil
}

// AES-GCM加密
func AESGCMEncrypt(key, plaintext []byte) ([]byte, []byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}
	nonce := make([]byte, aesgcm.NonceSize())
	_, err = rand.Read(nonce)
	if err != nil {
		return nil, nil, err
	}
	ciphertext := aesgcm.Seal(nil, nonce, plaintext, nil)
	return nonce, ciphertext, nil
}

// HMAC-SHA256 派生密钥
func DeriveKeyFromHWIDs(hwids []string, salt []byte) []byte {
	h := hmac.New(sha256.New, salt)
	for _, hwid := range hwids {
		h.Write([]byte(hwid))
	}
	return h.Sum(nil)
}

// AES-GCM解密
func AESGCMDecrypt(key, nonce, ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}
	return plaintext, nil
}

// PEM解码RSA私钥
func DecodePEMToPrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil || block.Type != "RSA PRIVATE KEY" {
		return nil, errors.New("PEM解码失败")
	}
	return x509.ParsePKCS1PrivateKey(block.Bytes)
}
