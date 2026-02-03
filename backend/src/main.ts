import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
  origin: (origin, callback) => {
    // ✅ CHO PHÉP origin = null (iframe / preview / webview)
    if (!origin) {
      return callback(null, true);
    }

    const allowlist = [
      "http://localhost:5173",
      "https://ihk-case-app.vercel.app",
    ];

    const isVercelPreview =
      origin.endsWith(".vercel.app") ||
      origin.includes("vercel.app");

    if (allowlist.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS: " + origin), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});


  await app.listen(process.env.PORT || 3000);
}
bootstrap();
