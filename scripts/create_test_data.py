#!/usr/bin/env python3
"""Create test categories, tags, and articles for the blog."""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo"


def api(method, path, data=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"  ERROR {e.code}: {e.read().decode('utf-8')}")
        return None


# ====== Create Categories ======
print("=== Creating Categories ===")
categories_data = [
    {"name": "技术教程", "slug": "tech-tutorial", "description": "技术教程与实战指南", "sortOrder": 1},
    {"name": "前端开发", "slug": "frontend-dev", "description": "前端开发相关文章", "sortOrder": 2},
    {"name": "后端开发", "slug": "backend-dev", "description": "后端开发相关文章", "sortOrder": 3},
    {"name": "随笔思考", "slug": "essays", "description": "个人随笔与思考", "sortOrder": 4},
]
categories = {}
for c in categories_data:
    result = api("POST", "/api/v1/admin/categories", c)
    if result:
        categories[c["slug"]] = result["id"]
        print(f"  Created category: {c['name']} (id={result['id']})")

# ====== Create Tags ======
print("\n=== Creating Tags ===")
tags_data = [
    {"name": "JavaScript", "slug": "javascript"},
    {"name": "TypeScript", "slug": "typescript"},
    {"name": "Vue", "slug": "vue"},
    {"name": "React", "slug": "react"},
    {"name": "CSS", "slug": "css"},
    {"name": "HTML", "slug": "html"},
    {"name": "Java", "slug": "java"},
    {"name": "Spring Boot", "slug": "spring-boot"},
    {"name": "设计模式", "slug": "design-patterns"},
    {"name": "性能优化", "slug": "performance"},
    {"name": "最佳实践", "slug": "best-practices"},
    {"name": "开发工具", "slug": "dev-tools"},
]
tags = {}
for t in tags_data:
    result = api("POST", "/api/v1/admin/tags", t)
    if result:
        tags[t["slug"]] = result["id"]
        print(f"  Created tag: {t['name']} (id={result['id']})")

# ====== Create Articles ======
print("\n=== Creating Articles ===")

articles = []

