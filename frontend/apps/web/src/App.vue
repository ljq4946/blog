<template>
  <div class="site-shell">
    <header class="masthead">
      <RouterLink to="/" class="wordmark">4946个人站</RouterLink>
      <nav>
        <RouterLink to="/archive">全部文章</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
