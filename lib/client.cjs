window.__ModuleLoader__.load({
  id: "dsh-content-studio",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    var React = require("react")
    function injectCss(css) {
      if (typeof document === "undefined") return
      var style = document.createElement("style")
      style.setAttribute("data-dsh-content-studio", "panel")
      style.textContent = css
      document.head.appendChild(style)
    }
    async function api(method, args) {
      const res = await fetch("/content-studio-api/" + method, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args || {}),
      })
      return await res.json()
    }

const CSS = `
.csr-panel{position:fixed;right:16px;bottom:16px;width:400px;max-width:calc(100vw - 32px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,#ffffff);color:var(--dsw-alias-label-primary,#1f2328);border:1px solid var(--dsw-alias-border-l2,#e0e0e8);border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.28);overflow:hidden;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI',sans-serif}
.csr-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:var(--dsw-alias-bg-layer-2,#f4f4f7);border-bottom:1px solid var(--dsw-alias-border-l1,#e6e6ee);user-select:none}
.csr-title{font-size:13px;font-weight:700}
.csr-badge{font-size:11px;font-weight:700;color:#fff;padding:3px 10px;border-radius:999px}
.csr-mini{background:transparent;border:1px solid var(--dsw-alias-border-l2,#c9c9d6);color:var(--dsw-alias-label-secondary,#5f6b76);border-radius:8px;padding:3px 8px;font-size:11px;cursor:pointer}
.csr-body{display:flex;flex-direction:column;gap:10px;padding:12px;overflow-y:auto;max-height:calc(80vh - 44px)}
.csr-tabs{display:flex;gap:6px}
.csr-tab{flex:1;padding:6px 0;border-radius:8px;font-size:12px;font-weight:700;border:1px solid var(--dsw-alias-border-l2,#c9c9d6);background:var(--dsw-alias-bg-layer-2,#f4f4f7);color:var(--dsw-alias-label-secondary,#5f6b76);cursor:pointer;text-align:center}
.csr-tab-active{background:#3a5bff;color:#ffffff;border-color:#3a5bff}
.csr-thumbs{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.csr-thumbbox{width:92px;min-width:92px;height:124px;border-radius:8px;border:2px solid var(--dsw-alias-border-l2,#d0d0dc);overflow:hidden;cursor:zoom-in;flex-shrink:0;background:var(--dsw-alias-bg-layer-2,#f4f4f7)}
.csr-thumbbox:hover{border-color:#ff2e4d}
.csr-divider{border:none;border-top:1px dashed var(--dsw-alias-border-l2,#d0d0dc);margin:2px 0}
.csr-label-row{display:flex;justify-content:space-between;align-items:center;margin:2px 0}
.csr-label{font-size:11px;color:var(--dsw-alias-label-secondary,#6a737d)}
.csr-count{font-size:10px;color:var(--dsw-alias-label-secondary,#8a94a0)}
.csr-input,.csr-textarea{width:100%;background:var(--dsw-alias-bg-base,#ffffff);color:var(--dsw-alias-label-primary,#1f2328);border:1px solid var(--dsw-alias-border-l1,#d9d9e3);border-radius:8px;padding:7px 9px;font-size:12px;box-sizing:border-box}
.csr-textarea{min-height:120px;resize:vertical;font-family:ui-monospace,'SF Mono',Menlo,monospace;line-height:1.5}
.csr-row{display:flex;gap:6px}
.csr-row .csr-input{flex:1}
.csr-btn{flex:1;border:none;border-radius:8px;padding:9px 8px;font-size:12.5px;font-weight:700;color:#fff;cursor:pointer}
.csr-btn:disabled{opacity:.55;cursor:default}
.csr-save{background:#3a5bff}
.csr-approve{background:#18a058}
.csr-reject{background:#d03050}
.csr-hint{font-size:11px;color:var(--dsw-alias-label-secondary,#6a737d);line-height:1.5;background:var(--dsw-alias-bg-layer-2,#f4f4f7);border-radius:8px;padding:8px 10px}
.csr-preview{position:fixed;inset:0;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;z-index:2147483001;cursor:zoom-out}
.csr-preview-box{border-radius:12px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7)}

.csx{position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC','Helvetica Neue',Arial,sans-serif;padding:96px;box-sizing:border-box}
.csx-soft{background:#fdf3ec;color:#3d2b28;--csx-accent:#ff2e4d;--csx-soft:#ffe8ec;--csx-muted:#9a7f76}
.csx-dark{background:#191926;color:#f2eef5;--csx-accent:#ff7a8a;--csx-soft:#2b2b3d;--csx-muted:#9d96b0;--csx-bgoverlay:rgba(16,16,26,.72)}
.csx-plain{background:#ffffff;color:#1f2328;--csx-accent:#0969da;--csx-soft:#f0f6ff;--csx-muted:#6a737d}
.csx-forest{background:#f2f0e6;color:#25352b;--csx-accent:#2f6b4f;--csx-soft:#dfe9df;--csx-muted:#7c8a7e}
.csx-sunset{background:#fdf0e7;color:#3d2a24;--csx-accent:#f26d21;--csx-soft:#ffe3d1;--csx-muted:#a07f6d}
.csx h1{font-size:64px;font-weight:800;line-height:1.35;margin:8px 0 36px;padding-left:24px;border-left:12px solid var(--csx-accent);letter-spacing:.01em}
.csx h2{font-size:50px;font-weight:700;line-height:1.4;margin:48px 0 22px;color:var(--csx-accent)}
.csx h3{font-size:42px;font-weight:700;line-height:1.4;margin:36px 0 16px}
.csx p{font-size:38px;line-height:1.6;margin:18px 0}
.csx strong{font-weight:800;color:var(--csx-accent)}
.csx ul,.csx ol{font-size:38px;line-height:1.6;margin:18px 0;padding-left:64px}
.csx li{margin:12px 0}
.csx li::marker{color:var(--csx-accent);font-weight:700}
.csx blockquote{margin:24px 0;padding:22px 30px;background:var(--csx-soft);border-left:10px solid var(--csx-accent);border-radius:16px;font-size:36px}
.csx blockquote p{margin:0}
.csx code{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:.88em;background:var(--csx-soft);padding:4px 14px;border-radius:10px}
.csx pre{font-family:ui-monospace,'SF Mono',Menlo,monospace;background:var(--csx-soft);padding:28px 32px;border-radius:20px;overflow:hidden;margin:24px 0}
.csx pre code{background:transparent;padding:0;font-size:30px;line-height:1.55}
.csx img{max-width:100%;border-radius:24px;margin:20px 0;display:block}
.csx hr{border:none;height:4px;background:var(--csx-soft);margin:40px 0;border-radius:4px}
.csx a{color:var(--csx-accent);text-decoration:none;font-weight:600}
.csx-cover{display:flex;flex-direction:column;justify-content:center;height:100%;box-sizing:border-box}
.csx-cover-emoji{font-size:160px;line-height:1.2}
.csx-cover-title{font-size:96px;font-weight:800;line-height:1.3;margin-top:48px}
.csx-cover-sub{font-size:44px;color:var(--csx-muted);line-height:1.6;margin-top:30px;max-width:950px}
.csx-cover-badge{margin-top:60px;align-self:flex-start;background:var(--csx-accent);color:#ffffff;font-size:36px;font-weight:700;padding:16px 36px;border-radius:999px}
.csx-footer{position:absolute;bottom:56px;left:96px;right:96px;font-size:30px;color:var(--csx-muted);display:flex;justify-content:space-between;align-items:center}
.csx-footer-tag{background:var(--csx-soft);color:var(--csx-accent);font-weight:700;padding:8px 22px;border-radius:999px}
.csx-hasbg{background-size:cover;background-position:center}
.csx-hasbg::before{content:'';position:absolute;inset:0;background:var(--csx-bgoverlay,rgba(255,255,255,.78));pointer-events:none}
.csx-hasbg>*{position:relative;z-index:1}
.csx-magazine h1{border-left:none;padding-left:0;text-align:center;font-family:'Songti SC','STSong','SimSun',serif;margin-bottom:8px}
.csx-magazine h1::after{content:'';display:block;width:120px;height:8px;background:var(--csx-accent);margin:28px auto 0;border-radius:4px}
.csx-magazine h2{text-align:center;font-family:'Songti SC','STSong','SimSun',serif}
.csx-magazine p{text-align:justify}
.csx-magazine blockquote{text-align:center;font-style:italic;border-left:none;background:transparent;font-size:42px}
.csx-poster h1{border-left:none;padding-left:0;font-size:104px;line-height:1.15}
.csx-poster h2{background:var(--csx-accent);color:#ffffff;display:inline-block;padding:12px 32px;border-radius:12px;font-size:46px;margin-bottom:30px}
.csx-poster strong{background:var(--csx-accent);color:#ffffff;padding:2px 12px;border-radius:8px}
.csx-poster p{font-size:42px;font-weight:600}
.csx-poster blockquote{background:transparent;border-left:none;padding-left:0;font-size:44px;font-weight:700;color:var(--csx-accent)}
.csx-notebook{background-image:repeating-linear-gradient(transparent,transparent 55px,var(--csx-soft) 56px)}
.csx-notebook h1{border-left:none;padding:10px 24px;background:var(--csx-soft);border-radius:16px}
.csx-notebook h2{display:inline-block;background:var(--csx-soft);padding:8px 26px;border-radius:999px}
.csx-notebook li::marker{content:'✦ '}
`

