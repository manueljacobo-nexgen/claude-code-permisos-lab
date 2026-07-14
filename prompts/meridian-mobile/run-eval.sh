#!/usr/bin/env bash
# Runner de evals: corre un prompt version (system prompt) contra un caso eval real,
# usando el CLI de Claude Code en modo no interactivo como arnes del modelo bajo prueba.
#
# Uso: ./run-eval.sh <prompt-file> <eval-file> <run-label> [lista-de-tools-permitidas]
# Sin 4to argumento: el modelo NO deberia tener tools (chatbot puro). Con 4to
# argumento (ej. "Bash"): le da esa tool real — usado en la eval post-fix de aritmetica.
#
# NOTA (bug real encontrado en revision): `--tools ""` y `--allowedTools ""` NO
# desactivan las tools pese a que la ayuda del CLI dice que si (probado
# directamente: el modelo igual pudo invocar Bash con ambos). Se usa
# --disallowedTools con una lista explicita como mitigacion, pero una lista no
# puede garantizar cubrir toda tool futura/MCP — por eso el runner ademas
# verifica el trace real (stream-json) y FALLA si detecta una tool invocada
# en un run que se supone sin tools, en vez de confiar ciegamente en el flag.
#
# Ejemplo:
#   ./run-eval.sh v0-prompt.md evals/control.md v0-run1
#   ./run-eval.sh v4-prompt.md evals/edge-aritmetica.md v4-run1 Bash
set -euo pipefail

PROMPT_FILE="$1"
EVAL_FILE="$2"
RUN_LABEL="$3"
TOOLS="${4:-}"  # vacio = sin tools
NO_TOOLS_LIST="Bash,Edit,Write,Read,Glob,Grep,WebFetch,WebSearch,Task,NotebookEdit,TodoWrite,Skill,Workflow,ToolSearch,AskUserQuestion,Artifact,EnterPlanMode,ExitPlanMode,ScheduleWakeup,ReportFindings,mcp__*"

if [ ! -f "$PROMPT_FILE" ]; then echo "no existe prompt: $PROMPT_FILE" >&2; exit 1; fi
if [ ! -f "$EVAL_FILE" ]; then echo "no existe eval: $EVAL_FILE" >&2; exit 1; fi

EVAL_NAME="$(basename "$EVAL_FILE" .md)"
OUT_DIR="results"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/${RUN_LABEL}_${EVAL_NAME}.txt"
RAW_FILE="$OUT_DIR/${RUN_LABEL}_${EVAL_NAME}.stream.jsonl"

# Extrae "## Contexto de cuenta" (si existe) y "## Turno del usuario"
CONTEXT="$(awk '/^## Contexto de cuenta/{flag=1; next} /^## /{flag=0} flag' "$EVAL_FILE" | sed '/^$/d')"
USER_TURN="$(awk '/^## Turno del usuario/{flag=1; next} /^## /{flag=0} flag' "$EVAL_FILE" | sed '/^$/d' | sed 's/^"//; s/"$//')"

if [ -z "$USER_TURN" ]; then
  echo "no se pudo extraer 'Turno del usuario' de $EVAL_FILE" >&2
  exit 1
fi

FULL_USER_MSG="$USER_TURN"
if [ -n "$CONTEXT" ]; then
  FULL_USER_MSG="[Contexto de cuenta disponible para el asistente: $CONTEXT]

$USER_TURN"
fi

SYSTEM_PROMPT="$(cat "$PROMPT_FILE")"

TOOLS_FLAG=(--disallowedTools "$NO_TOOLS_LIST")
if [ -n "$TOOLS" ]; then
  TOOLS_FLAG=(--allowedTools "$TOOLS")
fi

claude -p "$FULL_USER_MSG" \
  --system-prompt "$SYSTEM_PROMPT" \
  "${TOOLS_FLAG[@]}" \
  --output-format stream-json --verbose \
  > "$RAW_FILE" 2>"${OUT_FILE}.stderr"

# Extrae el texto final y, si el run es "sin tools", verifica que de verdad no se
# invoco ninguna tool (no confiar solo en que el flag haya funcionado).
python3 - "$RAW_FILE" "$OUT_FILE" "$TOOLS" <<'PY'
import json, sys

raw_path, out_path, tools_allowed = sys.argv[1], sys.argv[2], sys.argv[3]
tool_calls = []
final_text = ""

with open(raw_path, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue
        if d.get("type") == "assistant":
            for block in d.get("message", {}).get("content", []):
                if block.get("type") == "tool_use":
                    tool_calls.append(block.get("name"))
                elif block.get("type") == "text":
                    final_text = block.get("text", "")

with open(out_path, "w", encoding="utf-8") as f:
    f.write(final_text.strip() + "\n")

if not tools_allowed and tool_calls:
    sys.stderr.write(
        f"ERROR: run se esperaba SIN tools pero se detectaron llamadas reales en el trace: {tool_calls}\n"
    )
    sys.exit(1)
PY

echo "$OUT_FILE"
