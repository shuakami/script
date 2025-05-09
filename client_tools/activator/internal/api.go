package internal

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// 激活请求体结构体
// 用于发送到 /api/activate-machine
// 字段名需与后端API一致
// client_public_key 需 base64 编码
// hardware_ids 为字符串数组
// platform_info 可选

type ActivateMachineRequest struct {
	InstallSessionToken string   `json:"install_session_token"`
	HardwareIDs         []string `json:"hardware_ids"`
	ClientPublicKey     string   `json:"client_public_key"`
	PlatformInfo        string   `json:"platform_info"`
}

// 激活响应体结构体
// encrypted_session_script_key, encrypted_script_blob, launcher_download_url, script_execution_metadata

type ScriptExecutionMetadata struct {
	Interpreter string   `json:"interpreter"`
	Args        []string `json:"args"`
	TypeHint    string   `json:"type_hint"`
}

type ActivateMachineResponse struct {
	EncryptedSessionScriptKey string                  `json:"encrypted_session_script_key"`
	EncryptedScriptBlob       string                  `json:"encrypted_script_blob"`
	LauncherDownloadURL       string                  `json:"launcher_download_url"`
	ScriptExecutionMetadata   ScriptExecutionMetadata `json:"script_execution_metadata"`
}

// 调用API进行激活，返回响应结构体
func CallActivateMachineAPI(apiURL string, reqBody *ActivateMachineRequest) (*ActivateMachineResponse, error) {
	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}
	resp, err := http.Post(apiURL+"/api/activate-machine", "application/json", bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API请求失败: %s", string(body))
	}
	var apiResp ActivateMachineResponse
	decoder := json.NewDecoder(resp.Body)
	if err := decoder.Decode(&apiResp); err != nil {
		return nil, err
	}
	return &apiResp, nil
}

// base64解码工具
func DecodeBase64String(s string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(s)
}