# ---------- Article 1: Vue 3 + TypeScript 入门教程 ----------
articles.append({
    "title": "Vue 3 + TypeScript 实战入门：从零搭建现代化博客",
    "slug": "vue3-typescript-blog-tutorial",
    "summary": "本文将带你从零开始，使用 Vue 3 Composition API 配合 TypeScript，一步步搭建一个功能完善的现代化博客系统。涵盖项目初始化、组件设计、路由配置、状态管理等核心内容。",
    "contentHtml": """
<h2>前言</h2>
<p>近年来，<strong>Vue 3</strong> 凭借其出色的性能表现和灵活的 <strong>Composition API</strong>，已经成为前端开发的主流框架之一。配合 <strong>TypeScript</strong> 的类型安全特性，可以大幅提升开发体验和代码质量。</p>
<p>在这篇教程中，我们将从项目初始化开始，逐步搭建一个功能完善的博客系统。</p>

<blockquote><p><strong>学习建议：</strong>本文适合有 Vue 2 基础但想入门 Vue 3 的开发者。如果你是完全的新手，建议先阅读 <a href="https://vuejs.org/">Vue 官方文档</a> 的基础部分。</p></blockquote>

<h2>环境准备</h2>
<p>在开始之前，请确保你的开发环境满足以下要求：</p>
<ul>
  <li><strong>Node.js</strong> ≥ 18.0（推荐使用 LTS 版本）</li>
  <li><strong>pnpm</strong> ≥ 8.0（本教程使用 pnpm 作为包管理器）</li>
  <li><strong>VS Code</strong> + Volar 插件（替代已弃用的 Vetur）</li>
</ul>

<h3>创建项目</h3>
<p>使用 Vite 创建项目是最快的方式：</p>
<pre><code class="language-bash">pnpm create vite my-blog --template vue-ts
cd my-blog
pnpm install</code></pre>
<p>这将创建一个基于 <strong>Vite + Vue 3 + TypeScript</strong> 的项目骨架。</p>

<h2>核心概念解析</h2>

<h3>Composition API vs Options API</h3>
<p>Vue 3 引入了 <strong>Composition API</strong>，它和传统的 Options API 最大的区别在于：</p>
<ul>
  <li><strong>Options API</strong>：按选项类型组织代码（data、methods、computed 等），适合简单组件</li>
  <li><strong>Composition API</strong>：按逻辑关注点组织代码，适合复杂组件和逻辑复用</li>
</ul>

<p>下面是一个使用 <code>&lt;script setup&gt;</code> 语法的简单示例：</p>
<pre><code class="language-typescript">import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubleCount = computed(() =&gt; count.value * 2)

function increment() {
  count.value++
}

onMounted(() =&gt; {
  console.log('组件已挂载，当前计数：', count.value)
})</code></pre>

<h3>响应式系统</h3>
<p>Vue 3 使用 <strong>Proxy</strong> 替代了 Vue 2 的 <code>Object.defineProperty</code>，带来了以下改进：</p>
<ul>
  <li>可以检测<strong>属性的新增和删除</strong></li>
  <li>支持 <strong>Map、Set、WeakMap、WeakSet</strong> 等数据结构</li>
  <li>性能更好，不需要递归遍历对象</li>
</ul>

<blockquote><p>Vue 3 的响应式系统基于 ES6 Proxy，因此 <strong>不支持 IE11</strong>。如果你的项目需要兼容 IE，请继续使用 Vue 2。</p></blockquote>

<h2>总结</h2>
<p>本文我们介绍了 Vue 3 + TypeScript 的基础概念和项目搭建流程。在下一篇文章中，我们将深入探讨<strong>组件设计模式</strong>和<strong>状态管理</strong>的最佳实践。</p>
<p>如果你有任何问题，欢迎在评论区留言讨论！</p>
""",
    "status": "PUBLISHED",
    "categoryId": categories.get("frontend-dev"),
    "tagIds": [tags.get("vue"), tags.get("typescript"), tags.get("javascript"), tags.get("best-practices")],
})

