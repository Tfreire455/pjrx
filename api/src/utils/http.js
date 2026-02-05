export function ok(reply, data, code = 200) {
  return reply.code(code).send({ ok: true, data });
}

export function fail(reply, code, error) {
  return reply.code(code).send({ ok: false, error });
}
