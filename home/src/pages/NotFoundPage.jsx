// src/pages/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

function NotFoundPage() {
  return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: 'var(--space-16)' }}>
      <AlertCircle size={80} style={{ color: 'var(--accent-primary)', margin: '0 auto var(--space-6)' }} />
      <h1 style={{ marginBottom: 'var(--space-4)' }}>404 - Page Not Found</h1>
      <p style={{ fontSize: 'var(--font-body-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        Whoops! Either something went wrong or this page doesn't exist.
      </p>

      <Link to="/" className="button">
        <Home size={20} />
        Back to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
