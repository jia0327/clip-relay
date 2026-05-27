# 调试证据目录

本目录用于存放逆向分析、调试过程中的原始数据。

## 目录结构

```
evidence/
├── request/      # HTTP/WebSocket 请求样本
├── response/     # 响应样本
├── websocket/    # WebSocket 消息记录
├── sign/         # 签名样本/分析
├── wasm/         # WASM 相关
├── protobuf/     # Protobuf 数据
└── trace/        # 调试 trace
```

## 使用规则

- 保留原始数据（JSON 格式）
- 文件命名：`{timestamp}_{type}_{description}.json`
- 禁止存放真实凭证/密钥
- 定期清理无效数据