// HTML templates for Xiaohongshu-style markdown cards.

export const SIZES = {
  xhs: { width: 1242, height: 1660 }, // XHS image-text standard 3:4
  square: { width: 1080, height: 1080 }, // 1:1
  story: { width: 1080, height: 1920 }, // 9:16 story
}

const THEMES = {
  'xhs-soft': {
    page: 'background:#fdf3ec;color:#3d2b28;',
    accent: '#ff2e4d',
    soft: '#ffe8ec',
    card: 'background:#ffffff;border-radius:36px;',
    muted: '#9a7f76',
    label: '小红书 · 奶油暖调',
  },
  'xhs-dark': {
    dark: true,
    page: 'background:#191926;color:#f2eef5;',
    accent: '#ff7a8a',
    soft: '#2b2b3d',
    card: 'background:#232334;border-radius:36px;',
    muted: '#9d96b0',
    label: '小红书 · 深夜暗调',
  },
  plain: {
    page: 'background:#ffffff;color:#1f2328;',
    accent: '#0969da',
    soft: '#f0f6ff',
    card: 'background:#ffffff;border-radius:0px;',
    muted: '#6a737d',
    label: '简洁白底',
  },
  forest: {
    page: 'background:#f2f0e6;color:#25352b;',
    accent: '#2f6b4f',
    soft: '#dfe9df',
    card: 'background:#fbfaf4;border-radius:28px;',
    muted: '#7c8a7e',
    label: '森林 · 墨绿米白',
  },
  sunset: {
    page: 'background:#fdf0e7;color:#3d2a24;',
    accent: '#f26d21',
    soft: '#ffe3d1',
    card: 'background:#fffaf3;border-radius:28px;',
    muted: '#a07f6d',
    label: '落日 · 暖橙',
  },
}

/** 版式风格：同一套配色下不同的排版气质。classic 为基座样式，其余为覆盖规则。 */
export const LAYOUTS = {
  classic: { css: '', label: '经典' },
  magazine: {
    label: '杂志',
    css: (k) => {
      const px = (n) => `${Math.round(n * k)}px`
      return `
  .cs-layout-magazine h1 { border-left: none; padding-left: 0; text-align: center; font-family: 'Songti SC','STSong','SimSun',serif; margin-bottom: ${px(8)}; }
  .cs-layout-magazine h1::after { content: ''; display: block; width: ${px(120)}; height: ${px(8)}; background: ACCENT; margin: ${px(28)} auto 0; border-radius: ${px(4)}; }
  .cs-layout-magazine h2 { text-align: center; font-family: 'Songti SC','STSong','SimSun',serif; }
  .cs-layout-magazine p { text-align: justify; }
  .cs-layout-magazine blockquote { text-align: center; font-style: italic; border-left: none; background: transparent; font-size: ${px(42)}; }
  .cs-layout-magazine hr { height: ${px(2)}; background: SOFT; }`
    },
  },
  poster: {
    label: '大字报',
    css: (k) => {
      const px = (n) => `${Math.round(n * k)}px`
      return `
  .cs-layout-poster h1 { border-left: none; padding-left: 0; font-size: ${px(104)}; line-height: 1.15; }
  .cs-layout-poster h2 { background: ACCENT; color: #ffffff; display: inline-block; padding: ${px(12)} ${px(32)}; border-radius: ${px(12)}; font-size: ${px(46)}; margin-bottom: ${px(30)}; }
  .cs-layout-poster strong { background: ACCENT; color: #ffffff; padding: ${px(2)} ${px(12)}; border-radius: ${px(8)}; }
  .cs-layout-poster p { font-size: ${px(42)}; font-weight: 600; }
  .cs-layout-poster blockquote { background: transparent; border-left: none; padding-left: 0; font-size: ${px(44)}; font-weight: 700; color: ACCENT; }`
    },
  },
  notebook: {
    label: '手账',
    css: (k) => {
      const px = (n) => `${Math.round(n * k)}px`
      return `
  .cs-layout-notebook { background-image: repeating-linear-gradient(transparent, transparent ${px(55)}, SOFT ${px(56)}); }
  .cs-layout-notebook h1 { border-left: none; padding: ${px(10)} ${px(24)}; background: SOFT; border-radius: ${px(16)}; }
  .cs-layout-notebook h2 { display: inline-block; background: SOFT; padding: ${px(8)} ${px(26)}; border-radius: ${px(999)}; }
  .cs-layout-notebook blockquote { border-radius: ${px(24)}; }
  .cs-layout-notebook li::marker { content: '✦ '; }
  .cs-layout-notebook pre { border-radius: ${px(24)}; }`
    },
  },
}

