import { fail } from "../utils/http.js";

const RANK = { guest: 1, member: 2, admin: 3, owner: 4 };

export function requireRole(minRole = "member") {
  return async function (request, reply) {
    const role = request.memberRole || "guest";
    if ((RANK[role] || 0) < (RANK[minRole] || 0)) {
      return fail(reply, 403, { code: "FORBIDDEN", message: "Permissão insuficiente." });
    }
  };
}