# ---------- Article 2: Spring Boot 3 安全最佳实践 ----------
articles.append({
    "title": "Spring Boot 3 安全防护实战：从认证到授权全流程",
    "slug": "spring-boot3-security-practice",
    "summary": "深入探讨 Spring Boot 3 + Spring Security 6 的安全机制，包括 JWT 认证、RBAC 授权、CSRF 防护、CORS 配置等，结合实际案例讲解如何构建安全可靠的后端服务。",
    "contentHtml": """
<h2>引言</h2>
<p>在构建 Web 应用时，<strong>安全性</strong>是一个不可忽视的关键因素。Spring Boot 3 搭配 <strong>Spring Security 6</strong> 提供了一套完整的安全解决方案。</p>
<p>本文将带你从零开始，构建一个安全可靠的后端认证授权系统。</p>

<blockquote><p><strong>注意：</strong>本文假设你已经有 Spring Boot 3 的基础使用经验。如果你还不熟悉 Spring Boot 3，建议先阅读 <a href="https://docs.spring.io/spring-boot/docs/current/reference/html/">Spring Boot 官方文档</a>。</p></blockquote>

<h2>JWT 认证流程</h2>

<h3>什么是 JWT？</h3>
<p><strong>JWT（JSON Web Token）</strong> 是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。一个 JWT 由三部分组成：</p>
<ul>
  <li><strong>Header</strong>：包含令牌类型和签名算法</li>
  <li><strong>Payload</strong>：包含声明数据（用户信息、过期时间等）</li>
  <li><strong>Signature</strong>：用于验证令牌的完整性</li>
</ul>

<h3>实现 JWT 过滤器</h3>
<p>下面是一个 JWT 认证过滤器的核心实现：</p>
<pre><code class="language-java">@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);
        if (token != null &amp;&amp; tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null &amp;&amp; bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}</code></pre>

<h2>RBAC 权限控制</h2>
<p><strong>RBAC（Role-Based Access Control）</strong> 是最常用的权限控制模型。核心思想是将权限授予角色，再将角色分配给用户。</p>

<p>在项目中，我们定义了三个角色：</p>
<ul>
  <li><strong>ADMIN</strong>：管理员，拥有所有权限</li>
  <li><strong>EDITOR</strong>：编辑者，可以管理文章和媒体</li>
  <li><strong>VIEWER</strong>：只读用户，仅可查看</li>
</ul>

<p>使用 <code>@PreAuthorize</code> 注解可以方便地控制方法级别的权限：</p>
<pre><code class="language-java">@RestController
@RequestMapping("/api/v1/admin")
public class PostController {

    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    @PostMapping("/posts")
    public PostResponse createPost(@Valid @RequestBody PostRequest request) {
        // 只有 ADMIN 和 EDITOR 可以创建文章
        return postService.create(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/posts/{id}")
    public void deletePost(@PathVariable Long id) {
        // 只有 ADMIN 可以删除文章
        postService.delete(id);
    }
}</code></pre>

<h2>CSRF 防护与 CORS 配置</h2>

<h3>CSRF 防护策略</h3>
<p>对于前后端分离的项目，如果使用 JWT 进行认证，通常可以<strong>禁用 CSRF 防护</strong>：</p>
<pre><code class="language-java">@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -&gt; csrf.disable())
        .sessionManagement(session -&gt;
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -&gt;
            auth.requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/posts/**").permitAll()
                .requestMatchers("/api/v1/admin/**").authenticated()
                .anyRequest().authenticated()
        );
    return http.build();
}</code></pre>

<blockquote><p><strong>提示：</strong>如果你的应用使用 Session/Cookie 认证，<strong>必须</strong>保留 CSRF 防护。上述禁用 CSRF 的做法仅适用于无状态的 JWT 认证场景。</p></blockquote>

<h3>CORS 配置</h3>
<p>跨域问题是前后端分离项目中常见的难点。Spring Boot 提供了多种 CORS 配置方式：</p>
<pre><code class="language-java">@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}</code></pre>

<h2>总结</h2>
<p>本文涵盖了 Spring Boot 3 安全开发的几个核心要点：</p>
<ul>
  <li><strong>JWT 认证</strong>：无状态、适合分布式系统</li>
  <li><strong>RBAC 授权</strong>：灵活高效的权限管理</li>
  <li><strong>CSRF 防护</strong>：根据认证方式决定是否启用</li>
  <li><strong>CORS 配置</strong>：确保前后端正常通信</li>
</ul>
<p>安全开发是一个持续的过程，建议定期审查和更新你的安全配置。</p>
""",
    "status": "PUBLISHED",
    "categoryId": categories.get("backend-dev"),
    "tagIds": [tags.get("java"), tags.get("spring-boot"), tags.get("best-practices"), tags.get("design-patterns")],
})

