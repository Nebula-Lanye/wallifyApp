# Wallify 维护者指南

本文件面向仓库维护者和贡献者，说明本地开发、质量检查、Android APK 构建和安全管理。它不包含任何令牌、密码、Keystore 内容或其他凭证值。

## 开发环境

项目基于 Expo SDK 54、React Native 0.81、TypeScript、Expo Router、Express 和 tRPC。建议使用 Node.js 22 与 pnpm 9 安装依赖，并在修改前确认对应的 Expo 原生模块文档。

```bash
pnpm install
pnpm dev
```

常用质量检查命令如下。涉及系统相册、文件选择、保存至相册、启动页或设备权限的改动，应在 Android 与 iOS 真机上完成额外验证。

```bash
pnpm check
pnpm test
pnpm android
pnpm ios
```

## Android APK 构建

GitHub Actions 工作流位于 [`.github/workflows/build.yml`](../.github/workflows/build.yml)。它在 `ubuntu-latest` 运行器中配置 pnpm、Node.js 22、JDK 17 与 Android SDK，并通过 `eas build --local --platform android` 生成 APK。构建成功后，APK 会作为 Actions Artifact 保存 14 天。

| 操作 | 说明 |
| --- | --- |
| 触发构建 | 在 GitHub **Actions** 中选择 **Build Android APK**，再点击 **Run workflow**。 |
| 下载产物 | 从对应运行记录的 **Artifacts** 区域下载 `wallify-android-apk`。 |
| 覆盖安装 | 每次对外发布时递增 Android `versionCode` 与 iOS `buildNumber`。 |

## GitHub Actions Secrets

工作流仅通过 GitHub Actions Secrets 读取认证和 Android 签名材料。以下表格只列出 Secret 名称及用途，任何实际值都不得写入代码、文档、Issue、Actions 日志或提交历史。

| Secret 名称 | 用途 |
| --- | --- |
| `EXPO_TOKEN` | EAS 命令认证。 |
| `KEYSTORE_BASE64` | Android 签名 Keystore 的 Base64 编码。 |
| `KEYSTORE_PASSWORD` | Keystore 密码。 |
| `KEY_ALIAS` | Android 签名别名。 |
| `KEY_PASSWORD` | 签名别名对应的密码。 |

## 安全要求

请勿提交 `.env`、`credentials.json`、`.jks`、`.keystore`、`.pem`、`.key` 或任何包含令牌、密码与 Cookie 的文件。提交前应运行类型检查、测试和凭证模式扫描；如果任何访问令牌曾出现在终端历史、聊天记录或日志中，请立即轮换并撤销旧令牌。

项目的敏感信息审查记录位于 [仓库敏感信息审查报告](repository-sensitive-information-audit-2026-08-26.md)。
