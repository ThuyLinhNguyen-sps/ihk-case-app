import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      // cho Postman/curl (origin undefined)
      if (!origin) return callback(null, true);

      const allowlist = [
        "http://localhost:5173",
        "https://ihk-case-dvlahd6yi-linhs-projects-4538d790.vercel.app",
      ];

      // ✅ cho luôn mọi preview *.vercel.app
      const isVercel = origin.endsWith(".vercel.app");

      if (allowlist.includes(origin) || isVercel) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ thêm PUT
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
