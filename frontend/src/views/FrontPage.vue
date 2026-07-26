<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { site, socialLinks, loadSiteData } from '../composables/useSite'
import { projects } from '../composables/useProjects'

const loading = ref(true)

onMounted(async () => {
  const result = await loadSiteData()
  projects.value = result.projects
  loading.value = false
})
</script>

<template>
  <div v-if="loading" class="container" style="padding-top: 48px;">
    <div class="skeleton-block" style="width: 72px; height: 72px; border-radius: 50%; margin-bottom: 20px;"></div>
    <div class="skeleton-block" style="width: 180px; height: 28px; margin-bottom: 8px;"></div>
    <div class="skeleton-block" style="width: 320px; height: 18px; margin-bottom: 20px;"></div>
    <div class="skeleton-block" style="width: 100px; height: 36px; border-radius: 999px;"></div>
  </div>

  <div v-else class="container">
    <section class="hero">
      <div class="hero-main">
        <div class="avatar-wrap">
          <div v-if="site.avatar" class="avatar">
            <img :src="site.avatar" :alt="site.site_name" />
          </div>
          <div v-else class="avatar avatar-fallback">{{ (site.site_name || 'N').slice(0, 1) }}</div>
        </div>
        <h1>{{ site.site_name }}</h1>
        <p class="hero-description">{{ site.description }}</p>
        <div class="hero-actions">
          <a href="#projects" class="button primary">查看项目</a>
          <a href="#contact" class="button secondary">联系我</a>
        </div>
        <div v-if="site.focus_areas.length" class="hero-focus">
          <span class="hero-focus-label">关注</span>
          <div class="chips">
            <span v-for="item in site.focus_areas" :key="item" class="badge">{{ item }}</span>
          </div>
        </div>
      </div>
    </section>

    <section id="about" class="intro-section">
      <h2>关于我</h2>
      <p class="about-text">{{ site.about }}</p>
    </section>

    <section id="highlights" class="timeline-section">
      <h2>经历</h2>
      <div class="timeline">
        <div v-for="(item, index) in site.highlights" :key="index" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-body">
            <strong>{{ item.period }}</strong>
            <h3 class="timeline-title">{{ item.title }}</h3>
            <p class="small">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="skills" class="skills-section">
      <h2>技能</h2>
      <div class="chips">
        <span v-for="item in site.skills" :key="item" class="badge">{{ item }}</span>
      </div>
    </section>

    <section id="projects" class="projects-section">
      <h2>项目展示</h2>
      <div v-if="projects.length" class="projects">
        <article v-for="project in projects" :key="project.id" class="project-card">
          <div class="project-body">
            <h3>{{ project.title }}</h3>
            <p class="small">{{ project.description }}</p>
            <p v-if="project.content" class="small project-content">{{ project.content }}</p>
            <div v-if="project.tags.length" class="chips project-tags">
              <span v-for="tag in project.tags" :key="tag" class="badge">{{ tag }}</span>
            </div>
            <div class="project-actions">
              <a v-if="project.url" :href="project.url" target="_blank" rel="noreferrer" class="button primary small-btn">查看项目</a>
              <a v-if="project.github" :href="project.github" target="_blank" rel="noreferrer" class="button secondary small-btn">GitHub</a>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">目前还没有项目内容，后台可以新增。</div>
    </section>

    <section id="contact" class="contact-section">
      <h2>联系我</h2>
      <div class="contact-grid">
        <div class="contact-item">
          <span class="contact-label">邮箱</span>
          <a v-if="site.email" :href="`mailto:${site.email}`">{{ site.email }}</a>
          <span v-else class="muted">暂无</span>
        </div>
      </div>
      <div v-if="socialLinks.length" class="contact-social">
        <a v-for="link in socialLinks" :key="link.label" :href="link.href" target="_blank" rel="noreferrer" class="badge">{{ link.label }}</a>
      </div>
    </section>

    <footer class="footer">
      <span>&copy; {{ new Date().getFullYear() }} {{ site.site_name }}</span>
      <span class="footer-meta">
        <a v-if="site.icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">{{ site.icp }}</a>
        <span v-else>ICP 备案信息待填写</span>
        <span v-if="site.police" class="footer-divider">·</span>
        <span v-if="site.police">{{ site.police }}</span>
      </span>
    </footer>
  </div>
</template>
