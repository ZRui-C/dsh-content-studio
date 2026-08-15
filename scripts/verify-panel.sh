#!/usr/bin/env bash
# dsh-content-studio 审阅面板四层验证门。
# 用法: DSH_DEPLOY=/path/to/dsh GUI_URL=http://127.0.0.1:3080 ./scripts/verify-panel.sh
# 每一层通过才会打印 PASS；任何一层失败都要在断言"面板可见"之前修复并重跑。
set -u

DSH_DEPLOY="${DSH_DEPLOY:-/Users/haleychen/dsh}"
GUI_URL="${GUI_URL:-http://127.0.0.1:3080}"
PROFILE="${PROFILE:-web}"
FAIL=0

ok()   { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAIL=1; }

# ── 层 1: profile 组合树里有我们的行（Host 工具与路由的载体） ──────────────
DUMP=$("$DSH_DEPLOY/node_modules/.bin/dsh" --profile "$PROFILE" --dump-config 2>/dev/null)
if echo "$DUMP" | grep -q 'tool-content-studio'; then
  ok "layer1: tool-content-studio row is in the composed $PROFILE profile"
else
  fail "layer1: tool-content-studio row missing from composed profile"
fi

# ── 层 2: boot 图里有 client bundle 条目（浏览器会加载面板代码） ────────────
BOOT=$(curl -s "$GUI_URL/")
if echo "$BOOT" | grep -q '"id":"dsh-content-studio"'; then
  REV=$(echo "$BOOT" | grep -o '"id":"dsh-content-studio","url":"[^"]*"' | grep -o 'rev=[0-9a-f]*' | head -1 | cut -d= -f2)
  ok "layer2: client entry in __DSH_BOOT__ (rev=$REV)"
else
  fail "layer2: client entry missing from __DSH_BOOT__ (was dsh.client in package.json exports ./package.json?)"
fi

# ── 层 3: bundle 路由真的能拉到代码 ─────────────────────────────────────────
if [ -n "${REV:-}" ]; then
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$GUI_URL/plugins/dsh-content-studio/client.js?rev=$REV")
  if [ "$CODE" = "200" ]; then
    ok "layer3: /plugins/dsh-content-studio/client.js serves 200"
  else
    fail "layer3: bundle route returned HTTP $CODE"
  fi
fi

# ── 层 4: 面板 API 路由应答（POST 必须返回 JSON 而非 SPA 兜底 HTML） ────────
RESP=$(curl -s -X POST -H 'content-type: application/json' -d '{}' "$GUI_URL/content-studio-api/get-draft")
if echo "$RESP" | grep -q '"ok":true'; then
  STATUS=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status'))" 2>/dev/null)
  ok "layer4: /content-studio-api/get-draft answers JSON (draft status: ${STATUS:-?})"
else
  fail "layer4: /content-studio-api/get-draft did not answer with JSON (routes not registered — webServer race?)"
fi

# ── 层 5: 草稿文件可读 ─────────────────────────────────────────────────────
DRAFT="${DSH_HOME:-$HOME/.dsh}/content-studio-output/review/draft.json"
if [ -r "$DRAFT" ]; then
  CARDS=$(python3 -c "import json; print(len(json.load(open('$DRAFT')).get('cards', [])))" 2>/dev/null)
  ok "layer5: draft.json readable (cards: ${CARDS:-?})"
else
  fail "layer5: draft.json missing or unreadable at $DRAFT"
fi

echo
if [ "$FAIL" = "0" ]; then
  echo "ALL LAYERS PASS — 面板声明成立。浏览器若仍不可见，只需刷新页面标签（Cmd+R）。"
  exit 0
else
  echo "SOME LAYERS FAILED — 修复后重启 DSH（boot 图与路由在进程内缓存，无重扫路径），再重跑本脚本。"
  exit 1
fi
