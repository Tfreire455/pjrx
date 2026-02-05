import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

export default fp(async function prismaPlugin(app) {
  const prisma = new PrismaClient();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});
