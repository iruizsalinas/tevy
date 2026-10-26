// A small syntax highlighter for the docs snippets: JavaScript (with JSX tags) and HTML. It splits
// code into tokens with a kind, which CodeBlock colors like a code editor's dark theme. It runs the
// same on the server and in the browser, so prerendered pages hydrate without a mismatch.

export type TokenKind = '' | 'comment' | 'string' | 'number' | 'control' | 'keyword' | 'function' | 'type' | 'constant' | 'variable' | 'tag' | 'attr' | 'punct';
export type Token = { text: string; kind: TokenKind };
export type Lang = 'js' | 'html';

// Control flow and modules are colored apart from declarations and literals, as editors do.
const CONTROL = new Set(['import', 'export', 'from', 'return', 'await', 'if', 'else', 'for', 'while', 'of', 'as', 'default', 'break', 'continue', 'throw', 'try', 'catch']);
const KEYWORDS = new Set(['const', 'let', 'var', 'function', 'new', 'class', 'true', 'false', 'null', 'undefined', 'this', 'typeof', 'async', 'in']);

const COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?\*\//y;
const QUOTED = /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/y;
const IDENT = /[A-Za-z_$][\w$]*/y;
const NUMBER = /(?:\d[\d_]*(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?/y;
const SPACE = /\s+/y;
const TAG_NAME = /[A-Za-z][\w.:-]*/y;
const ATTR_NAME = /[^\s=>/]+/y;

function match(re: RegExp, code: string, i: number): string | null {
  re.lastIndex = i;
  return re.exec(code)?.[0] ?? null;
}

type Push = (text: string, kind?: TokenKind) => void;

/** Splits code into tokens; neighbors of the same kind are merged. */
export function highlight(code: string, lang: Lang = 'js'): Token[] {
  const out: Token[] = [];
  const push: Push = (text, kind = '') => {
    if (!text) return;
    const last = out.at(-1);
    if (last && last.kind === kind) last.text += text;
    else out.push({ text, kind });
  };
  if (lang === 'html') html(code, push);
  else js(code, 0, code.length, push);
  return out;
}

/** Index just past the brace that closes the one opened before `i`, skipping strings. */
function closingBrace(code: string, i: number): number {
  let depth = 1;
  while (i < code.length) {
    const quoted = match(QUOTED, code, i);
    if (quoted) {
      i += quoted.length;
      continue;
    }
    const c = code[i++];
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return i;
}

function js(code: string, start: number, end: number, push: Push): void {
  let i = start;
  // The last character that was not whitespace, to tell a property from a variable and a JSX
  // tag from a less-than sign.
  let prev = '';
  let prevWord = '';
  while (i < end) {
    const space = match(SPACE, code, i);
    if (space) {
      push(space);
      i += space.length;
      continue;
    }
    const comment = match(COMMENT, code, i);
    if (comment) {
      push(comment, 'comment');
      i += comment.length;
      continue;
    }
    const quoted = match(QUOTED, code, i);
    if (quoted) {
      push(quoted, 'string');
      i += quoted.length;
      prev = quoted.at(-1)!;
      continue;
    }
    if (code[i] === '`') {
      i = template(code, i, end, push);
      prev = '`';
      continue;
    }
    if (code[i] === '<' && /[A-Za-z/]/.test(code[i + 1] ?? '') && ('(=,{?:'.includes(prev) || prevWord === 'return')) {
      i = jsxTag(code, i, end, push);
      prev = '>';
      continue;
    }
    const word = match(IDENT, code, i);
    if (word) {
      const call = /^\s*\(/.test(code.slice(i + word.length, i + word.length + 8));
      let kind: TokenKind = 'variable';
      if (prev === '.') kind = call ? 'function' : 'variable';
      else if (CONTROL.has(word)) kind = 'control';
      else if (KEYWORDS.has(word)) kind = 'keyword';
      else if (call) kind = /^[A-Z]/.test(word) ? 'type' : 'function';
      else if (/^[A-Z][A-Z\d_]+$/.test(word)) kind = 'constant';
      else if (/^[A-Z]/.test(word)) kind = 'type';
      push(word, kind);
      i += word.length;
      prev = 'a';
      prevWord = word;
      continue;
    }
    const number = match(NUMBER, code, i);
    if (number) {
      push(number, 'number');
      i += number.length;
      prev = '0';
      continue;
    }
    push(code[i]);
    prev = code[i++];
    prevWord = '';
  }
}

/** A template literal from its opening backtick; returns the index after the closing one. */
function template(code: string, i: number, end: number, push: Push): number {
  push('`', 'string');
  i++;
  while (i < end && code[i] !== '`') {
    if (code[i] === '\\') {
      push(code.slice(i, i + 2), 'string');
      i += 2;
    } else if (code.startsWith('${', i)) {
      const close = closingBrace(code, i + 2);
      push('${', 'keyword');
      js(code, i + 2, close - 1, push);
      push('}', 'keyword');
      i = close;
    } else {
      push(code[i++], 'string');
    }
  }
  if (i < end) push('`', 'string');
  return i + 1;
}

/** One JSX tag, with attributes whose values may be {expressions}; returns the index after it. */
function jsxTag(code: string, i: number, end: number, push: Push): number {
  const open = code[i + 1] === '/' ? '</' : '<';
  push(open, 'punct');
  i += open.length;
  const name = match(TAG_NAME, code, i) ?? '';
  push(name, /^[A-Z]/.test(name) ? 'type' : 'tag');
  i += name.length;
  while (i < end && code[i] !== '>') {
    if (code.startsWith('/>', i)) break;
    const space = match(SPACE, code, i);
    if (space) {
      push(space);
      i += space.length;
    } else if (code[i] === '{') {
      const close = closingBrace(code, i + 1);
      push('{', 'keyword');
      js(code, i + 1, close - 1, push);
      push('}', 'keyword');
      i = close;
    } else if (code[i] === '=') {
      push('=', 'punct');
      i++;
    } else {
      const value = match(QUOTED, code, i) ?? match(ATTR_NAME, code, i) ?? code[i];
      push(value, /^["']/.test(value) ? 'string' : 'attr');
      i += value.length;
    }
  }
  const close = code.startsWith('/>', i) ? '/>' : '>';
  push(close, 'punct');
  return i + close.length;
}

function html(code: string, push: Push): void {
  let i = 0;
  while (i < code.length) {
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i);
      const stop = end < 0 ? code.length : end + 3;
      push(code.slice(i, stop), 'comment');
      i = stop;
    } else if (code[i] === '<' && /[A-Za-z/]/.test(code[i + 1] ?? '')) {
      i = jsxTag(code, i, code.length, push);
    } else {
      push(code[i++]);
    }
  }
}
