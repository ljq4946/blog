#!/usr/bin/env python3
"""Generate properly escaped article JSON files."""
import json

articles = [
    {
        "file": "scripts/test_data/article4.json",
        "data": {
            "title": "程序员的写作之道：为什么写作是技术成长的最佳加速器",
            "slug": "writing-for-developers",
            "summary": "深入探讨技术写作对程序员职业发展的价值，分享高效写作的方法和工具，以及如何克服写作中的常见障碍。写作是程序员最被低估的技能之一。",
            "contentHtml": """<h2>一个常见的误区</h2>
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
<p>坚持写作会让你发现：<strong>可写的东西太少了</strong>。这种「输出倒逼输入」的机制，会促使你不断学习、思考和积累。</p>
<h2>克服写作障碍的实用技巧</h2>
<h3>降低标准，先写出来</h3>
<p><strong>完美主义是写作最大的敌人。</strong>很多人总想一出手就写出「传世之作」，结果往往是一个字都写不出来。</p>
<p>我的建议是：</p>
<ul>
<li>第一遍，<strong>只管写</strong>，不要回头修改</li>
<li>第二遍，<strong>改结构</strong>，调整段落和逻辑顺序</li>
<li>第三遍，<strong>改表达</strong>，优化用词和句式</li>
<li>最后一遍，<strong>改细节</strong>，修正错别字和格式</li>
</ul>
<p>记住这个公式：<strong>草稿 &gt; 空白页</strong></p>
<blockquote><p><strong>写作没有什么诀窍。</strong>你只需要坐下来，打开编辑器，然后一个字一个字地写。唯一的区别是，有人真的去做了，而有人还在等待「灵感降临」。</p></blockquote>
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
<p>写作和编程有很多相似之处：都需要<strong>持续练习</strong>，都遵循<strong>「越写越好」</strong>的规律，都需要<strong>清晰的逻辑和结构</strong>。</p>
<p>作为一个程序员，你已经具备了写好技术文章的核心能力——<strong>逻辑思维和问题分解能力</strong>。剩下的，就是开始动笔。</p>
<p><strong>今天，就写一篇博客吧。</strong></p>""",
            "status": "PUBLISHED",
            "categoryId": 16,
            "tagIds": [21, 22]
        }
    },
    {
        "file": "scripts/test_data/article5.json",
        "data": {
            "title": "设计模式实战：策略模式与工厂模式的优雅结合",
            "slug": "design-patterns-strategy-factory",
            "summary": "以真实项目为例，讲解如何将策略模式和工厂模式结合使用，消除冗长的 if-else 判断，写出可扩展、可维护的优雅代码。含完整的 Java/TypeScript 双版本示例。",
            "contentHtml": """<h2>问题场景</h2>
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
<p>这段代码的问题显而易见：<strong>每次新增支付方式都要修改这个方法</strong>，违反了<strong>开闭原则</strong>（对扩展开放，对修改关闭）。if-else 不断膨胀，最终变成「意大利面条式代码」。</p>
<blockquote><p><strong>设计原则提醒：</strong>软件实体（类、模块、函数）应该对扩展开放，对修改关闭。这是面向对象设计的五大原则（SOLID）中的 <strong>O（Open-Closed Principle）</strong>。</p></blockquote>
<h2>解决方案：策略模式 + 工厂模式</h2>
<h3>步骤 1：定义策略接口</h3>
<pre><code class="language-java">public interface PaymentStrategy {
    /** 判断是否支持该支付类型 */
    boolean supports(String payType);

    /** 执行支付 */
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

    private final List&lt;PaymentStrategy&gt; strategies;

    public PaymentStrategyFactory(List&lt;PaymentStrategy&gt; strategies) {
        this.strategies = strategies;
    }

    public PaymentStrategy getStrategy(String payType) {
        return strategies.stream()
            .filter(s -&gt; s.supports(payType))
            .findFirst()
            .orElseThrow(() -&gt;
                new IllegalArgumentException("不支持: " + payType));
    }
}</code></pre>
<h3>步骤 4：在 Service 中使用</h3>
<pre><code class="language-java">@Service
public class PaymentService {

    private final PaymentStrategyFactory factory;

    public PaymentResult pay(PaymentRequest request) {
        PaymentStrategy strategy =
            factory.getStrategy(request.getPayType());
        return strategy.pay(request);
    }
}</code></pre>
<p><strong>现在，如果要新增一种支付方式</strong>（比如「银联支付」），你只需要：</p>
<ol>
<li>创建一个新的 <code>UnionPayPaymentStrategy</code> 类，实现 <code>PaymentStrategy</code> 接口</li>
<li>添加 <code>@Component</code> 注解</li>
</ol>
<p><strong>无需修改任何现有代码！</strong>Spring 会自动发现并注入新策略。</p>
<h2>TypeScript 版本实现</h2>
<p>同样的模式在 TypeScript（Vue/React 项目）中的实现：</p>
<pre><code class="language-typescript">interface PaymentStrategy {
  readonly type: string
  pay(request: PaymentRequest): Promise&lt;PaymentResult&gt;
}

class WechatPayment implements PaymentStrategy {
  readonly type = 'WECHAT'
  async pay(req: PaymentRequest): Promise&lt;PaymentResult&gt; {
    return { success: true, message: '微信支付成功' }
  }
}

class AlipayPayment implements PaymentStrategy {
  readonly type = 'ALIPAY'
  async pay(req: PaymentRequest): Promise&lt;PaymentResult&gt; {
    return { success: true, message: '支付宝支付成功' }
  }
}

class PaymentStrategyRegistry {
  private strategies = new Map&lt;string, PaymentStrategy&gt;()

  register(strategy: PaymentStrategy): void {
    this.strategies.set(strategy.type, strategy)
  }

  get(type: string): PaymentStrategy {
    const s = this.strategies.get(type)
    if (!s) throw new Error(`不支持: ${type}`)
    return s
  }
}

// 使用
const registry = new PaymentStrategyRegistry()
registry.register(new WechatPayment())
registry.register(new AlipayPayment())

async function handlePayment(type: string, req: PaymentRequest) {
  return registry.get(type).pay(req)
}</code></pre>
<h2>总结</h2>
<p>策略模式 + 工厂模式的组合在实战中非常实用，适用的场景包括：</p>
<ul>
<li><strong>支付/计费系统</strong>：不同支付渠道、不同计费规则</li>
<li><strong>消息通知</strong>：短信、邮件、推送等不同通知渠道</li>
<li><strong>导出功能</strong>：PDF、Excel、CSV 等不同导出格式</li>
<li><strong>第三方集成</strong>：对接不同厂商的 API</li>
</ul>
<p>记住：<strong>当你发现代码中出现了大量的 if-else 或 switch-case 判断类似逻辑时，就是策略模式登场的时候了。</strong></p>""",
            "status": "PUBLISHED",
            "categoryId": 13,
            "tagIds": [24, 29, 19, 21]
        }
    }
]

for article in articles:
    with open(article["file"], "w", encoding="utf-8") as f:
        json.dump(article["data"], f, ensure_ascii=False)
    print(f"Written: {article['file']}")
    # Verify
    with open(article["file"], "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  Verified OK: {data['title']}")

print("\nDone!")
