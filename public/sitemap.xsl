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
            --color-primary: #006CFA;
            --color-secondary: #9c5de8;
            --color-base-100: #ffffff;
            --color-base-200: #eef0f2;
            --color-base-300: #dcdee0;
            --color-base-content: #1e2328;
            --root-bg: #fafbfc;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --color-primary: #378dff;
              --color-secondary: #b071ff;
              --color-base-100: #181c20;
              --color-base-200: #22262a;
              --color-base-300: #2c3034;
              --color-base-content: #f0f4f8;
              --root-bg: #121416;
            }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: "Fixel", "Fixel Fallback", system-ui, sans-serif;
            background: var(--root-bg);
            color: var(--color-base-content);
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
            border-bottom: 1px solid var(--color-base-300);
          }

          .logo {
            font-family: "Young Serif", "Young Serif Fallback", Georgia, serif;
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-decoration: none;
          }

          h1 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 0.5rem;
          }

          .description {
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
          }

          .stat-value {
            font-weight: 600;
            color: var(--color-primary);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background: var(--color-base-100);
            border-radius: 0.25rem;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          thead {
            background: var(--color-base-200);
          }

          th {
            text-align: left;
            padding: 0.75rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.75;
          }

          td {
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--color-base-200);
            font-size: 0.875rem;
          }

          tbody tr:hover {
            background: var(--color-base-200);
          }

          a {
            color: var(--color-primary);
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
            background: var(--color-base-200);
          }

          .priority-high {
            background: rgba(0, 108, 250, 0.15);
            color: var(--color-primary);
          }

          .secondary {
            font-size: 0.75rem;
            opacity: 0.8;
          }

          .tabular {
            font-variant-numeric: tabular-nums;
          }

          footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--color-base-300);
            text-align: center;
            font-size: 0.75rem;
            opacity: 0.8;
          }

          footer a:hover {
            color: var(--color-primary);
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
            <a href="/" class="logo">ViaPro.to</a>
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
                  <td class="hide-mobile secondary tabular">
                    <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                  </td>
                  <td class="hide-mobile secondary">
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
            <p>
              <a href="/">Back to ViaProto</a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
