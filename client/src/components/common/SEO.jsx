import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, path = '' }) => {
  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${path}`
    : path;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};

export default SEO;
