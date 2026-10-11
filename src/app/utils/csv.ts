// 管理者パネルのデータをCSVとしてダウンロードするためのユーティリティ。
//
// CSVにしているのは、Excelがそのまま開ける形式でありながら、
// 追加のライブラリを必要としないため（読み込みが重くならない）。

type Cell = string | number | boolean | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // カンマ・改行・引用符を含む場合は "" で囲み、中の " は "" に増やす
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * 表データをCSVファイルとしてダウンロードさせる。
 * 先頭にBOM(﻿)を付けているのは、これが無いとExcelがUTF-8と認識せず
 * 日本語が文字化けするため。
 */
export function downloadCsv(fileName: string, rows: Cell[][]): void {
  const csv = rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** 「ユーザー一覧_20261011_1530.csv」のように、日時付きのファイル名を作る */
export function timestampedFileName(base: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${base}_${stamp}.csv`;
}

/** 日時を「2026/10/11 15:30」の形に整える */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
