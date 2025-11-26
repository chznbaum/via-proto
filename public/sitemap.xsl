<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap - ViaProto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex, follow"/>
        <style>
          :root {
            --primary: #006CFA;
            --secondary: #9c5de8;
            --base-100: #ffffff;
            --base-200: #eef0f2;
            --base-300: #dcdee0;
            --base-content: #1e2328;
            --base-content-muted: #6b7280;
            --root-bg: #fafbfc;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --primary: #378dff;
              --secondary: #b071ff;
              --base-100: #181c20;
              --base-200: #22262a;
              --base-300: #2c3034;
              --base-content: #f0f4f8;
              --base-content-muted: #9ca3af;
              --root-bg: #121416;
            }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--root-bg);
            color: var(--base-content);
            line-height: 1.6;
            min-height: 100vh;
          }

          .container {
            max-width: 1024px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }

          header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--base-300);
          }

          .logo {
            font-family: Georgia, serif;
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-decoration: none;
          }

          h1 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 0.5rem;
            color: var(--base-content);
          }

          .description {
            color: var(--base-content);
            opacity: 0.8;
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }

          .stats {
            display: flex;
            gap: 1.5rem;
            margin-top: 1rem;
            font-size: 0.875rem;
          }

          .stat {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            color: var(--base-content);
          }

          .stat-value {
            font-weight: 600;
            color: var(--primary);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background: var(--base-100);
            border-radius: 0.25rem;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          thead {
            background: var(--base-200);
          }

          th {
            text-align: left;
            padding: 0.75rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--base-content);
            opacity: 0.7;
          }

          td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--base-200);
            font-size: 0.875rem;
          }

          tbody tr:hover {
            background: var(--base-200);
          }

          a {
            color: var(--primary);
            text-decoration: none;
            word-break: break-all;
          }

          a:hover {
            text-decoration: underline;
          }

          .priority {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 2.5rem;
            padding: 0.125rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 9999px;
            background: var(--base-200);
            color: var(--base-content);
          }

          .priority-high {
            background: rgba(0, 108, 250, 0.15);
            color: var(--primary);
          }

          .frequency {
            font-size: 0.75rem;
            color: var(--base-content);
            opacity: 0.8;
          }

          .date {
            font-size: 0.75rem;
            color: var(--base-content);
            opacity: 0.8;
            font-variant-numeric: tabular-nums;
          }

          footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--base-300);
            text-align: center;
            font-size: 0.75rem;
            color: var(--base-content);
            opacity: 0.8;
          }

          footer a {
            color: var(--base-content);
          }

          footer a:hover {
            color: var(--primary);
          }

          @media (max-width: 640px) {
            .hide-mobile {
              display: none;
            }

            td, th {
              padding: 0.5rem;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <a href="/" class="logo">ViaProto</a>
            <h1>Sitemap</h1>
            <p class="description">All pages available for indexing on this site.</p>
            <div class="stats">
              <div class="stat">
                <span class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
                <span>URLs</span>
              </div>
            </div>
          </header>

          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th class="hide-mobile">Last Modified</th>
                <th class="hide-mobile">Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <xsl:sort select="sitemap:priority" order="descending" data-type="number"/>
                <tr>
                  <td>
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td class="hide-mobile date">
                    <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                  </td>
                  <td class="hide-mobile frequency">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:variable name="priority" select="sitemap:priority"/>
                    <span>
                      <xsl:attribute name="class">
                        <xsl:choose>
                          <xsl:when test="$priority >= 0.8">priority priority-high</xsl:when>
                          <xsl:otherwise>priority</xsl:otherwise>
                        </xsl:choose>
                      </xsl:attribute>
                      <xsl:value-of select="$priority"/>
                    </span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <footer>
            <p style="margin-top: 0.5rem;">
              <a href="/">Back to ViaProto</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
