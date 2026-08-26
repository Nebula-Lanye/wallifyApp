# Wallify 官网资料设置与协议入口

已登录账户菜单中的“设置”入口为 `/pages/settings.php`，用于官网个人资料维护。该页的资料表单提交到 `/api/auth.php?action=update_profile`，表单字段为 `username`、`email` 和 `bio`。头像更新提交到 `/api/upload_avatar.php`，字段为 `avatar` 和会话相关的 `csrf_token`。

官网页脚“使用条款”入口为 `/pages/terms.php`；隐私政策为 `/pages/privacy.php`。应用应保留核心资料操作的原生体验，并将协议正文从官网条款页面同步展示，避免用户跳转浏览器。

官网使用条款共包含“接受条款”“服务说明”“用户行为规范”“版权声明”和“免责声明”五节；最后一节之后为“返回首页”链接和站点页脚，协议解析必须在正文容器结束处停止。
