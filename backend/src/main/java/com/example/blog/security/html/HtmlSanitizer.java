package com.example.blog.security.html;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

@Component
public class HtmlSanitizer {

  private final Safelist safelist;

  public HtmlSanitizer() {
    this.safelist = Safelist.relaxed()
        .addTags("h1", "h2", "h3", "h4", "h5", "h6", "pre", "code")
        .addAttributes("a", "target", "rel")
        .addAttributes("img", "src", "alt", "title", "width", "height")
        .addProtocols("a", "href", "http", "https", "mailto")
        .addProtocols("img", "src", "http", "https")
        .preserveRelativeLinks(true);
  }

  public String sanitize(String html) {
    if (html == null || html.isBlank()) {
      return "";
    }
    Document document = Jsoup.parseBodyFragment(html);
    for (Element image : document.select("img[src]")) {
      String src = image.attr("src");
      if (src.startsWith("/uploads/")) {
        image.attr("src", "https://blog.local" + src);
      }
    }
    Document.OutputSettings settings = new Document.OutputSettings().prettyPrint(false);
    return Jsoup.clean(document.body().html(), "", safelist, settings)
        .replace("https://blog.local/uploads/", "/uploads/");
  }
}
