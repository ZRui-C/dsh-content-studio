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

    function cardImg(id, rev) {
      return "/content-studio-api/card-image/" + encodeURIComponent(String(id)) + "?rev=" + encodeURIComponent(String(rev ?? 0))
    }

    const CSS = `
.csr-root{position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column-reverse;align-items:flex-end;gap:10px;z-index:2147483000;pointer-events:none;max-height:94vh}
.csr-root *{box-sizing:border-box}
.csr-win{width:384px;max-width:calc(100vw - 32px);background:var(--dsw-alias-bg-layer-1,#ffffff);color:var(--dsw-alias-label-primary,#1f2328);border:1px solid var(--dsw-alias-border-l2,#d8d8e2);border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.28);overflow:hidden;pointer-events:auto;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI',sans-serif;animation:csr-in .18s ease}
@keyframes csr-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.csr-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 14px;background:var(--dsw-alias-bg-layer-2,#f4f4f7);border-bottom:1px solid var(--dsw-alias-border-l1,#e6e6ee);user-select:none}
.csr-title{font-size:13px;font-weight:700}
.csr-close{background:transparent;border:none;color:var(--dsw-alias-label-secondary,#5f6b76);font-size:15px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px}
.csr-close:hover{background:var(--dsw-alias-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,#1f2328)}
.csr-badge{font-size:11px;font-weight:700;color:#fff;padding:3px 10px;border-radius:999px;flex-shrink:0}
.csr-body{display:flex;flex-direction:column;gap:9px;padding:12px;overflow-y:auto;max-height:60vh}
.csr-thumbs{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.csr-thumb{width:86px;min-width:86px;height:115px;border-radius:8px;border:2px solid var(--dsw-alias-border-l2,#d0d0dc);overflow:hidden;cursor:zoom-in;flex-shrink:0;background:var(--dsw-alias-bg-layer-2,#f4f4f7);position:relative}
.csr-thumb:hover{border-color:#ff2e4d}
.csr-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.csr-thumb-tag{position:absolute;left:0;bottom:0;right:0;font-size:9px;padding:2px 4px;background:rgba(0,0,0,.55);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.csr-row{display:flex;gap:6px;align-items:center}
.csr-label-row{display:flex;justify-content:space-between;align-items:center;margin:1px 0}
.csr-label{font-size:11px;color:var(--dsw-alias-label-secondary,#6a737d)}
.csr-count{font-size:10px;color:var(--dsw-alias-label-secondary,#8a94a0)}
.csr-input{flex:1;min-width:0;padding:7px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,#c9c9d6);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1f2328);font-size:12px;font-family:inherit}
.csr-input:focus{outline:none;border-color:#3a5bff}
.csr-textarea{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,#c9c9d6);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1f2328);font-size:12px;font-family:inherit;resize:vertical;min-height:96px;line-height:1.6}
.csr-btn{flex:1;padding:7px 10px;border-radius:8px;border:1px solid transparent;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
.csr-btn:disabled{opacity:.45;cursor:default}
.csr-save{background:var(--dsw-alias-bg-layer-2,#eef0f4);color:var(--dsw-alias-label-primary,#1f2328);border-color:var(--dsw-alias-border-l2,#c9c9d6)}
.csr-approve{background:#18a058;color:#fff}
.csr-reject{background:#d03050;color:#fff}
.csr-mini{background:transparent;border:1px solid var(--dsw-alias-border-l2,#c9c9d6);color:var(--dsw-alias-label-secondary,#5f6b76);border-radius:8px;padding:4px 8px;font-size:11px;cursor:pointer;font-family:inherit}
.csr-hint{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary,#6a737d);background:var(--dsw-alias-bg-layer-2,#f6f6fa);border-radius:8px;padding:8px 10px}
.csr-hint-ok{color:#18a058;border:1px solid rgba(24,160,88,.4)}
.csr-hub{pointer-events:auto;display:flex;align-items:center;gap:8px;background:var(--dsw-alias-bg-layer-1,#ffffff);border:1px solid var(--dsw-alias-border-l2,#d8d8e2);border-radius:999px;padding:7px 14px;box-shadow:0 8px 24px rgba(0,0,0,.22);cursor:pointer;user-select:none;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI',sans-serif}
.csr-hub:hover{border-color:#3a5bff}
.csr-hub-text{font-size:12px;font-weight:700;color:var(--dsw-alias-label-primary,#1f2328)}
.csr-hub-sub{font-size:10px;color:var(--dsw-alias-label-secondary,#8a94a0)}
.csr-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.csr-preview{position:fixed;inset:0;background:rgba(10,12,18,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:2147483100;pointer-events:auto}
.csr-preview img{max-width:86vw;max-height:82vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.6);cursor:zoom-out}
.csr-preview-bar{display:flex;align-items:center;gap:10px}
.csr-pv-btn{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:999px;padding:6px 14px;font-size:13px;cursor:pointer}
.csr-pv-btn:hover{background:rgba(255,255,255,.22)}
.csr-pv-label{color:#fff;font-size:13px;min-width:120px;text-align:center}
.csr-keyrow{display:flex;flex-direction:column;gap:4px}
.csr-kdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle}
.csr-divider{border:none;border-top:1px dashed var(--dsw-alias-border-l2,#d0d0dc);margin:2px 0}
`

    // module-level poll memory: survives re-renders, resets only on page reload
    let lastStatus = null
    let lastRevision = 0
    let ctxRef = null

    const BADGE = { draft: '待审阅', edited: '已修改', approved: '已批准', rejected: '已打回', none: '无草稿' }
    const COLOR = { draft: '#d89a1f', edited: '#3a5bff', approved: '#18a058', rejected: '#d03050', none: '#8a94a0' }

    function Hub() {
      const [draft, setDraft] = React.useState(null)
      const [hiddenReview, setHiddenReview] = React.useState(true)
      const [hiddenPublish, setHiddenPublish] = React.useState(true)
      const [showSettings, setShowSettings] = React.useState(false)
      const [zoom, setZoom] = React.useState(null)
      const [busy, setBusy] = React.useState('')
      const [decidedMsg, setDecidedMsg] = React.useState('')

      const [md, setMd] = React.useState('')
      const [coverEmoji, setCoverEmoji] = React.useState('')
      const [coverTitle, setCoverTitle] = React.useState('')
      const [coverSub, setCoverSub] = React.useState('')
      const [footer, setFooter] = React.useState('')
      const [styleName, setStyleName] = React.useState('xhs-soft')
      const [layoutName, setLayoutName] = React.useState('classic')
      const [bgImage, setBgImage] = React.useState('')
      const [pubTitle, setPubTitle] = React.useState('')
      const [pubBody, setPubBody] = React.useState('')
      const [note, setNote] = React.useState('')
      const [keyStatus, setKeyStatus] = React.useState({ geminiSet: false, devtoSet: false, mediumSet: false })
      const [geminiInput, setGeminiInput] = React.useState('')
      const [devtoInput, setDevtoInput] = React.useState('')
      const [mediumInput, setMediumInput] = React.useState('')

      const status = draft ? draft.status : 'none'
      const cards = (draft && Array.isArray(draft.cards)) ? draft.cards : []
      const rev = draft ? (draft.revision ?? 0) : 0
      const reviewOpen = draft !== null && !hiddenReview && (status === 'draft' || status === 'edited' || status === 'rejected')
      const publishOpen = draft !== null && !hiddenPublish && (status === 'draft' || status === 'edited' || status === 'rejected')

      React.useEffect(() => {
        let timer = null
        let cancelled = false
        async function tick() {
          let d = null
          try { d = await api('get-draft', { revision: lastRevision }) } catch (error) { /* routes not up yet */ }
          if (cancelled) return
          if (d && d.revision === lastRevision && lastStatus === d.status) { return }
          const next = d ? d.status : 'none'
          if (next !== lastStatus) {
            if (next === 'draft' || next === 'edited') {
              // 新一轮审阅开始 → 两个窗口自动弹出
              setHiddenReview(false)
              setHiddenPublish(false)
              setDecidedMsg('')
            }
            if (next === 'none') {
              setHiddenReview(true)
              setHiddenPublish(true)
              setZoom(null)
            }
            lastStatus = next
          }
          if (d) {
            lastRevision = d.revision ?? 0
            setDraft((prev) => {
              const sameRevision = prev && prev.revision === d.revision
              if (sameRevision) return Object.assign({}, prev, { status: d.status })
              return d
            })
            setMd((prev) => (prev === '' ? (d.markdown ?? '') : prev))
            setCoverEmoji((prev) => (prev === '' ? (d.cover && d.cover.emoji ? d.cover.emoji : '') : prev))
            setCoverTitle((prev) => (prev === '' ? (d.cover && d.cover.title ? d.cover.title : '') : prev))
            setCoverSub((prev) => (prev === '' ? (d.cover && d.cover.subtitle ? d.cover.subtitle : '') : prev))
            setFooter((prev) => (prev === '' ? (d.footer ?? '') : prev))
            if (d.style) setStyleName(d.style)
            if (d.layout) setLayoutName(d.layout)
            setBgImage((prev) => (prev === '' ? (d.bgImage ?? '') : prev))
            setPubTitle((prev) => (prev === '' ? (d.publishTitle ?? '') : prev))
            setPubBody((prev) => (prev === '' ? (d.publishBody ?? '') : prev))
          } else {
            setDraft(null)
          }
          try {
            const k = await api('get-keys', {})
            if (k) setKeyStatus({ geminiSet: Boolean(k.geminiSet), devtoSet: Boolean(k.devtoSet), mediumSet: Boolean(k.mediumSet) })
          } catch (error) { /* keep last */ }
        }
        tick()
        timer = ctxRef.interval(tick, 2000)
        return () => { cancelled = true; if (timer) timer() }
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
          setBusy('已保存 → agent 正在重新渲染正式卡片，稍候图像会自动更新')
        } catch (error) {
          setBusy('保存失败')
        }
      }

      const saveKeys = async () => {
        setBusy('保存 Keys…')
        try {
          const r = await api('save-keys', { geminiApiKey: geminiInput, devtoApiKey: devtoInput, mediumToken: mediumInput })
          if (r && (r.geminiSet !== undefined)) {
            setKeyStatus({ geminiSet: Boolean(r.geminiSet), devtoSet: Boolean(r.devtoSet), mediumSet: Boolean(r.mediumSet) })
            setGeminiInput(''); setDevtoInput(''); setMediumInput('')
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
          setDecidedMsg(decision === 'approve' ? '✅ 已批准，agent 开始发布' : '已打回，agent 会按意见修改')
          setBusy('')
          // 自动关闭：留 1.4s 反馈后收起两个窗口；新一轮审阅时自动再弹出
          window.setTimeout(() => {
            setHiddenReview(true)
            setHiddenPublish(true)
            setDecidedMsg('')
          }, 1400)
        } catch (error) {
          setBusy('提交失败')
        }
      }

      const zoomOpen = (index) => setZoom({ index: index })
      const zoomMove = (delta) => setZoom((z) => {
        if (z === null || cards.length === 0) return z
        return { index: (z.index + delta + cards.length) % cards.length }
      })

      const winHead = (title, onClose, badgeColor, badgeText) => React.createElement('div', { className: 'csr-head' },
        React.createElement('span', { className: 'csr-title' }, title),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          badgeText ? React.createElement('span', { className: 'csr-badge', style: { background: badgeColor } }, badgeText) : null,
          React.createElement('button', { className: 'csr-close', title: '关闭', onClick: onClose }, '✕')))

      const keyDot = (set) => React.createElement('span', { className: 'csr-kdot', style: { background: set ? '#18a058' : '#d03050' } })

      // ── 审阅窗口：真实渲染图 + 编辑 + 决策 ─────────────────────────────
      const reviewWin = (reviewOpen && draft) ? React.createElement('div', { className: 'csr-win' },
        winHead('图文审阅', () => setHiddenReview(true), COLOR[status] ?? '#8a94a0', BADGE[status] ?? status),
        React.createElement('div', { className: 'csr-body' },
          decidedMsg ? React.createElement('div', { className: 'csr-hint csr-hint-ok' }, decidedMsg) : null,
          status === 'approved'
            ? React.createElement('div', { className: 'csr-hint csr-hint-ok' }, '✅ 已批准发布。窗口已自动关闭；对 agent 说「继续」即可发布。点右下角按钮可重新打开。')
            : status === 'rejected'
              ? React.createElement('div', { className: 'csr-hint' }, '已打回。改完点「保存修改」，agent 会重新渲染；或直接对 agent 说出意见。')
              : null,
          React.createElement('div', { className: 'csr-label-row' },
            React.createElement('span', { className: 'csr-label' }, '正式卡片（实时，重新渲染后自动更新）· ' + cards.length + ' 张'),
            React.createElement('span', { className: 'csr-count' }, '点缩略图看大图')),
          cards.length > 0
            ? React.createElement('div', { className: 'csr-thumbs' },
                cards.map((c, i) => {
                  const label = (c.kind === 'cover' ? '封面 ' : '') + (c.title || ('卡片 ' + (i + 1)))
                  return React.createElement('div', {
                    key: c.id + '-' + rev,
                    className: 'csr-thumb',
                    title: c.title || ('卡片 ' + (i + 1)),
                    onClick: () => zoomOpen(i),
                  },
                    React.createElement('img', { src: cardImg(c.id, rev), alt: c.title || ('卡片 ' + (i + 1)) }),
                    React.createElement('div', { className: 'csr-thumb-tag' }, label))
                }))
            : null,
          React.createElement('hr', { className: 'csr-divider' }),
          React.createElement('div', { className: 'csr-row' },
            React.createElement('input', { className: 'csr-input', style: { flex: '0 0 48px' }, value: coverEmoji, placeholder: '🎬', onChange: (e) => setCoverEmoji(e.target.value) }),
            React.createElement('input', { className: 'csr-input', value: coverTitle, placeholder: '封面标题', onChange: (e) => setCoverTitle(e.target.value) }),
            React.createElement('input', { className: 'csr-input', value: coverSub, placeholder: '封面副标题', onChange: (e) => setCoverSub(e.target.value) })),
          React.createElement('div', { className: 'csr-row' },
            React.createElement('select', { className: 'csr-input', value: styleName, onChange: (e) => setStyleName(e.target.value) },
              React.createElement('option', { value: 'xhs-soft' }, '配色·奶油暖调'),
              React.createElement('option', { value: 'xhs-dark' }, '配色·深夜暗调'),
              React.createElement('option', { value: 'plain' }, '配色·简洁白底'),
              React.createElement('option', { value: 'forest' }, '配色·森林墨绿'),
              React.createElement('option', { value: 'sunset' }, '配色·落日暖橙')),
            React.createElement('select', { className: 'csr-input', value: layoutName, onChange: (e) => setLayoutName(e.target.value) },
              React.createElement('option', { value: 'classic' }, '版式·经典'),
              React.createElement('option', { value: 'magazine' }, '版式·杂志'),
              React.createElement('option', { value: 'poster' }, '版式·大字报'),
              React.createElement('option', { value: 'notebook' }, '版式·手账'))),
          React.createElement('div', { className: 'csr-row' },
            React.createElement('input', { className: 'csr-input', value: footer, placeholder: '页脚标签（可选）', onChange: (e) => setFooter(e.target.value) }),
            bgImage ? React.createElement('button', { className: 'csr-mini', onClick: () => setBgImage('') }, '清除背景') : null),
          React.createElement('textarea', { className: 'csr-textarea', style: { minHeight: '110px' }, value: md, placeholder: '卡片正文 Markdown（H2 分节成卡；照片用 ![alt](路径) 拖给 agent）', onChange: (e) => setMd(e.target.value) }),
          React.createElement('div', { className: 'csr-label' }, '给 agent 的留言（可选）'),
          React.createElement('textarea', { className: 'csr-textarea', style: { minHeight: '44px' }, value: note, placeholder: '例如：第二张标题太长，代码块换浅色', onChange: (e) => setNote(e.target.value) }),
          React.createElement('div', { className: 'csr-row' },
            React.createElement('button', { className: 'csr-btn csr-save', disabled: status === 'approved', onClick: save }, '💾 保存修改'),
            React.createElement('button', { className: 'csr-btn csr-approve', disabled: status === 'approved', onClick: () => decide('approve') }, '✓ 批准发布'),
            React.createElement('button', { className: 'csr-btn csr-reject', disabled: status === 'rejected', onClick: () => decide('reject') }, '✗ 打回')),
          busy ? React.createElement('div', { className: 'csr-hint' }, busy) : null))
        : null

      // ── 发布窗口：独立于图片的文案 ─────────────────────────────────────
      const publishWin = (publishOpen && draft) ? React.createElement('div', { className: 'csr-win' },
        winHead('发布文案', () => setHiddenPublish(true), '#7a5af5', '独立于图片'),
        React.createElement('div', { className: 'csr-body' },
          React.createElement('div', { className: 'csr-label-row' },
            React.createElement('span', { className: 'csr-label' }, '小红书标题（发布时附在图片下方，与卡片内文字无关）'),
            React.createElement('span', { className: 'csr-count' }, '标题 ' + pubTitle.length + '/20')),
          React.createElement('input', { className: 'csr-input', value: pubTitle, placeholder: '发布标题（≤20 字，可带 emoji）', onChange: (e) => setPubTitle(e.target.value) }),
          React.createElement('div', { className: 'csr-label-row' },
            React.createElement('span', { className: 'csr-label' }, '笔记正文（可带 #话题#）'),
            React.createElement('span', { className: 'csr-count' }, pubBody.length + '/1000')),
          React.createElement('textarea', { className: 'csr-textarea', style: { minHeight: '110px' }, value: pubBody, placeholder: '发布正文 —— 和图片里的详细内容可以是两套话术', onChange: (e) => setPubBody(e.target.value) }),
          React.createElement('div', { className: 'csr-hint' }, '文案随「保存修改」或「批准发布」保存；发布矩阵：小红书 / dev.to / Medium / 掘金（可选）。批准后由 agent 分发。')))
        : null

      // ── 设置窗口：API Keys + 小红书登录 ────────────────────────────────
      const settingsWin = showSettings ? React.createElement('div', { className: 'csr-win' },
        winHead('设置 · Keys 与登录', () => setShowSettings(false), '#7a5af5', ''),
        React.createElement('div', { className: 'csr-body' },
          React.createElement('div', { className: 'csr-label-row' },
            React.createElement('span', { className: 'csr-label' }, '已配置'),
            React.createElement('span', { className: 'csr-label' },
              'Gemini ', keyDot(keyStatus.geminiSet), ' dev.to ', keyDot(keyStatus.devtoSet), ' Medium ', keyDot(keyStatus.mediumSet))),
          React.createElement('div', { className: 'csr-keyrow' },
            React.createElement('input', { className: 'csr-input', type: 'password', value: geminiInput, placeholder: 'Gemini API Key（Nano Banana 文生图）', onChange: (e) => setGeminiInput(e.target.value) })),
          React.createElement('div', { className: 'csr-keyrow' },
            React.createElement('input', { className: 'csr-input', type: 'password', value: devtoInput, placeholder: 'dev.to API Key', onChange: (e) => setDevtoInput(e.target.value) })),
          React.createElement('div', { className: 'csr-keyrow' },
            React.createElement('input', { className: 'csr-input', type: 'password', value: mediumInput, placeholder: 'Medium Integration Token', onChange: (e) => setMediumInput(e.target.value) })),
          React.createElement('button', { className: 'csr-btn csr-approve', onClick: saveKeys }, '💾 保存 Keys'),
          React.createElement('hr', { className: 'csr-divider' }),
          React.createElement('div', { className: 'csr-hint' }, '小红书登录：对 agent 说「登录小红书」，它调用 xhs_auth_login 后，本机会自动弹出 Chrome 窗口显示二维码（已关闭无头模式），扫码后 agent 即可发布。'),
          busy ? React.createElement('div', { className: 'csr-hint' }, busy) : null))
        : null

      // ── 大图预览 ──────────────────────────────────────────────────────
      const zoomWin = (zoom !== null && cards[zoom.index]) ? React.createElement('div', { className: 'csr-preview', onClick: () => setZoom(null) },
        React.createElement('div', { className: 'csr-preview-bar' },
          React.createElement('button', { className: 'csr-pv-btn', onClick: (e) => { e.stopPropagation(); zoomMove(-1) } }, '←'),
          React.createElement('span', { className: 'csr-pv-label' }, (zoom.index + 1) + ' / ' + cards.length),
          React.createElement('button', { className: 'csr-pv-btn', onClick: (e) => { e.stopPropagation(); zoomMove(1) } }, '→'),
          React.createElement('button', { className: 'csr-pv-btn', onClick: (e) => { e.stopPropagation(); setZoom(null) } }, '✕ 关闭')),
        React.createElement('img', {
          src: cardImg(cards[zoom.index].id, rev),
          alt: cards[zoom.index].title || '',
          onClick: (e) => e.stopPropagation(),
        })) : null

      // ── 总开关：右下角常驻 ─────────────────────────────────────────────
      const hub = React.createElement('div', {
        className: 'csr-hub',
        title: '内容工作室：点击打开/收起设置；审阅窗口按需自动弹出',
        onClick: () => {
          setShowSettings((v) => !v)
          if (draft !== null && (status === 'draft' || status === 'edited' || status === 'rejected' || status === 'approved')) {
            setHiddenReview((v) => !v)
            setHiddenPublish((v) => !v)
          }
        },
      },
        React.createElement('span', { className: 'csr-dot', style: { background: COLOR[status] ?? '#8a94a0' } }),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', lineHeight: 1.3 } },
          React.createElement('span', { className: 'csr-hub-text' }, '内容工作室'),
          React.createElement('span', { className: 'csr-hub-sub' }, BADGE[status] ?? status)))

      return React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'csr-root' },
          zoomWin,
          reviewWin,
          publishWin,
          settingsWin,
          hub))
    }

    var plugin = {
      name: 'content-review-panel',
      inject: ['timer'],
      apply(ctx) {
        ctxRef = ctx
        const slots = ctx.get('slots')
        if (slots === undefined) return
        injectCss(CSS)
        slots.inject('shell.overlay', () => slots.register(
          { name: 'shell.overlay', id: 'content-review-panel', order: 60, label: 'XHS 内容工作室' },
          () => React.createElement(Hub),
        ))
      },
    }

    exports.apply = plugin.apply
    exports.inject = plugin.inject
    return module.exports
  }
})
