---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 3557e971c522d890c15c660928e79009_6437ba38a2b611f192a2525400287e28
    ReservedCode1: 8RtS32LlOHPubCuibgmzP6mpo7f7ba46bWjrIJC/jqWKy4+jx1pnS9PmoC9lURtY3uwXuW7PUYUs+XhuGBJ6utuAxMW+Putc7b/PE86XNK+Gs1T8V3PbFz+41F7qhzcP6ayRsZ6vyvASE+t6izTUnBQjEsxMbeUv/fkDR94n/qEp8cDR+lp+6n4f2EA=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 3557e971c522d890c15c660928e79009_6437ba38a2b611f192a2525400287e28
    ReservedCode2: 8RtS32LlOHPubCuibgmzP6mpo7f7ba46bWjrIJC/jqWKy4+jx1pnS9PmoC9lURtY3uwXuW7PUYUs+XhuGBJ6utuAxMW+Putc7b/PE86XNK+Gs1T8V3PbFz+41F7qhzcP6ayRsZ6vyvASE+t6izTUnBQjEsxMbeUv/fkDR94n/qEp8cDR+lp+6n4f2EA=
---

---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 3557e971c522d890c15c660928e79009_8ac2c787a29711f192a2525400287e28
    ReservedCode1: iEEsiavjjhe7Uhdez4tPIdWqN1SW2LpumgA4DpLsJ6L2DVnUDn+Fzbn64bEKMJTjtvLa79qMUpxWr83D6XqFDxaJgd6FUoyAe7pfmpllMmjcauS9w/Uaddw7yuRKuS2+JmKdiMJIt5tEnvG/J3CkeL0RctLysj+27LkSO7nzz4t8c8G3Dk2K4/EnriY=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 3557e971c522d890c15c660928e79009_8ac2c787a29711f192a2525400287e28
    ReservedCode2: iEEsiavjjhe7Uhdez4tPIdWqN1SW2LpumgA4DpLsJ6L2DVnUDn+Fzbn64bEKMJTjtvLa79qMUpxWr83D6XqFDxaJgd6FUoyAe7pfmpllMmjcauS9w/Uaddw7yuRKuS2+JmKdiMJIt5tEnvG/J3CkeL0RctLysj+27LkSO7nzz4t8c8G3Dk2K4/EnriY=
---

# Wallify 壁纸站 AppAPI 接入文档

版本：v1.4（2026-08-28）
适用客户端：Wallify 原生 Android App（Kotlin）

---

## 1. 基本信息

| 项目 | 值 |
|---|---|
| Base URL | `https://lkr2312.dpdns.org/appapi/index.php` |
| 协议 | HTTPS / HTTP 均可用 |
| 数据格式 | JSON（UTF-8） |
| 请求方式 | GET / POST（POST 支持 `application/x-www-form-urlencoded` 与 `application/json`） |
| 字符编码 | utf8mb4 |

### 统一返回格式

```json
{ "success": true, "code": 0, "message": "ok", "data": { } }
```

- 成功：`success=true`，`code=0`，业务数据在 `data`
- 失败：`success=false`，`code` 为业务错误码，`message` 为错误描述，`data=null`
- **HTTP 状态码恒为 200**，业务错误一律通过 `code` 字段区分（服务器 nginx 配置了 error_page 拦截 4xx，返回 4xx 会导致 App 拿到 HTML 而非 JSON）

---

## 2. 认证方式

交互类接口（登录态）需要携带 `token`，获取方式：调用 `register` / `login` 后返回。

token 传递三种方式任选其一：

1. URL 参数：`?action=me&token=xxxx`
2. 表单字段：POST body 中 `token=xxxx`
3. JSON body：`{"token":"xxxx"}`

> token 为 48 位十六进制字符串，有效期 **30 天**（`token_expires_at`），过期后自动失效需重新登录；登出后失效；重新登录会生成新 token 并覆盖旧值。

### 滑动过期与自动续期（v1.4）

