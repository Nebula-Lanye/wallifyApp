# Wallify

Wallify 是面向 [Wallify 壁纸分享网站](https://lkr2312.dpdns.org) 的原生移动应用。它将壁纸浏览、搜索、收藏、随机二次元内容、账户资料和壁纸上传集中在 Android 与 iOS 应用中完成，减少跳转浏览器的使用场景。

当前应用版本为 **v1.7.355**。Android `versionCode` 与 iOS `buildNumber` 均为 **5**，因此从较早版本更新时可以正常覆盖安装。

## 核心功能

| 功能区域 | 当前能力 |
| --- | --- |
| 壁纸发现 | 浏览最新上传、游戏分类和关键词搜索；列表支持下拉刷新。 |
| 壁纸详情 | 按原图比例展示，显示分辨率与文件大小，并支持收藏、分享和保存到系统相册。 |
| 随机二次元 | 提供多来源、多分类的随机图片与动图浏览，可回退上一张并保存内容。 |
| 账户资料 | 支持登录、仅凭用户 ID 关联公开资料、查看公开统计、编辑资料和上传头像。 |
| 壁纸上传 | 使用 Android 系统图片提供器或 iOS 系统照片选择器，支持单张图片上传与完成反馈。 |
| 网络状态 | 官网返回 521、网关异常、超时或无法连接时，显示明确原因与“重新连接”操作。 |

## 技术栈

应用以 Expo SDK 54、React Native 0.81、TypeScript 和 Expo Router 构建。界面使用 NativeWind 与 React Native Reanimated，远程数据通过 Express 服务端代理和 tRPC 访问，并使用 Axios 请求 Wallify 官网内容。

| 层级 | 主要技术 |
| --- | --- |
| 移动端 | Expo、React Native、Expo Router、TypeScript |
| 样式与交互 | NativeWind、React Native Reanimated、Expo Haptics |
| 服务端 | Express、tRPC、Axios |
| 原生能力 | Image Picker、Document Picker、Media Library、Secure Store |
| 测试与质量 | Vitest、TypeScript、Expo 配置解析 |

## 本地开发

开始前，请准备 Node.js 22、pnpm 9 和对应平台的 Expo 开发环境。克隆仓库并安装依赖后，以下命令会同时启动应用代理服务和 Expo 开发服务器。

```bash
pnpm install
pnpm dev
```

常用开发与质量检查命令如下。Android 或 iOS 真机开发需要通过 Expo 开发环境连接设备；壁纸保存、头像选择和系统文件提供器等功能应在真机上验证。

```bash
pnpm check
pnpm test
pnpm android
pnpm ios
```

## 构建 Android APK

仓库提供 [GitHub Actions 工作流](.github/workflows/build.yml)，可在 GitHub 的 **Actions** 页面手动触发 **Build Android APK**。工作流使用 Ubuntu、JDK 17 和 Android SDK，在 GitHub 运行器内执行 `eas build --local --platform android`，构建完成后会将 APK 上传为可下载的 Artifact。

| 构建步骤 | 操作 |
| --- | --- |
| 1 | 打开仓库的 **Actions** 页面。 |
| 2 | 选择 **Build Android APK**。 |
| 3 | 点击 **Run workflow**，等待本地 Android 构建完成。 |
| 4 | 在对应运行记录的 **Artifacts** 区域下载 `wallify-android-apk`。 |

## GitHub Actions 密钥配置

构建工作流只读取 GitHub Actions Secrets，仓库中不应保存任何密钥值、签名文件或 `credentials.json`。请在仓库的 **Settings → Secrets and variables → Actions** 中配置下列名称；README 仅列出名称，不包含任何值。

| Secret 名称 | 用途 |
| --- | --- |
| `EXPO_TOKEN` | EAS 命令认证。 |
| `KEYSTORE_BASE64` | Android 签名 Keystore 的 Base64 编码。 |
| `KEYSTORE_PASSWORD` | Keystore 密码。 |
| `KEY_ALIAS` | Android 签名别名。 |
| `KEY_PASSWORD` | 签名别名对应的密码。 |

> **安全提示：** 不要提交 `.env`、`credentials.json`、`.jks`、`.keystore`、`.pem`、`.key` 或任何令牌与密码。若令牌曾出现在聊天、终端历史或日志中，请立即轮换并撤销旧令牌。

## 项目结构

```text
app/                 Expo Router 页面与标签导航
components/          可复用界面组件和错误状态
server/              Wallify 官网代理、会话和数据路由
hooks/               本地账户与公开资料状态
lib/                 tRPC、图片选择和错误转换工具
tests/               Vitest 自动化测试
assets/images/       应用图标与启动页资源
.github/workflows/   GitHub Actions APK 构建流程
docs/                面向用户的版本更新日志与项目文档
```

## 贡献与问题排查

提交改动前请运行 `pnpm check` 和 `pnpm test`。如官网暂时返回 521 或网络异常，应用会保留可用的本地内容并提供重试入口；该提示不能代替服务器修复，官网恢复后再次点击“重新连接”即可重新请求内容。

## 参考资源

- [Expo 文档](https://docs.expo.dev/)
- [Expo EAS 本地构建文档](https://docs.expo.dev/build-reference/local-builds/)
- [GitHub Actions 文档](https://docs.github.com/actions)
