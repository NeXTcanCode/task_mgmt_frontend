import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => { document.title = 'Not found · TaskTracker'; }, []);
  return <main className="not-found">
    <p className="not-found-code">404</p>
    <h1>Page not found</h1>
    <Link to="/" className="btn btn-primary">Go to Tasks</Link>
  </main>;
}
