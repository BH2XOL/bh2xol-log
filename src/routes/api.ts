import type { Bindings } from "../types";

// ====== 公开搜索 ======
export async function apiSearchHandler(request: Request, env: Bindings): Promise<Response> {
  const url = new URL(request.url);
  const call = url.searchParams.get("call") || undefined;
  const mode = url.searchParams.get("mode") || undefined;
  const date = url.searchParams.get("date") || undefined;
  const { queryQsos } = await import("../lib/db");
  const qsos = await queryQsos(env.DB, { call, mode, date });
  return Response.json({ qsos, total: qsos.length });
}

// ====== 上传 ADIF ======
export async function apiUploadHandler(request: Request, env: Bindings): Promise<Response> {
  const text = await request.text();
  const { parseADIF, mergeUnique } = await import("../lib/adif");
  const { queryQsos, insertQSO } = await import("../lib/db");

  const incoming = parseADIF(text);
  if (incoming.length === 0) {
    return Response.json({ inserted: 0, skipped: 0, error: "No valid QSO in ADIF" });
  }

  const existing = await queryQsos(env.DB);
  const unique = mergeUnique(existing, incoming);

  for (const q of unique) {
    await insertQSO(env.DB, {
      call: q.call, dxcc: q.dxcc, date: q.date, time: q.time,
      freq: q.freq, mode: q.mode,
      rst_rx: q.rst_rx || "59", rst_tx: q.rst_tx || "59",
      grid: q.grid, lotw: q.lotw, note: q.note,
    });
  }

  return Response.json({ inserted: unique.length, skipped: incoming.length - unique.length });
}

// ====== 手动添加 ======
export async function apiAddHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as Record<string, string>;
  const call = (body.call || "").trim().toUpperCase();
  const date = body.date?.trim();
  const time = body.time?.trim();
  const freq = body.freq?.trim();
  const mode = body.mode?.trim();

  if (!call || !date || !time || !freq || !mode) {
    return Response.json({ ok: false, error: "必填字段缺失" }, { status: 400 });
  }

  const { insertQSO } = await import("../lib/db");
  await insertQSO(env.DB, {
    call, dxcc: body.dxcc || "", date, time, freq, mode,
    rst_rx: body.rst_rx || "59", rst_tx: body.rst_tx || "59",
    grid: body.grid || "", lotw: false, note: body.note || "",
  });

  return Response.json({ ok: true });
}

// ====== 删除 ======
export async function apiDeleteHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as { ids: number[] };
  if (!body.ids?.length) {
    return Response.json({ ok: false, error: "未提供 ID" }, { status: 400 });
  }
  const { deleteQSOs } = await import("../lib/db");
  await deleteQSOs(env.DB, body.ids);
  return Response.json({ ok: true });
}

// ====== 管理端列表 ======
export async function apiListHandler(request: Request, env: Bindings): Promise<Response> {
  const { queryQsos } = await import("../lib/db");
  const qsos = await queryQsos(env.DB);
  return Response.json({ qsos });
}

// ====== 最佳 DX ======
export async function apiBestDXHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as { call: string; description: string; distance_km: number };
  if (!body.call || !body.distance_km) {
    return Response.json({ ok: false, error: "缺少参数" }, { status: 400 });
  }
  const { setBestDX } = await import("../lib/db");
  await setBestDX(env.DB, {
    call: body.call.toUpperCase(),
    description: body.description || "",
    distance_km: body.distance_km,
  });
  return Response.json({ ok: true });
}

// ====== 最近活动 ======
export async function apiLastActHandler(request: Request, env: Bindings): Promise<Response> {
  const body = (await request.json()) as { text: string };
  const { setLastActivity } = await import("../lib/db");
  await setLastActivity(env.DB, body.text || "");
  return Response.json({ ok: true });
}