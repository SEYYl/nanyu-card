<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { site } from './composables/useStore'

const router = useRouter()
const route = useRoute()
const navOpen = ref(false)

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isFrontPage = computed(() => route.path === '/')

function closeNav() { navOpen.value = false }
</script>

<template>
  <!-- Admin routes use their own AdminLayout -->
  <template v-if="isAdminRoute">
    <router-view />
  </template>

  <!-- Front page with nav -->
  <template v-else>
    <div class="container">
      <nav class="nav" :class="{ 'nav-open': navOpen }">
        <strong @click="router.push('/')" style="cursor: pointer;">{{ site.site_name || 'Nanyu Card' }}</strong>
        <button class="nav-toggle" @click="navOpen = !navOpen" aria-label="切换菜单">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links">
          <template v-if="isFrontPage">
            <a href="#about" @click="closeNav">关于</a>
            <a href="#highlights" @click="closeNav">经历</a>
            <a href="#skills" @click="closeNav">技能</a>
            <a href="#projects" @click="closeNav">项目</a>
            <a href="#contact" @click="closeNav">联系</a>
            <router-link to="/admin/login" class="button secondary small-btn nav-admin" style="text-decoration: none;">登录</router-link>
          </template>
          <template v-else>
            <router-link to="/" @click="closeNav">返回首页</router-link>
          </template>
        </div>
      </nav>

      <router-view />
    </div>
  </template>
</template>