export function layoutOf(layout) {
  return LAYOUTS[layout] ?? LAYOUTS.classic
}

const SANS = `-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC','Helvetica Neue',Arial,sans-serif`
const MONO = `'SF Mono',ui-monospace,'JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace`

export function themeOf(style) {
  return THEMES[style] ?? THEMES['xhs-soft']
}

export function sizeOf(size) {
  return SIZES[size] ?? SIZES.xhs
}

function pageCss(theme, width) {
  const k = width / 1242
  const px = (n) => `${Math.round(n * k)}px`
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; }
  body {
    ${theme.page}
    font-family: ${SANS};
    padding: ${px(96)};
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  h1 {
    font-size: ${px(64)}; font-weight: 800; line-height: 1.35;
    margin: ${px(8)} 0 ${px(36)};
    padding-left: ${px(24)};
    border-left: ${px(12)} solid ${theme.accent};
    letter-spacing: 0.01em;
  }
  h2 {
    font-size: ${px(50)}; font-weight: 700; line-height: 1.4;
    margin: ${px(48)} 0 ${px(22)};
    color: ${theme.accent};
  }
  h3 {
    font-size: ${px(42)}; font-weight: 700; line-height: 1.4;
    margin: ${px(36)} 0 ${px(16)};
  }
  p {
    font-size: ${px(38)}; line-height: 1.6;
    margin: ${px(18)} 0;
  }
  strong { font-weight: 800; color: ${theme.accent}; }
  em { font-style: normal; background: linear-gradient(transparent 62%, ${theme.soft} 62%); font-weight: 600; }
  ul, ol {
    font-size: ${px(38)}; line-height: 1.6;
    margin: ${px(18)} 0 ${px(18)} ${px(30)};
    padding-left: ${px(34)};
  }
  li { margin: ${px(12)} 0; }
  li::marker { color: ${theme.accent}; font-weight: 700; }
  blockquote {
    margin: ${px(24)} 0;
    padding: ${px(22)} ${px(30)};
    background: ${theme.soft};
    border-left: ${px(10)} solid ${theme.accent};
    border-radius: ${px(16)};
    font-size: ${px(36)};
  }
  blockquote p { margin: 0; }
  code {
    font-family: ${MONO};
    font-size: 0.88em;
    background: ${theme.soft};
    padding: ${px(4)} ${px(14)};
    border-radius: ${px(10)};
  }
  pre {
    font-family: ${MONO};
    background: ${theme.soft};
    padding: ${px(28)} ${px(32)};
    border-radius: ${px(20)};
    overflow: hidden;
    margin: ${px(24)} 0;
  }
  pre code { background: transparent; padding: 0; font-size: ${px(30)}; line-height: 1.55; }
  img { max-width: 100%; border-radius: ${px(24)}; margin: ${px(20)} 0; display: block; }
  table { width: 100%; border-collapse: collapse; margin: ${px(24)} 0; font-size: ${px(34)}; }
  th, td { border: ${px(2)} solid ${theme.muted}; padding: ${px(16)} ${px(20)}; text-align: left; }
  th { background: ${theme.soft}; font-weight: 700; }
  hr { border: none; height: ${px(4)}; background: ${theme.soft}; margin: ${px(40)} 0; border-radius: ${px(4)}; }
  a { color: ${theme.accent}; text-decoration: none; font-weight: 600; }
  .cs-footer {
    position: absolute;
    bottom: ${px(56)};
    left: ${px(96)};
    right: ${px(96)};
    font-size: ${px(30)};
    color: ${theme.muted};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cs-footer .cs-tag {
    background: ${theme.soft};
    color: ${theme.accent};
    font-weight: 700;
    padding: ${px(8)} ${px(22)};
    border-radius: ${px(999)};
  }
  .cs-cover {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }
  .cs-cover .cs-emoji { font-size: ${px(160)}; line-height: 1.2; }
  .cs-cover .cs-cover-title {
    font-size: ${px(96)};
    font-weight: 800;
    line-height: 1.3;
    margin-top: ${px(48)};
  }
  .cs-cover .cs-cover-sub {
    font-size: ${px(44)};
    color: ${theme.muted};
    line-height: 1.6;
    margin-top: ${px(30)};
    max-width: ${px(950)};
  }
  .cs-cover .cs-cover-badge {
    margin-top: ${px(60)};
    display: inline-flex;
    align-self: flex-start;
    background: ${theme.accent};
    color: #ffffff;
    font-size: ${px(36)};
    font-weight: 700;
    padding: ${px(16)} ${px(36)};
    border-radius: ${px(999)};
  }
  `
}

function bodyPage(bodyHtml, theme, width, footer, layoutName, bgImage) {
  const layout = layoutOf(layoutName)
  const k = width / 1242
  const layoutCss = layout.css
    ? layout.css(k).replaceAll('ACCENT', theme.accent).replaceAll('SOFT', theme.soft)
    : ''
  const bgCss = bgImage
    ? `background-image:url('${String(bgImage).replaceAll("'", '%27')}');background-size:cover;background-position:center;`
    : ''
  const overlayCss = bgImage
    ? `.cs-has-bg::before{content:'';position:absolute;inset:0;background:${theme.dark ? 'rgba(16,16,26,0.72)' : 'rgba(255,255,255,0.78)'};z-index:0;}
.cs-has-bg > *{position:relative;z-index:1;}`
    : ''
  const tagText = `${layout.label} · ${theme.label}`
  const footerHtml = footer
    ? `<div class="cs-footer"><span>${escapeHtml(footer)}</span><span class="cs-tag">${escapeHtml(tagText)}</span></div>`
    : `<div class="cs-footer"><span></span><span class="cs-tag">${escapeHtml(tagText)}</span></div>`
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>${pageCss(theme, width)}${layoutCss}${overlayCss}</style>
</head>
<body class="cs-layout-${escapeHtml(layoutName)}${bgImage ? ' cs-has-bg' : ''}" style="${bgCss}">${bodyHtml}${footerHtml}</body>
</html>`
}

export function renderCardHtml({ bodyHtml, style, size, footer, layout, bgImage }) {
  const theme = themeOf(style)
  const { width } = sizeOf(size)
  return bodyPage(`<div class="cs-content">${bodyHtml}</div>`, theme, width, footer, layout ?? 'classic', bgImage)
}

export function renderCoverHtml({ title, subtitle, emoji, style, size, footer, layout, bgImage }) {
  const theme = themeOf(style)
  const { width } = sizeOf(size)
  const body = `
<div class="cs-cover">
  ${emoji ? `<div class="cs-emoji">${escapeHtml(emoji)}</div>` : ''}
  <div class="cs-cover-title">${escapeHtml(title ?? '')}</div>
  ${subtitle ? `<div class="cs-cover-sub">${escapeHtml(subtitle)}</div>` : ''}
  <span class="cs-cover-badge">干货 · 收藏级</span>
</div>`
  return bodyPage(body, theme, width, footer, layout ?? 'classic', bgImage)
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
