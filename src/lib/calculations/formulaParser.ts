/**
 * Formula parser and evaluator for admin-defined formulas.
 *
 * Syntax:
 *   - Numbers: 32, 0.5, 995
 *   - Parameters: referenced by label (e.g. "Кол-во дверей")
 *   - Operators: + - * / ( ) <= >= < > = ;
 *   - Functions: ЕСЛИ(cond; then; else), ОКРУГЛВВЕРХ(num; digits),
 *     ОКРУГЛВНИЗ(num; digits), ОКРУГЛ(num; digits),
 *     МАКС(a; b), МИН(a; b), ЦЕЛ(num), ABS(num)
 *
 * Example: ЕСЛИ((Ширина двери - 32) <= 995; 1; 2) * Кол-во дверей
 */

// ─── Tokenizer ──────────────────────────────────────

type TokenType = "number" | "op" | "paren" | "semi" | "func" | "param";

interface Token {
  type: TokenType;
  value: string;
  num?: number;
}

const FUNCTIONS = new Set([
  "ЕСЛИ", "ОКРУГЛВВЕРХ", "ОКРУГЛВНИЗ", "ОКРУГЛ",
  "МАКС", "МИН", "ЦЕЛ", "ABS",
]);

const OP_CHARS = new Set(["+", "-", "*", "/", "<", ">", "="]);

