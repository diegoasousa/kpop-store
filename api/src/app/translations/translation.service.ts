import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor() {
    this.logger.log("Translation service disabled (no provider configured)");
  }

  async translateToPortuguese(_text: string): Promise<string | null> {
    return null;
  }

  async translateBatch(texts: string[]): Promise<(string | null)[]> {
    return texts.map(() => null);
  }
}
