<template>
  <div class="site-shell">
    <header class="masthead">
      <RouterLink to="/" class="wordmark">4946个人站</RouterLink>
      <nav>
        <RouterLink to="/topics">专题</RouterLink>
        <RouterLink to="/series">系列</RouterLink>
        <RouterLink to="/archive">全部文章</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
