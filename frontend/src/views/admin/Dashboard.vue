<script setup lang="ts">
import { onMounted } from 'vue'
import { loadSiteData, site, projects, stats } from '../../composables/useStore'

onMounted(() => loadSiteData())

const statItems = [
  { key: 'projects', label: '项目数量', icon: '📁' },
  { key: 'skills', label: '技能标签', icon: '🛠️' },
  { key: 'highlights', label: '经历亮点', icon: '🏆' },
]
</script>

<template>
  <div>
    <!-- Stat Cards -->
    <div class="dashboard-grid">
      <div v-for="item in statItems" :key="item.key" class="stat-card">
        <div class="stat-card-icon">{{ item.icon }}</div>
        <div class="stat-card-value">{{ stats[item.key as keyof typeof stats] }}</div>
        <div class="stat-card-label">{{ item.label }}</div>
      </div>
    </div>

    <!-- Site Overview -->
    <div class="dashboard-section">
      <h3>站点概况</h3>
      <div class="quick-links">
        <div class="card panel" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="avatar" style="width: 48px; height: 48px; flex-shrink: 0;">
              <img v-if="site.avatar" :src="site.avatar" alt="" />
              <span v-else class="avatar-fallback">{{ (site.site_name || 'N').slice(0, 1) }}</span>
            </div>
            <div>
              <strong style="font-size: 1rem;">{{ site.site_name || '未设置' }}</strong>
              <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 2px;">{{ site.occupation || '未设置职业' }}</p>
            </div>
          </div>
          <p class="small" style="margin-top: 4px;">{{ site.description || '暂无简介' }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="dashboard-section">
      <h3>快捷操作</h3>
      <div class="quick-links">
        <router-link to="/admin/site" class="quick-link">
          <span class="nav-icon">⚙️</span> 编辑站点信息
        </router-link>
        <router-link to="/admin/projects" class="quick-link">
          <span class="nav-icon">📁</span> 管理项目
        </router-link>
        <router-link to="/admin/highlights" class="quick-link">
          <span class="nav-icon">🏆</span> 编辑经历
        </router-link>
        <router-link to="/" class="quick-link">
          <span class="nav-icon">👀</span> 查看前台页面
        </router-link>
      </div>
    </div>

    <!-- Recent Projects -->
    <div class="dashboard-section" v-if="projects.length">
      <h3>最近项目</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>项目名称</th>
            <th>标签</th>
            <th>排序</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in projects.slice(0, 5)" :key="p.id">
            <td style="color: var(--text-primary); font-weight: 500;">{{ p.title }}</td>
            <td>
              <span v-for="t in p.tags.slice(0, 3)" :key="t" class="badge" style="margin-right: 4px;">{{ t }}</span>
              <span v-if="p.tags.length > 3" class="muted" style="font-size: 0.78rem;">+{{ p.tags.length - 3 }}</span>
            </td>
            <td>{{ p.sort }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