- 携带有效 token 的**任意请求**，若剩余有效期 **不足 3 天**，服务端自动将过期时间延长 **30 天**（token 值不变），并在响应头返回新的过期时间：`X-Token-Expires-At: 2026-09-27 15:53:08`（格式 `Y-m-d H:i:s`，UTC+8）。
- 客户端只需在每次接口响应的响应头中读取 `X-Token-Expires-At`，若存在则用它覆盖本地保存的 `expires_at`，即可实现"只要在用就一直有效"的滑动会话。
- 需要立即刷新（换新 token）时可调用 `refresh` 接口：返回全新 token 与新的 `expires_at`，**旧 token 立即作废**（该行为与 logout 相同，用于并发场景兜底）。
- 服务端撤销能力不变：`logout`、账号封禁（`status=0`）、token 自然过期均可立即失效。

---

## 3. 业务错误码

| code | 含义 |
|---|---|
| 0 | 成功 |
| 400 | 参数错误 / 未知 action |
| 401 | 未登录或登录已过期 |
| 404 | 资源不存在（壁纸、评论、安装包） |
| 409 | 用户名或邮箱已被注册 |
| 429 | 操作太频繁（评论 5 秒限 1 条） |

---

## 4. 接口总览

| action | 方法 | 登录 | 说明 |
|---|---|---|---|
| home | GET | 否 | 首页聚合（分类 + 精选 + 最新 + 站点信息） |
| wallpapers | GET | 否 | 壁纸列表（分页 / 分类 / 搜索 / 排序） |
| detail | GET | 否 | 壁纸详情 |
| categories | GET | 否 | 分类列表 |
| random | GET | 否 | 随机壁纸 |
| version | GET | 否 | App 版本检测 |
| register | POST | 否 | 注册 |
| login | POST | 否 | 登录 |
| refresh | POST | 是 | 刷新 token（换新并作废旧 token） |
| logout | POST | 是 | 退出登录 |
| me | GET/POST | 是 | 当前用户信息（含点赞 / 收藏数） |
| like | POST | 是 | 点赞 / 取消点赞（切换） |
| favorite | POST | 是 | 收藏 / 取消收藏（切换） |
| favorites | GET/POST | 是 | 我的收藏列表 |
| comments | GET | 否 | 评论列表（支持子评论过滤） |
| comment | POST | 是 | 发表评论 / 回复评论 |

---

## 5. 接口详情

### 5.1 GET home

首页聚合数据。

请求：
```
GET /appapi/index.php?action=home
```

响应 `data`：
```json
{
  "site": { "site_name": "Wallify壁纸站", "site_description": "原神/星铁/崩坏3/绝区零高清壁纸下载" },
  "categories": [ { "id": 1, "name": "原神", "slug": "genshin", "icon": "", "sort_order": 1 } ],
  "featured": [ /* 精选壁纸，见 5.2 的 items 元素结构 */ ],
  "latest":   [ /* 最新壁纸 */ ]
}
```

### 5.2 GET wallpapers

壁纸列表。

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| page | int | 否 | 1 | 页码 |
| page_size | int | 否 | 20 | 每页数量（1-50） |
| category_id | int | 否 | 0 | 分类 ID（0 为全部） |
| keyword | string | 否 | - | 标题 / 标签模糊搜索 |
| sort | string | 否 | new | `new` 最新 / `hot` 最热 / `random` 随机 |

响应 `data`：
```json
{
  "items": [ {
    "id": 35,
    "category_id": 2,
    "title": "面具、扇影、梅花与列车长",
    "description": "",
    "file_path": "/uploads/wallpapers/wp_xxx.webp",
    "thumbnail_path": "/uploads/wallpapers/thumbs/wp_xxx.webp",
    "width": 1920, "height": 1080, "file_size": 50779558, "file_type": "webp",
    "tags": "星铁,列车长",
    "view_count": 100, "like_count": 3, "favorite_count": 2, "coin_count": 0,
    "is_featured": 1,
    "created_at": "2026-08-01 12:00:00"
  } ],
  "total": 128, "page": 1, "page_size": 20, "has_more": true
}
```

### 5.3 GET detail

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | int | 是 | 壁纸 ID |

