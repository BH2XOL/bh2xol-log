import type { QSO } from "../types";

interface RawQSO {
  call: string;
  dxcc: string;
  date: string;
  time: string;
  freq: string;
  mode: string;
  rst_rx: string;
  rst_tx: string;
  grid: string;
  lotw: boolean;
  note: string;
}

export function parseADIF(text: string): RawQSO[] {
  const result: RawQSO[] = [];
  const records = text.split(/<eor>/i).filter((s) => s.trim());

  for (const record of records) {
    if (/<eoh>/i.test(record)) continue;

    const qso: RawQSO = {
      call: "", dxcc: "", date: "", time: "", freq: "", mode: "",
      rst_rx: "", rst_tx: "", grid: "", lotw: false, note: "",
    };

    // 注意：没有 ^ ！否则只匹配第一个字段
    const fieldRegex = /<([^:>]+):(\d+)(?::[^>]*)?>([^<]*)/g;
    let match: RegExpExecArray | null;
    while ((match = fieldRegex.exec(record)) !== null) {
      const key = match[1].toLowerCase();
      const value = match[3].trim();

      switch (key) {
        case "call": qso.call = value.toUpperCase(); break;
        case "country": qso.dxcc = value; break;
        case "qso_date": qso.date = fmtDate(value); break;
        case "time_on": qso.time = fmtTime(value); break;
        case "freq": qso.freq = parseFloat(value).toFixed(3); break;
        case "mode": qso.mode = value; break;
        case "rst_rcvd": qso.rst_rx = value; break;
        case "rst_sent": qso.rst_tx = value; break;
        case "gridsquare": qso.grid = value; break;
        case "comment":
        case "contest_id": qso.note = value; break;
        case "qsl_rcvd":
          qso.lotw = value.toUpperCase() === "Y";
          break;
        case "app_lotw_2xqsl":
          if (value === "Y") qso.lotw = true;
          break;
      }
    }

    if (qso.call && qso.date && qso.mode) {
      result.push(qso);
    }
  }

  return result;
}

export function mergeUnique(
  existing: Pick<QSO, "call" | "date" | "time" | "freq" | "mode">[],
  incoming: RawQSO[]
): RawQSO[] {
  const set = new Set(existing.map((q) => `${q.call}|${q.date}|${q.time}|${q.freq}|${q.mode}`));
  return incoming.filter((q) => {
    const key = `${q.call}|${q.date}|${q.time}|${q.freq}|${q.mode}`;
    return !set.has(key);
  });
}

function fmtDate(v: string): string {
  const d = v.replace(/-/g, "");
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return v;
}

function fmtTime(v: string): string {
  const t = v.replace(/:/g, "");
  if (t.length >= 4) return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  return v;
}