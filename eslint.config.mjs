import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
 {ignores:['dist/**','node_modules/**','public/**','artifacts/**']},
 {files:['src/**/*.ts','*.ts'],extends:[js.configs.recommended,...ts.configs.recommended],languageOptions:{globals:{window:'readonly',document:'readonly',location:'readonly',localStorage:'readonly',performance:'readonly',requestAnimationFrame:'readonly',setTimeout:'readonly',clearTimeout:'readonly',console:'readonly',fetch:'readonly',URLSearchParams:'readonly',ResizeObserver:'readonly',devicePixelRatio:'readonly',AudioContext:'readonly',HTMLElement:'readonly',HTMLButtonElement:'readonly',HTMLInputElement:'readonly',HTMLSelectElement:'readonly',structuredClone:'readonly',PointerEvent:'readonly'}},rules:{'@typescript-eslint/no-explicit-any':'error','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}},
 {files:['scripts/**/*.mjs'],...js.configs.recommended,languageOptions:{globals:{console:'readonly',process:'readonly',Buffer:'readonly',fetch:'readonly',URL:'readonly',setTimeout:'readonly',window:'readonly',document:'readonly',localStorage:'readonly',sessionStorage:'readonly',performance:'readonly',requestAnimationFrame:'readonly',getComputedStyle:'readonly',location:'readonly'}}}
);
