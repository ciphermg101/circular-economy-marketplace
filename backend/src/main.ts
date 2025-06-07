import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { configureSwagger } from "@common/swagger/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureSwagger(app);
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
