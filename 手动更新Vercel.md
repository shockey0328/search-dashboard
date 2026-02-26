# 手动更新 Vercel 部署

## 当前状态
✅ 所有文件已复制到 search-dashboard 目录
✅ 已提交到本地 Git
❌ 无法推送到 GitHub（网络问题）

## 解决方案：手动上传到 Vercel

### 方法一：通过 Vercel Dashboard 手动上传

1. **打包项目文件**
   - 将 search-dashboard 目录下的所有文件打包成 zip
   - 或者直接使用这些文件：
     - index.html
     - app.js
     - logo.png
     - vercel.json
     - 所有 CSV 文件

2. **访问 Vercel**
   - 登录 https://vercel.com/dashboard
   - 找到你的 search-dashboard 项目
   - 点击项目名称

3. **上传新版本**
   - 点击 "Settings"
   - 滚动到 "Git Repository"
   - 如果显示 GitHub 连接，可以断开连接
   - 返回项目页面
   - 点击 "..." 菜单
   - 选择 "Import Project"
   - 拖拽文件或选择文件夹

### 方法二：使用 Vercel CLI（推荐）

即使 GitHub 连接有问题，Vercel CLI 也能直接部署：

```bash
# 1. 进入 search-dashboard 目录
cd search-dashboard

# 2. 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 3. 登录 Vercel
vercel login

# 4. 部署到生产环境
vercel --prod
```

Vercel CLI 会直接从本地上传文件，不需要经过 GitHub！

### 方法三：删除并重新创建项目

1. 在 Vercel Dashboard 删除当前的 search-dashboard 项目
2. 在 search-dashboard 目录运行：
```bash
vercel --prod
```
3. 按照提示创建新项目

## 推荐操作步骤

**最简单的方法是使用 Vercel CLI：**

```bash
# 打开 PowerShell 或命令提示符
cd "E:\橙子学数据看板\搜索看板\search-dashboard"

# 安装 Vercel CLI
npm install -g vercel

# 登录（会打开浏览器）
vercel login

# 部署
vercel --prod
```

## 验证部署

部署成功后：
1. 访问 Vercel 提供的链接
2. 应该能看到完整的搜索数据看板
3. 检查所有功能是否正常

## 如果还是 404

检查以下内容：
1. vercel.json 文件是否存在
2. index.html 是否在根目录
3. 所有 CSV 文件是否都在根目录
4. 查看 Vercel 部署日志

## 后续更新

以后更新时，只需：
```bash
cd search-dashboard
vercel --prod
```

不需要 GitHub，直接从本地部署！

## 文件清单

确保 search-dashboard 目录包含：
- ✅ index.html
- ✅ app.js
- ✅ logo.png
- ✅ vercel.json
- ✅ README.md
- ✅ 第1周搜索词.csv ~ 第8周搜索词.csv
- ✅ 搜索行为漏斗.csv
- ✅ 搜索转化率.csv
- ✅ 搜索功能留存看板.csv
