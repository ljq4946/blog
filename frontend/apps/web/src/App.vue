<template>
  <div class="site-shell">
    <header class="masthead">
      <RouterLink to="/" class="wordmark">4946个人站</RouterLink>
      <nav>
        <RouterLink to="/posts">文章</RouterLink>
        <RouterLink to="/archive">归档</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
