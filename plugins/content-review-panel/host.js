// content-review-panel v11 — PANEL-ONLY host half.
//
// The content_review_* TOOLS and the durable draft entity now live in the
// static content-studio preset (lib/review.js, draft at
// ~/.dsh/content-studio-output/review/draft.json). This dynamic half only
// bridges the browser panel to that file, so the panel can be rebuilt after a
// process restart without losing draft data and without tool-name conflicts.
//
// NOTE: the draft path below is machine-local. Adjust it when moving machines.

const DRAFT_PATH = '/Users/haleychen/.dsh/content-studio-output/review/draft.json'

return {
  name: 'content-review-panel',
  apply(ctx) {
    const fs = ctx.get('fs')

    async function readDraft() {
      if (fs === undefined) return null
      try {
        const target = await fs.resolve(DRAFT_PATH)
        const text = await fs.readText(target)
        const parsed = JSON.parse(text)
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch (error) {
        return null
      }
    }

    async function writeDraft(draft) {
      if (fs === undefined) return
      const target = await fs.resolve(DRAFT_PATH)
      await fs.writeText(target, JSON.stringify(draft, null, 2))
    }

    harness.handle('get-draft', async (args) => {
      const d = await readDraft()
      if (d === null) return null
      if (args && args.revision === d.revision) {
        return { unchanged: true, revision: d.revision, status: d.status }
      }
      return d
    })

    harness.handle('save-draft', async (args) => {
      const d = await readDraft()
      if (d === null) return { ok: false, error: 'no draft' }
      if (typeof args.markdown === 'string') d.markdown = args.markdown
      if (args.cover && typeof args.cover === 'object') {
        d.cover = {
          title: typeof args.cover.title === 'string' ? args.cover.title : '',
          subtitle: typeof args.cover.subtitle === 'string' ? args.cover.subtitle : '',
          emoji: typeof args.cover.emoji === 'string' ? args.cover.emoji : '',
        }
      }
      if (typeof args.footer === 'string') d.footer = args.footer
      if (typeof args.style === 'string') d.style = args.style
      if (typeof args.layout === 'string') d.layout = args.layout
      if (typeof args.bgImage === 'string') d.bgImage = args.bgImage
      if (typeof args.publishTitle === 'string') d.publishTitle = args.publishTitle
      if (typeof args.publishBody === 'string') d.publishBody = args.publishBody
      if (typeof args.note === 'string') d.humanNote = args.note
      d.status = 'edited'
      d.revision += 1
      await writeDraft(d)
      return { ok: true, revision: d.revision, status: d.status }
    })

    harness.handle('decide', async (args) => {
      const d = await readDraft()
      if (d === null) return { ok: false, error: 'no draft' }
      const decision = args && args.decision
      if (decision !== 'approve' && decision !== 'reject') {
        return { ok: false, error: 'decision must be approve or reject' }
      }
      d.status = decision === 'approve' ? 'approved' : 'rejected'
      d.decidedAt = Date.now()
      if (decision === 'reject' && typeof args.note === 'string' && args.note.trim() !== '') {
        d.humanNote = args.note
      }
      d.revision += 1
      await writeDraft(d)
      return { ok: true, revision: d.revision, status: d.status }
    })
  },
}