响应 `data` 为 5.2 的壁纸元素结构（含完整字段）。壁纸不存在或未上架返回 `code=404`。

### 5.4 GET categor
分类列表，`data` 为分类数组：
```json
[ { "id": 1, "name": "原神", "slug": "genshin", "icon": "", "sort_order": 1 } ]
```

### 5.5 GET random

随机壁纸。支持可选参数 `count`（默认 1，最大 20），返回随机壁纸数组。

### 5.6 GET version

App 版本检测。服务端扫描 `Download/app/wallify-*.apk`，取版本号最新者。

```json
{
  "latest_version": "1.7.305",
  "file_name": "wallify-1.7.305.apk",
  "file_size": 50779558,
  "download_url": "http://lkr2312.dpdns.org/Download/app/wallify-1.7.305.apk",
  "update_time": "2026-08-27 13:35:38"
}
```

App 端升级判断：本地版本号 < `latest_version` 时提示更新。

> 服务端对目录扫描结果做 5 分钟缓存，频繁请求不会重复扫描磁盘。

### 5.7 POST register

注册新账号。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 用户名（唯一） |
| password | string | 是 | 密码，至少 6 位 |
| email | string | 否 | 邮箱（填写时校验格式） |

请求（表单或 JSON 均可）：
```
POST /appapi/index.php?action=register
username=wallify_user&password=123456&email=user@example.com
```

响应 `data`：
```json
{
  "token": "477cdb252a8fc14436a5b2cc3d29d952ec4f9e08b6e8ca10",
  "expires_at": "2026-09-27 15:53:08",
  "user": {
    "id": 10, "username": "wallify_user", "email": "user@example.com",
    "avatar": "/assets/images/default-avatar.png", "bio": "",
    "coins": 100, "created_at": "2026-08-28 12:12:25"
  }
}
```

新用户默认赠送 `coins=100`。用户名或邮箱已存在返回 `code=409`。

### 5.8 POST login

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

密码使用 bcrypt 校验。成功返回结构与 register 相同（含 `token`、`expires_at`、`user`）。

### 5.9 POST refresh

刷新 token：为当前有效登录态生成**全新 token**，并立即作废旧 token。需登录（token 未过期）。

请求（表单或 JSON 均可）：
```
POST /appapi/index.php?action=refresh&token=xxxx
```

响应 `data`（结构与 register/login 相同）：
```json
{
  "token": "9a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7",
  "expires_at": "2026-09-27 16:00:00",
  "user": { "id": 10, "username": "wallify_user" }
}
```

> 旧 token 一经刷新立即失效（返回 401），请客户端务必在收到新 token 后**立刻替换本地存储**。

### 5.10 POST logout

登出，使当前 token 失效。需登录。

```
POST /appapi/index.php?action=logout&token=xxxx
```

响应：`{ "logout": true }`

### 5.11 GET/POST me

当前用户信息。需登录。

响应 `data`：
```json
{
  "id": 10, "username": "wallify_user", "email": "user@example.com",
  "avatar": "/assets/images/default-avatar.png", "bio": "",
  "coins": 100, "created_at": "2026-08-28 12:12:25",
  "like_count": 5, "favorite_count": 3
}
```

### 5.12 POST like

点赞 / 取消点赞（切换操作）。需登录。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| wallpaper_id | int | 是 | 壁纸 ID |

```
POST /appapi/index.php?action=like&token=xxxx&wallpaper_id=35
```

响应：
```json
{ "liked": true, "wallpaper_id": 35, "like_count": 4 }
```

`liked=true` 表示本次为点赞，`false` 表示取消点赞。服务器同步维护壁纸 `like_count`。

### 5.13 POST favorite

收藏 / 取消收藏（切换操作）。需登录。参数与 like 相同。

响应：
```json
{ "is_favorite": true, "wallpaper_id": 35, "favorite_count": 3 }
```

### 5.14 GET/POST favorites

我的收藏列表。需登录。

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| page | int | 否 | 1 | 页码 |
| page_size | int | 否 | 20 | 每页数量 |