# ---------- Article 3: CSS 现代布局完全指南 ----------
articles.append({
    "title": "CSS 现代布局完全指南：Flexbox、Grid 与容器查询",
    "slug": "css-modern-layout-guide",
    "summary": "全面讲解 CSS 现代布局三大支柱：Flexbox、Grid 和容器查询（Container Queries）。通过大量实战案例，帮助你彻底掌握响应式布局的核心技巧，告别浮动和定位的时代。",
    "contentHtml": """
<h2>为什么要学习现代布局？</h2>
<p>回想一下，你还记得用 <code>float</code> 和 <code>clearfix</code> 布局的日子吗？那时候为了让几个 div 对齐，常常需要写一大堆 hack 代码。幸运的是，<strong>现代 CSS 布局</strong>已经彻底改变了这一局面。</p>

<blockquote><p><strong>一句话总结：</strong>Flexbox 用于一维布局（行或列），Grid 用于二维布局（行和列），容器查询让你基于容器尺寸而非视口尺寸做响应式设计。</p></blockquote>

<h2>Flexbox：一维布局利器</h2>

<h3>核心属性速查</h3>
<p>Flexbox 的属性分为<strong>容器属性</strong>和<strong>项目属性</strong>两类：</p>
<ul>
  <li><strong>容器属性</strong>：<code>display: flex</code> | <code>flex-direction</code> | <code>justify-content</code> | <code>align-items</code> | <code>flex-wrap</code> | <code>gap</code></li>
  <li><strong>项目属性</strong>：<code>flex-grow</code> | <code>flex-shrink</code> | <code>flex-basis</code> | <code>align-self</code></li>
</ul>

<h3>实战：导航栏布局</h3>
<p>一个经典的导航栏布局，使用 Flexbox 可以轻松实现：</p>
<pre><code class="language-css">.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: #1a1a2e;
  color: white;
}

.navbar__links {
  display: flex;
  gap: 24px;
  list-style: none;
}

.navbar__links a {
  color: #a0a0b8;
  text-decoration: none;
  transition: color 0.2s;
}

.navbar__links a:hover {
  color: #ffffff;
}</code></pre>

<p>这个例子展示了 Flexbox 的核心优势：<strong>自动分配空间</strong>和<strong>轻松对齐</strong>。不需要计算宽度，不需要清除浮动，一切交给浏览器处理。</p>

<h2>CSS Grid：二维布局王者</h2>

<h3>Grid vs Flexbox：什么时候用什么？</h3>
<ul>
  <li><strong>整体页面布局</strong>（header + sidebar + main + footer）→ 用 Grid</li>
  <li><strong>组件内部布局</strong>（按钮组、卡片列表）→ 用 Flexbox</li>
  <li><strong>需要精确控制行列</strong>（仪表盘、图片画廊）→ 用 Grid</li>
  <li><strong>内容驱动的大小未知</strong>（标签云、用户列表）→ 用 Flexbox</li>
</ul>

<h3>实战：博客首页布局</h3>
<pre><code class="language-css">.blog-layout {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "sidebar content aside"
    "footer  footer  footer";
  grid-template-columns: 240px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .blog-layout {
    grid-template-areas:
      "header"
      "content"
      "sidebar"
      "aside"
      "footer";
    grid-template-columns: 1fr;
  }
}</code></pre>

<p><strong>grid-template-areas</strong> 是 Grid 最强大的特性之一，让你可以用直观的方式描述页面布局，<strong>阅读代码就像看图一样</strong>。</p>

<h2>容器查询：真正的组件级响应式</h2>

<p>传统的 <code>@media</code> 查询只能基于<strong>视口尺寸</strong>做响应式，这对于独立组件来说很局限。容器查询解决了这个问题：</p>
<pre><code class="language-css">.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 基于容器宽度的样式调整 */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}</code></pre>

<blockquote><p><strong>浏览器支持：</strong>容器查询已在所有主流浏览器的最新版本中获得支持（Chrome 105+、Firefox 110+、Safari 16+）。对于需要兼容旧浏览器的项目，可以使用 <a href="https://github.com/GoogleChromeLabs/container-query-polyfill">polyfill</a>。</p></blockquote>

<h2>总结</h2>
<p>现代 CSS 布局体系已经非常成熟。记住这个简单的选择原则：</p>
<ul>
  <li><strong>一维排列</strong> → Flexbox</li>
  <li><strong>二维布局</strong> → Grid</li>
  <li><strong>组件级响应式</strong> → Container Queries</li>
</ul>
<p>掌握了这三板斧，你就可以告别浮动定位的噩梦，写出<strong>简洁、可维护</strong>的布局代码。</p>
""",
    "status": "PUBLISHED",
    "categoryId": categories.get("frontend-dev"),
    "tagIds": [tags.get("css"), tags.get("html"), tags.get("best-practices"), tags.get("performance")],
})