function tokenize(formula: string, paramNames: string[]): Token[] {
  const tokens: Token[] = [];
  // Sort param names by length descending so longer matches first
  const sortedParams = [...paramNames].sort((a, b) => b.length - a.length);
  let i = 0;
  const s = formula.trim();

  while (i < s.length) {
    // Skip whitespace
    if (s[i] === " " || s[i] === "\t" || s[i] === "\n") { i++; continue; }

    // Semicolon
    if (s[i] === ";") { tokens.push({ type: "semi", value: ";" }); i++; continue; }

    // Parentheses
    if (s[i] === "(" || s[i] === ")") { tokens.push({ type: "paren", value: s[i] }); i++; continue; }

    // Multi-char operators: <=, >=
    if (i + 1 < s.length && (s.slice(i, i + 2) === "<=" || s.slice(i, i + 2) === ">=")) {
      tokens.push({ type: "op", value: s.slice(i, i + 2) }); i += 2; continue;
    }

    // Single-char operators
    if (OP_CHARS.has(s[i])) {
      tokens.push({ type: "op", value: s[i] }); i++; continue;
    }

    // Number
    if (/[0-9.]/.test(s[i])) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i]; i++; }
      tokens.push({ type: "number", value: num, num: parseFloat(num) }); continue;
    }

    // Try function names
    let matched = false;
    for (const fn of FUNCTIONS) {
      if (s.slice(i, i + fn.length) === fn) {
        tokens.push({ type: "func", value: fn });
        i += fn.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Try parameter names
    for (const p of sortedParams) {
      if (s.slice(i, i + p.length) === p) {
        tokens.push({ type: "param", value: p });
        i += p.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Skip unknown character
    i++;
  }

  return tokens;
}

// ─── Parser (recursive descent) ─────────────────────

class Parser {
  private tokens: Token[];
  private pos: number;
  private vars: Record<string, number>;

  constructor(tokens: Token[], vars: Record<string, number>) {
    this.tokens = tokens;
    this.pos = 0;
    this.vars = vars;
  }

  private peek(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType, value?: string): Token {
    const t = this.consume();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`Expected ${type}${value ? ` '${value}'` : ""}, got ${t?.value ?? "EOF"}`);
    }
    return t;
  }

  parse(): number {
    const result = this.expr();
    return result;
  }

  // expr: comparison ((; comparison)* for ЕСЛИ args, or standalone)
  private expr(): number {
    return this.comparison();
  }

  // comparison: addition ((<= | >= | < | > | =) addition)?
  private comparison(): number {
    let left = this.addition();
    const t = this.peek();
    if (t && t.type === "op" && ["<=", ">=", "<", ">", "="].includes(t.value)) {
      this.consume();
      const right = this.addition();
      switch (t.value) {
        case "<=": return left <= right ? 1 : 0;
        case ">=": return left >= right ? 1 : 0;
        case "<": return left < right ? 1 : 0;
        case ">": return left > right ? 1 : 0;
        case "=": return left === right ? 1 : 0;
      }
    }
    return left;
  }

  // addition: multiplication ((+ | -) multiplication)*
  private addition(): number {
    let left = this.multiplication();
    while (true) {
      const t = this.peek();
      if (t && t.type === "op" && (t.value === "+" || t.value === "-")) {
        this.consume();
        const right = this.multiplication();
        left = t.value === "+" ? left + right : left - right;
      } else break;
    }
    return left;
  }

  // multiplication: unary ((* | /) unary)*
  private multiplication(): number {
    let left = this.unary();
    while (true) {
      const t = this.peek();
      if (t && t.type === "op" && (t.value === "*" || t.value === "/")) {
        this.consume();
        const right = this.unary();
        left = t.value === "*" ? left * right : (right !== 0 ? left / right : 0);
      } else break;
    }
    return left;
  }

  // unary: -? primary
  private unary(): number {
    const t = this.peek();
    if (t && t.type === "op" && t.value === "-") {
      this.consume();
      return -this.primary();
    }
    return this.primary();
  }

  // primary: number | param | func(...) | (expr)
  private primary(): number {
    const t = this.peek();
    if (!t) throw new Error("Unexpected end of formula");

    // Number
    if (t.type === "number") {
      this.consume();
      return t.num ?? 0;
    }

    // Parameter
    if (t.type === "param") {
      this.consume();
      return this.vars[t.value] ?? 0;
    }

    // Function
    if (t.type === "func") {
      return this.parseFunction();
    }

    // Parenthesized expression
    if (t.type === "paren" && t.value === "(") {
      this.consume();
      const val = this.expr();
      this.expect("paren", ")");
      return val;
    }

    throw new Error(`Unexpected token: ${t.value}`);
  }

  // Parse semicolon-separated args inside parentheses
  private parseArgs(): number[] {
    this.expect("paren", "(");
    const args: number[] = [];
    args.push(this.expr());
    while (this.peek()?.type === "semi") {
      this.consume();
      args.push(this.expr());
    }
    this.expect("paren", ")");
    return args;
  }

  private parseFunction(): number {
    const fn = this.consume();
    const args = this.parseArgs();

    switch (fn.value) {
      case "ЕСЛИ": {
        // ЕСЛИ(condition; valueIfTrue; valueIfFalse)
        const cond = args[0] ?? 0;
        const ifTrue = args[1] ?? 0;
        const ifFalse = args[2] ?? 0;
        return cond !== 0 ? ifTrue : ifFalse;
      }
      case "ОКРУГЛВВЕРХ": {
        const num = args[0] ?? 0;
        const digits = args[1] ?? 0;
        const factor = Math.pow(10, digits);
        return Math.ceil(num * factor) / factor;
      }
      case "ОКРУГЛВНИЗ": {
        const num = args[0] ?? 0;
        const digits = args[1] ?? 0;
        const factor = Math.pow(10, digits);
        return Math.floor(num * factor) / factor;
      }
      case "ОКРУГЛ": {
        const num = args[0] ?? 0;
        const digits = args[1] ?? 0;
        const factor = Math.pow(10, digits);
        return Math.round(num * factor) / factor;
      }
      case "МАКС": return Math.max(...args);
      case "МИН": return Math.min(...args);
      case "ЦЕЛ": return Math.trunc(args[0] ?? 0);
      case "ABS": return Math.abs(args[0] ?? 0);
      default: return 0;
    }
  }
}

// ─── Public API ─────────────────────────────────────

/**
 * Evaluate a formula string with given variable values.
 *
 * @param formula - Formula string, e.g. "ЕСЛИ((Ширина двери - 32) <= 995; 1; 2) * Кол-во дверей"
 * @param vars - Map of parameter labels to their numeric values, e.g. { "Ширина двери": 800, "Кол-во дверей": 3 }
 * @returns Computed numeric result
 */
export function evaluateFormula(formula: string, vars: Record<string, number>): number {
  if (!formula || !formula.trim()) return 0;

  // Strip leading = (Excel-style)
  let clean = formula.trim();
  if (clean.startsWith("=")) clean = clean.slice(1).trim();

  try {
    const paramNames = Object.keys(vars);
    const tokens = tokenize(clean, paramNames);
    if (tokens.length === 0) return 0;
    const parser = new Parser(tokens, vars);
    return parser.parse();
  } catch (e) {
    console.warn(`Formula evaluation error: "${formula}"`, e);
    return 0;
  }
}
