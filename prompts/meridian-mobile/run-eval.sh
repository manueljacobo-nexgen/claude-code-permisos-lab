#!/usr/bin/env bash
# Runner de evals: corre un prompt version (system prompt) contra un caso eval real,
# usando el CLI de Claude Code en modo no interactivo como arnes del modelo bajo prueba.
#
# Uso: ./run-eval.sh <prompt-file> <eval-file> <run-label> [lista-de-tools-permitidas]
# Sin 4to argumento: el modelo NO tiene tools (chatbot puro, se bloquean explicitamente
# via --disallowedTools). Con 4to argumento (ej. "Bash"): le da esa tool real
# — usado en la eval post-fix de aritmetica.
#
# NOTA (bug real encontrado en revision): `--tools ""` NO desactiva las tools pese
# a que la ayuda del CLI dice que si (probado: el modelo igual invoco Bash con
# `--tools ""`). Se usa `--disallowedTools` en su lugar, que si bloquea de verdad
# (verificado con un caso de control que pide explicitamente usar Bash).
#
# Ejemplo:
#   ./run-eval.sh v0-prompt.md evals/control.md v0-run1
#   ./run-eval.sh v4-prompt.md evals/edge-aritmetica.md v4-run1 Bash
set -euo pipefail

PROMPT_FILE="$1"
EVAL_FILE="$2"
RUN_LABEL="$3"
TOOLS="${4:-}"  # vacio = sin tools (--disallowedTools con la lista de abajo)
NO_TOOLS_LIST="Bash,Edit,Write,Read,WebFetch,WebSearch"

if [ ! -f "$PROMPT_FILE" ]; then echo "no existe prompt: $PROMPT_FILE" >&2; exit 1; fi
if [ ! -f "$EVAL_FILE" ]; then echo "no existe eval: $EVAL_FILE" >&2; exit 1; fi

EVAL_NAME="$(basename "$EVAL_FILE" .md)"
OUT_DIR="results"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/${RUN_LABEL}_${EVAL_NAME}.txt"

# Extrae la seccion "## Contexto de cuenta" (si existe) y "## Turno del usuario"
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
  --output-format text \
  > "$OUT_FILE" 2>"${OUT_FILE}.stderr"

echo "$OUT_FILE"
