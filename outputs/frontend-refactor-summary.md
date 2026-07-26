# 前端全面重构总结

## 完成日期
2026-07-26

## 改动概览

### 1. useStore.ts 拆分 → 5 个领域 Composable
- `useToast.ts` — Toast 消息通知（toastText / toastVisible / adminMessage / watch 驱动）
- `useAuth.ts` — 认证（checkSession / adminLogin / adminLogout / changePassword）
- `useSite.ts` — 站点配置（site / draft / loadSiteData / saveSiteConfig / highlights / taxonomy）
- `useProjects.ts` — 项目 CRUD（projects / projectDraft / saveProject / editProject / deleteProject）
- `useUpload.ts` — 图片上传（uploadImage / handleImageUpload / validateImage）

### 2. 自定义模态对话框替换原生弹窗
- 新增 `components/common/ConfirmModal.vue` — confirm 和 prompt 两种模式
- 新增 `composables/useDialog.ts` — confirmDialog() / promptDialog() 返回 Promise
- 替换了 `window.confirm`（Projects 删除、SiteConfig 清除头像、Settings 退出登录）
- 替换了 `window.prompt`（Settings 修改密码）

### 3. 前端表单验证
- 新增 `composables/useValidation.ts` — required / minLength / validate 工具函数
- 登录页添加用户名密码非空校验
- 图片上传添加类型（JPG/PNG/GIF/WebP）+ 大小（5MB）校验

### 4. 路由守卫取代组件内认证检查
- `router/index.ts` 添加全局 `beforeEach` 守卫，对 `/admin/*` 路由自动校验 session
- `AdminLayout.vue` 移除 onMounted 认证逻辑，仅保留 watch 安全兜底

### 5. 安全清理
- `loginForm` 默认值从 `admin`/`admin123` 改为空字符串
- 删除废弃文件：`useStore.ts`、`HelloWorld.vue`、`AdminDashboard.vue`

### 构建验证
- TypeScript 类型检查：通过
- Vite 生产构建：成功（2.43s，61 modules，15 chunks）

## 文件变更清单
**新增 6 个文件：**
- `src/composables/useToast.ts`
- `src/composables/useAuth.ts`
- `src/composables/useSite.ts`
- `src/composables/useProjects.ts`
- `src/composables/useUpload.ts`
- `src/composables/useValidation.ts`
- `src/composables/useDialog.ts`
- `src/components/common/ConfirmModal.vue`

**修改 14 个文件：**
- `src/router/index.ts`
- `src/App.vue`
- `src/views/FrontPage.vue`
- `src/views/AdminLogin.vue`
- `src/views/admin/AdminLayout.vue`
- `src/views/admin/Dashboard.vue`
- `src/views/admin/SiteConfig.vue`
- `src/views/admin/Highlights.vue`
- `src/views/admin/Taxonomy.vue`
- `src/views/admin/Projects.vue`
- `src/views/admin/ProjectEdit.vue`
- `src/views/admin/Settings.vue`
- `src/components/admin/AdminSidebar.vue`

**删除 3 个文件：**
- `src/composables/useStore.ts`
- `src/components/HelloWorld.vue`
- `src/views/AdminDashboard.vue`