function escapeHtml(s) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function inlineMd(s) {
  let out = escapeHtml(s)
  out = out.replace(/`([^`]+)`/g, function (_m, c) { return '<code>' + c + '</code>' })
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return out
}

function mdToHtml(md) {
  const lines = String(md ?? '').split('\n')
  let html = ''
  let list = null
  let code = []
  const closeList = function () { if (list) { html += '</' + list + '>'; list = null } }
  const flushCode = function () { if (code.length) { html += '<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>'; code = [] } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      flushCode()
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i += 1 }
      flushCode()
      continue
    }
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (img) { closeList(); html += '<img src="' + escapeHtml(img[2]) + '" alt="' + escapeHtml(img[1]) + '"/>'; continue }
    const h = line.match(/^(#{1,3})\s+(.*)/)
    if (h) { closeList(); html += '<h' + h[1].length + '>' + inlineMd(h[2]) + '</h' + h[1].length + '>'; continue }
    if (line.startsWith('> ')) { closeList(); html += '<blockquote><p>' + inlineMd(line.slice(2)) + '</p></blockquote>'; continue }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeList(); html += '<hr/>'; continue }
    const ul = line.match(/^[-*]\s+(.*)/)
    const ol = line.match(/^\d+[.)]\s+(.*)/)
    if (ul || ol) {
      const tag = ul ? 'ul' : 'ol'
      if (list !== tag) { closeList(); list = tag; html += '<' + tag + '>' }
      html += '<li>' + inlineMd((ul || ol)[1]) + '</li>'
      continue
    }
    closeList()
    if (line.trim() === '') continue
    html += '<p>' + inlineMd(line) + '</p>'
  }
  closeList()
  flushCode()
  return html
}

function splitSections(md) {
  const lines = String(md ?? '').split('\n')
  const sections = []
  let title = ''
  let buf = []
  const flush = function () {
    if (title !== '' || buf.length > 0) sections.push({ title: title, lines: buf.slice() })
    buf = []
    title = ''
  }
  for (const line of lines) {
    const h = line.match(/^(#{1,2})\s+(.*)/)
    if (h) { flush(); title = h[2]; continue }
    buf.push(line)
  }
  flush()
  return sections
}

const DIMS = { xhs: [1242, 1660], square: [1080, 1080], story: [1080, 1920] }
const THEME_CLASS = { 'xhs-soft': 'soft', 'xhs-dark': 'dark', plain: 'plain', forest: 'forest', sunset: 'sunset' }
const THEME_LABEL = { 'xhs-soft': '奶油暖调', 'xhs-dark': '深夜暗调', plain: '简洁白底', forest: '森林墨绿', sunset: '落日暖橙' }
const LAYOUT_CLASS = { classic: '', magazine: 'csx-magazine', poster: 'csx-poster', notebook: 'csx-notebook' }
const LAYOUT_LABEL = { classic: '经典', magazine: '杂志', poster: '大字报', notebook: '手账' }

function footerHtml(footer, styleName, layoutName) {
  return '<div class="csx-footer"><span>' + escapeHtml(footer || '') + '</span><span class="csx-footer-tag">' + escapeHtml((LAYOUT_LABEL[layoutName] ?? layoutName ?? '') + ' · ' + (THEME_LABEL[styleName] ?? styleName ?? '')) + '</span></div>'
}

function coverHtml(cover, footer, styleName, layoutName) {
  const emoji = cover.emoji ? '<div class="csx-cover-emoji">' + escapeHtml(cover.emoji) + '</div>' : ''
  const title = cover.title ? '<div class="csx-cover-title">' + escapeHtml(cover.title) + '</div>' : ''
  const sub = cover.subtitle ? '<div class="csx-cover-sub">' + escapeHtml(cover.subtitle) + '</div>' : ''
  return '<div class="csx-cover">' + emoji + title + sub + '<span class="csx-cover-badge">干货 · 收藏级</span></div>' + footerHtml(footer, styleName, layoutName)
}

function sectionHtml(section, footer, styleName, layoutName) {
  const title = section.title !== '' ? '<h1>' + escapeHtml(section.title) + '</h1>' : ''
  return title + mdToHtml(section.lines.join('\n')) + footerHtml(footer, styleName, layoutName)
}

var plugin = {
  name: 'content-review-panel',
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    injectCss(CSS)

    const LABEL = { draft: '待审阅', edited: '已修改', approved: '已批准', rejected: '已打回' }
    const COLOR = { draft: '#d89a1f', edited: '#3a5bff', approved: '#18a058', rejected: '#d03050' }
    const TABS = [
      { id: 'review', label: '审阅' },
      { id: 'publish', label: '发布' },
      { id: 'settings', label: '设置' },
    ]
    let lastRevision = 0

    function CardBox(props) {
      const themeClass = 'csx-' + (THEME_CLASS[props.styleName] ?? 'soft')
      const layoutClass = LAYOUT_CLASS[props.layoutName] ?? ''
      const w = props.dims[0]
      const h = props.dims[1]
      const scale = props.scale
      return React.createElement('div', {
        className: 'csr-thumbbox',
        style: { width: Math.max(40, Math.round(w * scale)), height: Math.max(40, Math.round(h * scale)) },
        title: props.title,
        onClick: props.onZoom,
      }, React.createElement('div', {
        className: 'csx ' + themeClass + ' ' + layoutClass + (props.bgImage ? ' csx-hasbg' : ''),
        style: Object.assign(
          { width: w, height: h, transform: 'scale(' + scale + ')', transformOrigin: 'top left' },
          props.bgImage ? { backgroundImage: 'url(' + props.bgImage.replaceAll("'", '%27') + ')' } : {}
        ),
        dangerouslySetInnerHTML: { __html: props.html },
      }))
    }

    function Panel() {
      const [draft, setDraft] = React.useState(null)
      const [tab, setTab] = React.useState('review')
      const [md, setMd] = React.useState('')
      const [coverTitle, setCoverTitle] = React.useState('')
      const [coverSub, setCoverSub] = React.useState('')
      const [coverEmoji, setCoverEmoji] = React.useState('')
      const [footer, setFooter] = React.useState('')
      const [styleName, setStyleName] = React.useState('xhs-soft')
      const [layoutName, setLayoutName] = React.useState('classic')
      const [bgImage, setBgImage] = React.useState('')
      const [pubTitle, setPubTitle] = React.useState('')
      const [pubBody, setPubBody] = React.useState('')
      const [note, setNote] = React.useState('')
      const [keyStatus, setKeyStatus] = React.useState({ geminiSet: false, devtoSet: false })
      const [geminiInput, setGeminiInput] = React.useState('')
      const [devtoInput, setDevtoInput] = React.useState('')
      const [collapsed, setCollapsed] = React.useState(false)
      const [zoom, setZoom] = React.useState(null)
      const [busy, setBusy] = React.useState('')

      React.useEffect(() => {
        return ctx.interval(async () => {
          let d = null
          try {
            d = await api('get-draft', { revision: lastRevision })
          } catch (error) {
            return
          }
          if (d && d.unchanged) {
            setDraft((prev) => (prev ? Object.assign({}, prev, { status: d.status, revision: d.revision }) : prev))
            return
          }
          if (d) lastRevision = d.revision
          try {
            const k = await api('get-keys', {})
            if (k) setKeyStatus({ geminiSet: Boolean(k.geminiSet), devtoSet: Boolean(k.devtoSet) })
          } catch (error) {
            // keys unavailable — keep last status
          }
          setDraft(d)
          if (d) {
            setMd((prev) => (prev === '' ? (d.markdown ?? '') : prev))
            setCoverTitle((prev) => (prev === '' ? (d.cover && d.cover.title ? d.cover.title : '') : prev))
            setCoverSub((prev) => (prev === '' ? (d.cover && d.cover.subtitle ? d.cover.subtitle : '') : prev))
            setCoverEmoji((prev) => (prev === '' ? (d.cover && d.cover.emoji ? d.cover.emoji : '') : prev))
            setFooter((prev) => (prev === '' ? (d.footer ?? '') : prev))
            if (d.style) setStyleName(d.style)
            if (d.layout) setLayoutName(d.layout)
            setBgImage((prev) => (prev === '' ? (d.bgImage ?? '') : prev))
            setPubTitle((prev) => (prev === '' ? (d.publishTitle ?? '') : prev))
            setPubBody((prev) => (prev === '' ? (d.publishBody ?? '') : prev))
          }
        }, 2000)
      }, [])

      const save = async () => {
        setBusy('保存中…')
        try {
          const r = await api('save-draft', {
            markdown: md,
            cover: { title: coverTitle, subtitle: coverSub, emoji: coverEmoji },
            footer: footer,
            style: styleName,
            layout: layoutName,
            bgImage: bgImage,
            publishTitle: pubTitle,
            publishBody: pubBody,
            note: note,
          })
          lastRevision = r.revision ?? lastRevision
          setBusy('已保存，agent 会重新渲染正式卡片')
        } catch (error) {
          setBusy('保存失败')
        }
      }

      const saveKeys = async () => {
        setBusy('保存 Keys…')
        try {
          const r = await api('save-keys', { geminiApiKey: geminiInput, devtoApiKey: devtoInput })
          if (r && r.ok) {
            setKeyStatus({ geminiSet: Boolean(r.geminiSet), devtoSet: Boolean(r.devtoSet) })
            setGeminiInput('')
            setDevtoInput('')
            setBusy('Keys 已保存')
          } else {
            setBusy('保存失败：' + (r && r.error ? r.error : 'unknown'))
          }
        } catch (error) {
          setBusy('保存失败')
        }
      }

      const decide = async (decision) => {
        setBusy(decision === 'approve' ? '提交批准…' : '提交打回…')
        try {
          const r = await api('decide', { decision: decision, note: note })
          lastRevision = r.revision ?? lastRevision
          setBusy(decision === 'approve' ? '已批准' : '已打回')
        } catch (error) {
          setBusy('提交失败')
        }
      }

      if (draft === null) return null
      const badge = LABEL[draft.status] ?? draft.status
      const dims = DIMS[draft.size] ?? DIMS.xhs
      const thumbScale = 92 / dims[0]
      const cover = { emoji: coverEmoji, title: coverTitle, subtitle: coverSub }
      const hasCover = coverEmoji !== '' || coverTitle !== '' || coverSub !== ''
      const sections = splitSections(md)
      const previews = []
      if (hasCover) {
        previews.push({ key: 'cover', title: '封面', html: coverHtml(cover, footer, styleName, layoutName) })
      }
      sections.forEach((s, i) => {
        previews.push({ key: 's' + i, title: s.title || ('卡片 ' + (i + 1)), html: sectionHtml(s, footer, styleName, layoutName) })
      })

      const tabBar = React.createElement('div', { className: 'csr-tabs' },
        TABS.map((t) => React.createElement('div', {
          key: t.id,
          className: 'csr-tab' + (tab === t.id ? ' csr-tab-active' : ''),
          onClick: () => setTab(t.id),
        }, t.label)))

      const reviewTab = React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        React.createElement('div', { className: 'csr-label-row' },
          React.createElement('span', { className: 'csr-label' }, '实时预览 · ' + previews.length + ' 张'),
          React.createElement('span', { className: 'csr-count' }, '点缩略图看大图'),
        ),
        previews.length > 0
          ? React.createElement('div', { className: 'csr-thumbs' },
              previews.map((p) => React.createElement(CardBox, {
                key: p.key,
                title: p.title,
                html: p.html,
                dims: dims,
                scale: thumbScale,
                styleName: styleName,
                layoutName: layoutName,
                bgImage: bgImage,
                onZoom: () => setZoom({ key: p.key, html: p.html, dims: dims, styleName: styleName, layoutName: layoutName, bgImage: bgImage }),
              })))
          : null,
        React.createElement('div', { className: 'csr-row' },
          React.createElement('input', { className: 'csr-input', style: { flex: '0 0 52px' }, value: coverEmoji, placeholder: '🎬', onChange: (e) => setCoverEmoji(e.target.value) }),
          React.createElement('input', { className: 'csr-input', value: coverTitle, placeholder: '封面标题', onChange: (e) => setCoverTitle(e.target.value) }),
          React.createElement('input', { className: 'csr-input', value: coverSub, placeholder: '封面副标题', onChange: (e) => setCoverSub(e.target.value) }),
        ),
        React.createElement('div', { className: 'csr-row' },
          React.createElement('select', { className: 'csr-input', value: styleName, onChange: (e) => setStyleName(e.target.value) },
            React.createElement('option', { value: 'xhs-soft' }, '配色·奶油暖调'),
            React.createElement('option', { value: 'xhs-dark' }, '配色·深夜暗调'),
            React.createElement('option', { value: 'plain' }, '配色·简洁白底'),
            React.createElement('option', { value: 'forest' }, '配色·森林墨绿'),
            React.createElement('option', { value: 'sunset' }, '配色·落日暖橙'),
          ),
          React.createElement('select', { className: 'csr-input', value: layoutName, onChange: (e) => setLayoutName(e.target.value) },
            React.createElement('option', { value: 'classic' }, '版式·经典'),
            React.createElement('option', { value: 'magazine' }, '版式·杂志'),
            React.createElement('option', { value: 'poster' }, '版式·大字报'),
            React.createElement('option', { value: 'notebook' }, '版式·手账'),
          ),
        ),
        React.createElement('div', { className: 'csr-row' },
          React.createElement('input', { className: 'csr-input', value: footer, placeholder: '页脚标签', onChange: (e) => setFooter(e.target.value) }),
          bgImage ? React.createElement('button', { className: 'csr-mini', onClick: () => setBgImage('') }, '清除背景') : null,
        ),
        React.createElement('textarea', { className: 'csr-textarea', value: md, placeholder: '卡片正文 Markdown（H2 分节成卡）', onChange: (e) => setMd(e.target.value) }),
        React.createElement('div', { className: 'csr-label' }, '给 agent 的留言（可选）'),
        React.createElement('textarea', { className: 'csr-textarea', style: { minHeight: '48px' }, value: note, placeholder: '例如：第二张标题太长，代码块换浅色', onChange: (e) => setNote(e.target.value) }),
        React.createElement('div', { className: 'csr-row' },
          React.createElement('button', { className: 'csr-btn csr-save', disabled: draft.status === 'approved', onClick: save }, '💾 保存修改'),
          React.createElement('button', { className: 'csr-btn csr-approve', disabled: draft.status === 'approved', onClick: () => decide('approve') }, '✓ 批准发布'),
          React.createElement('button', { className: 'csr-btn csr-reject', disabled: draft.status === 'rejected', onClick: () => decide('reject') }, '✗ 打回'),
        ),
        busy ? React.createElement('div', { className: 'csr-hint' }, busy) : null,
        draft.status === 'approved' ? React.createElement('div', { className: 'csr-hint' }, '✅ 已批准发布。对 agent 说「继续」，它会用「发布」页的标题和正文发布。') : null,
        draft.status === 'rejected' ? React.createElement('div', { className: 'csr-hint' }, '已打回。改完点「保存修改」，或直接对 agent 说出意见。') : null,
        draft.status === 'draft' ? React.createElement('div', { className: 'csr-hint' }, '实时预览配色×版式；照片/背景图直接拖给 agent；发布文案在「发布」页，API Keys 在「设置」页。') : null,
        draft.status === 'edited' ? React.createElement('div', { className: 'csr-hint' }, '已保存修改，等待 agent 重新渲染正式卡片。') : null,
      )

      const publishTab = React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        React.createElement('div', { className: 'csr-label-row' },
          React.createElement('span', { className: 'csr-label' }, '发布文案 —— 图片之外的文字（独立）'),
          React.createElement('span', { className: 'csr-count' }, '标题 ' + pubTitle.length + '/20'),
        ),
        React.createElement('input', { className: 'csr-input', value: pubTitle, placeholder: '发布标题（≤20 字，可带 emoji）', onChange: (e) => setPubTitle(e.target.value) }),
        React.createElement('div', { className: 'csr-label-row' },
          React.createElement('span', { className: 'csr-label' }, '笔记正文（可带 #话题#）'),
          React.createElement('span', { className: 'csr-count' }, pubBody.length + '/1000'),
        ),
        React.createElement('textarea', { className: 'csr-textarea', style: { minHeight: '140px' }, value: pubBody, placeholder: '发布时附在图片下面的正文，和图片里的详细内容可以是两套话术', onChange: (e) => setPubBody(e.target.value) }),
        React.createElement('div', { className: 'csr-hint' }, '这里的文案在「审阅」页点批准后随草稿保存；批准发布后 agent 用这里的标题/正文发帖。'),
      )

      const settingsTab = React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        React.createElement('div', { className: 'csr-label-row' },
          React.createElement('span', { className: 'csr-label' }, 'API Keys（留空不修改）'),
          React.createElement('span', { className: 'csr-count' }, 'Gemini ' + (keyStatus.geminiSet ? '✓' : '—') + ' · dev.to ' + (keyStatus.devtoSet ? '✓' : '—')),
        ),
        React.createElement('input', { className: 'csr-input', type: 'password', value: geminiInput, placeholder: 'Gemini API Key（aistudio.google.com/apikey）', onChange: (e) => setGeminiInput(e.target.value) }),
        React.createElement('input', { className: 'csr-input', type: 'password', value: devtoInput, placeholder: 'dev.to API Key（dev.to/settings/extensions）', onChange: (e) => setDevtoInput(e.target.value) }),
        React.createElement('button', { className: 'csr-btn csr-save', onClick: saveKeys }, '💾 保存 Keys'),
        React.createElement('div', { className: 'csr-hint' }, 'Key 存于本机 ~/.dsh/content-studio-output/keys.json（0600），供 AI 生图与 dev.to 发布使用；界面不回显明文。'),
      )

      return React.createElement('div', { className: 'csr-panel' },
        React.createElement('div', { className: 'csr-header' },
          React.createElement('span', { className: 'csr-title' }, '🖼️ XHS 图文审阅'),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement('span', { className: 'csr-badge', style: { background: COLOR[draft.status] ?? '#666666' } }, badge),
            React.createElement('button', { className: 'csr-mini', onClick: () => setCollapsed((c) => !c) }, collapsed ? '展开' : '收起'),
          ),
        ),
        collapsed ? null : React.createElement('div', { className: 'csr-body' },
          tabBar,
          tab === 'review' ? reviewTab : null,
          tab === 'publish' ? publishTab : null,
          tab === 'settings' ? settingsTab : null,
        ),
        zoom ? React.createElement('div', { className: 'csr-preview', onClick: () => setZoom(null) },
          React.createElement('div', {
            className: 'csr-preview-box',
            style: { width: Math.round(zoom.dims[0] * 0.5), height: Math.round(zoom.dims[1] * 0.5) },
          },
            React.createElement('div', {
              className: 'csx ' + ('csx-' + (THEME_CLASS[zoom.styleName] ?? 'soft')) + ' ' + (LAYOUT_CLASS[zoom.layoutName] ?? '') + (zoom.bgImage ? ' csx-hasbg' : ''),
              style: Object.assign(
                { width: zoom.dims[0], height: zoom.dims[1], transform: 'scale(0.5)', transformOrigin: 'top left' },
                zoom.bgImage ? { backgroundImage: 'url(' + zoom.bgImage.replaceAll("'", '%27') + ')' } : {}
              ),
              dangerouslySetInnerHTML: { __html: zoom.html },
            })),
        ) : null,
      )
    }

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'content-review-panel', order: 60, label: 'XHS 图文审阅' },
      () => React.createElement(Panel),
    ))
  },
}

    exports.apply = plugin.apply
    exports.inject = plugin.inject
    return module.exports
  }
})
