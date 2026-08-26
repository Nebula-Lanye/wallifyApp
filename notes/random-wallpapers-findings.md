# 随机二次元页面公开结构

- 页面地址：`/pages/random.php`。
- 随机图片数据接口：`/api/random_image.php?mode=json&source={source}&category={category}`。
- 下载接口：`/api/random_image.php?mode=download&source={source}&category={category}`。
- 页面公开来源选项包含：栗次元、芙宁娜、UApiPro。
- 页面公开分类包含：二次元、萌图、AI绘图、原神、PC横图、萌版横图、风景、白底、原神横图、手机竖图、萌版竖图、原神竖图、AI竖图、头像、七濑胡桃、小狐狸、ACG动图。
- 原生应用应通过现有受限图片代理加载接口返回的图片 URL，并在设备相册中保存经过应用内确认的图像，避免浏览器跳转。

官网首页“最新上传”区块使用 `div.wallpaper-card` 列表。每张卡片包含 `/pages/wallpaper.php?id={id}` 详情链接、`/uploads/wallpapers/thumbs/{filename}` 缩略图、`h3.card-title` 中的标题、`a.card-author span` 中的作者，以及 `span.card-category` 中的游戏分类文字。服务端应仅解析该区块，按页面顺序返回卡片，并以应用图片代理转换缩略图路径。

随机页面的默认来源为 `alcy`，默认分类为 `ycy`。页面通过 `/api/random_image.php?mode=json&source={source}&category={category}&_t={timestamp}` 请求 JSON；成功响应含有 `url`、`name` 与可选 `type` 字段。公开分类代码包括：`ycy`（二次元）、`moez`（萌图）、`ai`（AI绘图）、`ysz`（原神）、`pc`（PC横图）、`mp`（手机竖图）以及其余页面展示的分类代码。原生实现应保留来源与分类选择，并在“换一张”时无缓存重新请求。
