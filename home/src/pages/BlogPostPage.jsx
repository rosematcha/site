import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notesPosts } from "../data/notes";
import NotFoundPage from "./NotFoundPage";
import TableOfContents from "../components/TableOfContents";
import ReadingProgress from "../components/ReadingProgress";
import "./BlogPostPage.css";

/**
 * Calculate estimated reading time
 */
const calculateReadingTime = content => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
};

/**
 * Generate a slug from heading text
 */
const slugify = text =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const parseFootnotes = content => {
  const lines = content.split(/\r?\n/);
  const footnotes = {};
  let activeKey = null;

  lines.forEach(line => {
    const match = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (match) {
      const [, key, rest] = match;
      activeKey = key.trim();
      footnotes[activeKey] = rest.trim();
      return;
    }

    if (activeKey && (line.startsWith("  ") || line.startsWith("\t"))) {
      const continuation = line.trim();
      if (continuation) {
        footnotes[activeKey] = `${footnotes[activeKey]} ${continuation}`.trim();
      }
      return;
    }

    activeKey = null;
  });

  return footnotes;
};

/**
 * Smooth scroll animation with cubic easing
 */
const quickScrollTo = (targetY, duration = 250) => {
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (diff === 0) return;
  
  const startTime = performance.now();

  // Cubic ease-in-out for smoother motion
  const easeInOutCubic = t => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = currentTime => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + diff * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

function BlogPostPage() {
  const { slug } = useParams();
  const post = useMemo(() => notesPosts.find(entry => entry.slug === slug), [slug]);
  const footnotes = useMemo(() => (post ? parseFootnotes(post.content) : {}), [post]);
  const readingTime = useMemo(() => (post ? calculateReadingTime(post.content) : 0), [post]);
  const [activeFootnote, setActiveFootnote] = useState(null);
  const footnoteTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (footnoteTimeoutRef.current) {
        clearTimeout(footnoteTimeoutRef.current);
      }
    };
  }, []);

  // Quick scroll for footnote and backref links (no URL hash change, with highlight)
  useEffect(() => {
    const handleClick = e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        // Don't update URL hash - just scroll
        const offset = 80;
        quickScrollTo(target.offsetTop - offset, 250);
        
        // Highlight the target
        target.classList.add("footnote-highlight");
        setTimeout(() => {
          target.classList.remove("footnote-highlight");
        }, 3000);
      }
    };

    const article = document.querySelector(".blog-markdown");
    if (article) {
      article.addEventListener("click", handleClick);
      return () => article.removeEventListener("click", handleClick);
    }
  }, []);

  const handleFootnoteEnter = useCallback(ref => {
    if (footnoteTimeoutRef.current) {
      clearTimeout(footnoteTimeoutRef.current);
    }
    setActiveFootnote(ref);
  }, []);

  const handleFootnoteLeave = useCallback(() => {
    footnoteTimeoutRef.current = setTimeout(() => {
      setActiveFootnote(null);
    }, 100);
  }, []);

  if (!post) {
    return <NotFoundPage />;
  }

  return (
    <>
      <ReadingProgress />
      <div className="page-content blog-post-page">
        <div className="blog-post-layout">
          <div className="blog-post-layout__toc">
            <TableOfContents content={post.content} title={post.title} />
          </div>
          <div className="blog-post-layout__content">
            <header className="blog-post-page__header">
              <Link className="blog-post-page__back" to="/notes">
                Back to notes
              </Link>
              <h2>{post.title}</h2>
              <div className="blog-post-page__meta">
                {post.date ? (
                  <time className="blog-post-page__date" dateTime={post.date}>
                    {post.date}
                  </time>
                ) : null}
                <span className="blog-post-page__reading-time">
                  {readingTime} min read
                </span>
              </div>
            </header>

            <article className="blog-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ node, children, ...props }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h2 id={id} {...props}>
                        <a href={`#${id}`} className="heading-anchor" aria-hidden="true">
                          #
                        </a>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ node, children, ...props }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h3 id={id} {...props}>
                        <a href={`#${id}`} className="heading-anchor" aria-hidden="true">
                          #
                        </a>
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ node, children, ...props }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h4 id={id} {...props}>
                        <a href={`#${id}`} className="heading-anchor" aria-hidden="true">
                          #
                        </a>
                        {children}
                      </h4>
                    );
                  },
                  a: ({ node, ...props }) => {
                    const href = typeof props.href === "string" ? props.href : "";
                    const isFootnoteRef = href.startsWith("#fn-");
                    if (!isFootnoteRef) {
                      return <a {...props} />;
                    }
                    const ref = href.replace("#fn-", "");
                    const preview = ref ? footnotes[ref] : "";
                    const isActive = activeFootnote === ref;
                    return (
                      <a
                        {...props}
                        data-footnote-preview={preview || undefined}
                        data-footnote-active={isActive || undefined}
                        onMouseEnter={() => handleFootnoteEnter(ref)}
                        onMouseLeave={handleFootnoteLeave}
                        onFocus={() => handleFootnoteEnter(ref)}
                        onBlur={handleFootnoteLeave}
                      />
                    );
                  },
                }}
              >
                {post.content}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

export default BlogPostPage;
