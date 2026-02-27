# 手动更新 Vercel 部署

## 🎯 问题
- GitHub 网络连接失败
- Vercel CLI 未安装

## ✅ 已完成
- 修复了留存热力图的字体颜色问题
- 代码已提交到本地 Git
- 需要重新部署到 Vercel

## 🚀 手动部署方法

### 方法一：通过 Vercel Dashboard 重新部署

1. 访问 https://vercel.com/dashboard
2. 找到你的 `search-dashboard` 项目
3. 点击项目进入详情页
4. 点击右上角的 "Redeploy" 按钮
5. 选择最新的部署记录
6. 点击 "Redeploy" 确认

**注意：** 这个方法只会重新部署已有的代码，不会包含最新的修复。

### 方法二：手动上传文件到 Vercel

1. 访问 https://vercel.com/dashboard
2. 找到 `search-dashboard` 项目
3. 点击 "Settings" 标签
4. 在左侧菜单选择 "Git"
5. 点击 "Disconnect" 断开 GitHub 连接
6. 返回 Dashboard
7. 点击 "Add New..." → "Project"
8. 选择 "Import Git Repository" 或直接拖拽文件夹

### 方法三：安装 Vercel CLI 并部署（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 在 search-dashboard 目录下部署
cd "E:\橙子学数据看板\搜索看板\search-dashboard"
vercel --prod
```

### 方法四：等待网络恢复后推送到 GitHub

```bash
# 当网络恢复后，运行：
cd "E:\橙子学数据看板\搜索看板\search-dashboard"
git push origin main
```

Vercel 会自动检测到 GitHub 更新并重新部署。

## 🔧 本次修复内容

修复了留存热力图中数字不可见的问题：

**之前：** 所有数字都使用 #666（灰色），在浅色背景上看不清

**现在：** 
- W0 列（100% 留存）：白色文字
- 深色背景（>20%）：白色文字
- 浅色背景（≤20%）：深灰色 #333 文字，确保可见

## 📝 修改的文件

- `app.js` - 更新了热力图标签的颜色逻辑

## 🎉 完成后

部署成功后，访问你的 Vercel 链接，留存热力图中的数字应该清晰可见了！

## 💡 提示

如果你有 npm 环境，强烈建议使用方法三（Vercel CLI），这是最快最可靠的方式。

安装命令：
```bash
npm install -g vercel
```

然后直接运行：
```bash
vercel --prod
```