# ---------- Article 4: 程序员的写作之道 ----------
articles.append({
    "title": "程序员的写作之道：为什么写作是技术成长的最佳加速器",
    "slug": "writing-for-developers",
    "summary": "深入探讨技术写作对程序员职业发展的价值，分享高效写作的方法和工具，以及如何克服写作中的常见障碍。",
    "contentHtml": """
<h2>一个常见的误区</h2>
<p>很多程序员认为，<strong>写好代码就够了</strong>。写作是产品经理、技术文档工程师的事情，和开发者没什么关系。</p>
<p>但事实恰恰相反——<strong>写作是程序员最被低估的技能之一</strong>。</p>

<blockquote><p><strong>"If you can't explain it simply, you don't understand it well enough."</strong> — Albert Einstein</p></blockquote>

<h2>为什么写作对程序员如此重要？</h2>

<h3>1. 写作是思考的工具</h3>
<p>当你尝试把一个问题<strong>写清楚</strong>时，你必须先把它<strong>想清楚</strong>。写作过程本身就是对知识的梳理和深化。</p>
<p>很多次，我在写技术博客的过程中发现：<strong>原来我对这个概念的某些细节理解是模糊的</strong>。写作迫使我去查文档、看源码、做实验，最终达到真正的理解。</p>

<h3>2. 写作是最好的社交名片</h3>
<p>一篇高质量的技术博客可以帮你：</p>
<ul>
  <li>在面试中<strong>脱颖而出</strong>（你的文章就是最好的简历）</li>
  <li>在社区中<strong>建立影响力</strong>（成为某个领域的意见领袖）</li>
  <li>在团队中<strong>提升话语权</strong>（被同事视为该领域的专家）</li>
</ul>

<h3>3. 写作倒逼输入</h3>
<p>坚持写作会让你发现：<strong>可写的东西太少了</strong>。这种"输出倒逼输入"的机制，会促使你不断学习、思考和积累。</p>

<h2>克服写作障碍的实用技巧</h2>

<h3>降低标准，先写出来</h3>
<p><strong>完美主义是写作最大的敌人。</strong>很多人总想一出手就写出"传世之作"，结果往往是一个字都写不出来。</p>

<p>我的建议是：</p>
<ul>
  <li>第一遍，<strong>只管写</strong>，不要回头修改</li>
  <li>第二遍，<strong>改结构</strong>，调整段落和逻辑顺序</li>
  <li>第三遍，<strong>改表达</strong>，优化用词和句式</li>
  <li>最后一遍，<strong>改细节</strong>，修正错别字和格式</li>
</ul>

<p>记住这个公式：<strong>草稿 &gt; 空白页</strong></p>

<blockquote><p><strong>写作没有什么诀窍。</strong>你只需要坐下来，打开编辑器，然后一个字一个字地写。唯一的区别是，有人真的去做了，而有人还在等待"灵感降临"。</p></blockquote>

<h3>建立写作流程</h3>
<p>我用这套流程保持稳定的产出：</p>
<pre><code class="language-text">收集想法 → 确定选题 → 列大纲（1-2天）
    ↓
写初稿（2-3小时专注时间）
    ↓
冷却 + 修改（放置1天后再改）
    ↓
发布 + 推广（多平台分发）</code></pre>

<h2>写作工具推荐</h2>
<ul>
  <li><strong>Typora / MarkText</strong>：所见即所得的 Markdown 编辑器，适合日常写作</li>
  <li><strong>Obsidian</strong>：双向链接 + 知识图谱，适合构建个人知识库</li>
  <li><strong>Grammarly</strong>：英文写作的语法检查利器</li>
  <li><strong>Hemingway Editor</strong>：帮你把句子写得更简洁</li>
</ul>

<h2>结语</h2>
<p>写作和编程有很多相似之处：都需要<strong>持续练习</strong>，都遵循<strong>"越写越好"</strong>的规律，都需要<strong>清晰的逻辑和结构</strong>。</p>
<p>作为一个程序员，你已经具备了写好技术文章的核心能力——<strong>逻辑思维和问题分解能力</strong>。剩下的，就是开始动笔。</p>
<p><strong>今天，就写一篇博客吧。</strong></p>
""",
    "status": "PUBLISHED",
    "categoryId": categories.get("essays"),
    "tagIds": [tags.get("best-practices"), tags.get("dev-tools")],
})