响应结构与 wallpapers 相同（`items` 为收藏的壁纸，按收藏时间倒序）。

### 5.15 GET comments

评论列表。无需登录。

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| wallpaper_id | int | 是 | - | 壁纸 ID |
| page | int | 否 | 1 | 页码 |
| page_size | int | 否 | 20 | 每页数量 |
| parent_id | int | 否 | 0 | 只取该评论下的回复（0 为顶层评论） |

响应 `data`：
```json
{
  "items": [ {
    "id": 1, "user_id": 10, "wallpaper_id": 35, "parent_id": 0,
    "content": "太好看了", "like_count": 0,
    "created_at": "2026-08-28 12:15:10",
    "username": "wallify_user",
    "avatar": "/assets/images/default-avatar.png"
  } ],
  "total": 1, "page": 1, "page_size": 20, "has_more": false
}
```

### 5.16 POST comment

发表评论 / 回复评论。需登录。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| wallpaper_id | int | 是 | 壁纸 ID |
| content | string | 是 | 内容，1-500 字 |
| parent_id | int | 否 | 回复目标评论 ID（0 为顶层评论） |

请求（表单或 JSON 均可）：
```
POST /appapi/index.php?action=comment&token=xxxx
wallpaper_id=35&content=太好看了
```

响应 `data` 为单条评论（结构同 5.14 items 元素）。

> 防刷：同一用户对同一壁纸 5 秒内最多评论 1 条，超限返回 `code=429`。

---

## 6. 图片 URL

**服务端已返回完整 URL**（`file_path` / `thumbnail_path` / `avatar` 均为绝对地址），App 端直接展示即可，无需拼接：

```json
"file_path": "https://lkr2312.dpdns.org/uploads/wallpapers/wp_xxx.webp"
```

域名随请求协议与 Host 动态生成（Cloudflare 橙云下固定为 HTTPS）。

---

## 7. 请求示例（curl）

```bash
# 首页
curl 'https://lkr2312.dpdns.org/appapi/index.php?action=home'

# 登录
curl -X POST 'https://lkr2312.dpdns.org/appapi/index.php?action=login' \
  -d 'username=wallify_user&password=123456'

# 点赞
curl -X POST 'https://lkr2312.dpdns.org/appapi/index.php?action=like' \
  -d 'token=xxxx&wallpaper_id=35'

# 发表评论（JSON）
curl -X POST 'https://lkr2312.dpdns.org/appapi/index.php?action=comment' \
  -H 'Content-Type: application/json' \
  -d '{"token":"xxxx","wallpaper_id":35,"content":"太好看了"}'
```
## 8. 版本变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0 | 2026-08-27 | 初始只读接口：home / wallpapers / detail / categories / random / version |
| v1.1 | 2026-08-28 | 新增用户与交互接口：register / login / logout / me / like / favorite / favorites / comments / comment；users 表新增 `api_token` 字段；likes / favorites 增加 `(user_id, wallpaper_id)` 唯一索引 |
| v1.2 | 2026-08-28 | token 增加 7 天有效期（users 表新增 `token_expires_at`，过期自动失效）；图片 / 头像字段改为返回完整 URL；version 接口增加 5 分钟结果缓存；comment 增加 60 秒防刷限制（code=429） |
| v1.3 | 2026-08-28 | 评论限速调整为 5 秒/条；登录 Token 有效期由 7 天延长至 30 天 |
| v1.4 | 2026-08-28 | 登录态滑动过期：有效期剩余不足 3 天自动延长 30 天，响应头返回 `X-Token-Expires-At`；新增 `refresh` 接口（换新 token 并作废旧 token）；register/login 返回 `expires_at`；修复不填邮箱注册时误报 409 的问题 |


## 变更记录
- **v1.4**（2026-08-28）：登录态滑动过期（剩余 < 3 天自动 +30 天，响应头 `X-Token-Expires-At`）；新增 refresh 接口；register/login 返回 `expires_at`；修复注册空邮箱误报 409
- **v1.3**（2026-08-28）：评论限速调整为 5 秒/条；登录 Token 有效期延长为 30 天