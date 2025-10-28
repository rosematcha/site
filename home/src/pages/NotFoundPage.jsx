// src/pages/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

function NotFoundPage() {
  return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: 'var(--space-16)' }}>
      <img 
        src="/img/404.gif" 
        alt="404 - Page Not Found" 
        style={{ maxWidth: '250px', width: '100%', margin: '0 auto var(--space-6)', display: 'block', borderRadius: '6px' }} 
      />
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
