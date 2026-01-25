import React from "react";
import { Link } from "react-router-dom";
import { notesPosts } from "../data/notes";
import "./BlogPage.css";

function BlogPage() {
  return (
    <div className="page-content blog-page">
      <header className="blog-page__header">
        <h2>Notes</h2>
        <p>Varyingly structured thoughts on things I'm doing.</p>
      </header>

      <section className="blog-page__list" aria-live="polite">
        {notesPosts.length === 0 ? (
          <div className="card blog-page__empty">
            <h3>Fresh notebooks, no entries yet.</h3>
            <p>Drop a markdown file into the notes directory and it will appear here.</p>
          </div>
        ) : (
          notesPosts.map(post => (
            <article key={post.slug} className="card blog-post-card">
              <h3 className="blog-post-card__title">
                <Link to={`/notes/${post.slug}`}>{post.title}</Link>
              </h3>
              {post.preview ? <p className="blog-post-card__preview">{post.preview}</p> : null}
              <div className="blog-post-card__meta">
                <Link className="blog-post-card__link" to={`/notes/${post.slug}`}>
                  Read the post
                </Link>
                {post.date ? (
                  <time className="blog-post-card__date" dateTime={post.date}>
                    {post.date}
                  </time>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default BlogPage;