# ---------- Article 5: 设计模式在实战中的应用 ----------
articles.append({
    "title": "设计模式在实战中的应用：策略模式与工厂模式的优雅结合",
    "slug": "design-patterns-strategy-factory",
    "summary": "以真实项目为例，讲解如何将策略模式和工厂模式结合使用，消除冗长的 if-else 判断，写出可扩展、可维护的优雅代码。含完整的 Java/TypeScript 双版本示例。",
    "contentHtml": """
<h2>问题场景</h2>
<p>假设你在开发一个<strong>支付系统</strong>，需要支持多种支付方式：微信支付、支付宝、银行卡、PayPal 等。最简单的实现方式是什么？</p>

<p>很多人会写出这样的代码：</p>
<pre><code class="language-java">public PaymentResult pay(PaymentRequest request) {
    if ("WECHAT".equals(request.getPayType())) {
        // 微信支付逻辑（50 行代码）
    } else if ("ALIPAY".equals(request.getPayType())) {
        // 支付宝支付逻辑（50 行代码）
    } else if ("BANK_CARD".equals(request.getPayType())) {
        // 银行卡支付逻辑（50 行代码）
    } else if ("PAYPAL".equals(request.getPayType())) {
        // PayPal 支付逻辑（50 行代码）
    } else {
        throw new IllegalArgumentException("不支持的支付方式");
    }
}</code></pre>

<p>这段代码的问题显而易见：<strong>每次新增支付方式都要修改这个方法</strong>，违反了<strong>开闭原则</strong>（对扩展开放，对修改关闭）。if-else 不断膨胀，最终变成"意大利面条式代码"。</p>

<blockquote><p><strong>设计原则提醒：</strong>软件实体（类、模块、函数）应该对扩展开放，对修改关闭。这是面向对象设计的五大原则（SOLID）中的 <strong>O（Open-Closed Principle）</strong>。</p></blockquote>

<h2>解决方案：策略模式 + 工厂模式</h2>

<h3>步骤 1：定义策略接口</h3>
<pre><code class="language-java">public interface PaymentStrategy {
    /**
     * 判断是否支持该支付类型
     */
    boolean supports(String payType);

    /**
     * 执行支付
     */
    PaymentResult pay(PaymentRequest request);
}</code></pre>

<h3>步骤 2：实现具体策略</h3>
<pre><code class="language-java">@Component
public class WechatPaymentStrategy implements PaymentStrategy {

    @Override
    public boolean supports(String payType) {
        return "WECHAT".equals(payType);
    }

    @Override
    public PaymentResult pay(PaymentRequest request) {
        // 微信支付具体实现
        return new PaymentResult(true, "微信支付成功");
    }
}

@Component
public class AlipayPaymentStrategy implements PaymentStrategy {

    @Override
    public boolean supports(String payType) {
        return "ALIPAY".equals(payType);
    }

    @Override
    public PaymentResult pay(PaymentRequest request) {
        // 支付宝支付具体实现
        return new PaymentResult(true, "支付宝支付成功");
    }
}</code></pre>

<h3>步骤 3：创建工厂类</h3>
<pre><code class="language-java">@Component
public class PaymentStrategyFactory {

    private final Map&lt;String, PaymentStrategy&gt; strategyMap = new HashMap&lt;&gt;();

    /**
     * Spring 自动注入所有 PaymentStrategy 实现
     */
    public PaymentStrategyFactory(List&lt;PaymentStrategy&gt; strategies) {
        for (PaymentStrategy strategy : strategies) {
            // 注册到 Map 中
        }
    }

    public PaymentStrategy getStrategy(String payType) {
        for (PaymentStrategy strategy : strategyMap.values()) {
            if (strategy.supports(payType)) {
                return strategy;
            }
        }
        throw new IllegalArgumentException("不支持的支付方式: " + payType);
    }
}</code></pre>

<h3>步骤 4：在 Service 中使用</h3>
<pre><code class="language-java">@Service
public class PaymentService {

    private final PaymentStrategyFactory factory;

    public PaymentResult pay(PaymentRequest request) {
        PaymentStrategy strategy = factory.getStrategy(request.getPayType());
        return strategy.pay(request);
    }
}</code></pre>

<p><strong>现在，如果要新增一种支付方式</strong>（比如"银联支付"），你只需要：</p>
<ol>
  <li>创建一个新的 <code>UnionPayPaymentStrategy</code> 类，实现 <code>PaymentStrategy</code> 接口</li>
  <li>添加 <code>@Component</code> 注解</li>
</ol>
<p><strong>无需修改任何现有代码！</strong>Spring 会自动发现并注入新策略。</p>

<h2>TypeScript 版本实现</h2>
<p>同样的模式在 TypeScript（Vue/React 项目）中的实现：</p>
<pre><code class="language-typescript">// 策略接口
interface PaymentStrategy {
  readonly type: string
  pay(request: PaymentRequest): Promise&lt;PaymentResult&gt;
}

// 具体策略
class WechatPayment implements PaymentStrategy {
  readonly type = 'WECHAT'

  async pay(request: PaymentRequest): Promise&lt;PaymentResult&gt; {
    // 微信支付逻辑
    return { success: true, message: '微信支付成功' }
  }
}

class AlipayPayment implements PaymentStrategy {
  readonly type = 'ALIPAY'

  async pay(request: PaymentRequest): Promise&lt;PaymentResult&gt; {
    // 支付宝支付逻辑
    return { success: true, message: '支付宝支付成功' }
  }
}

// 工厂
class PaymentStrategyRegistry {
  private strategies = new Map&lt;string, PaymentStrategy&gt;()

  register(strategy: PaymentStrategy): void {
    this.strategies.set(strategy.type, strategy)
  }

  get(type: string): PaymentStrategy {
    const strategy = this.strategies.get(type)
    if (!strategy) throw new Error(`不支持: ${type}`)
    return strategy
  }
}

// 使用
const registry = new PaymentStrategyRegistry()
registry.register(new WechatPayment())
registry.register(new AlipayPayment())

async function handlePayment(type: string, request: PaymentRequest) {
  const strategy = registry.get(type)
  return strategy.pay(request)
}</code></pre>

<h2>总结</h2>
<p>策略模式 + 工厂模式的组合在实战中非常实用，适用的场景包括：</p>
<ul>
  <li><strong>支付/计费系统</strong>：不同支付渠道、不同计费规则</li>
  <li><strong>消息通知</strong>：短信、邮件、推送等不同通知渠道</li>
  <li><strong>导出功能</strong>：PDF、Excel、CSV 等不同导出格式</li>
  <li><strong>第三方集成</strong>：对接不同厂商的 API</li>
</ul>
<p>记住：<strong>当你发现代码中出现了大量的 if-else 或 switch-case 判断类似逻辑时，就是策略模式登场的时候了。</strong></p>
""",
    "status": "PUBLISHED",
    "categoryId": categories.get("tech-tutorial"),
    "tagIds": [tags.get("java"), tags.get("typescript"), tags.get("design-patterns"), tags.get("best-practices")],
})

# ====== Post Articles ======
for i, article in enumerate(articles):
    # Filter out None/null tagIds
    article["tagIds"] = [t for t in article.get("tagIds", []) if t is not None]
    if article.get("categoryId") is None:
        del article["categoryId"]

    result = api("POST", "/api/v1/admin/posts", article)
    if result:
        print(f"  [{i+1}] Created: {article['title']} (slug={article['slug']}, id={result['id']})")
    else:
        print(f"  [{i+1}] FAILED: {article['title']}")

print("\n=== Done ===")
print(f"Created {len(categories)} categories, {len(tags)} tags, {len(articles)} articles")
