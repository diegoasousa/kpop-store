import { Injectable, Logger } from "@nestjs/common";
import { translate } from "@vitalets/google-translate-api";

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor() {
    this.logger.log("Translation service enabled with Google Translate");
  }

  async translateToPortuguese(text: string): Promise<string | null> {
    if (!text) {
      return null;
    }

    const cleanedText = text.replace(/\[.*?\]/g, "").trim();

    if (!cleanedText) {
      return null;
    }

    try {
      const result = await translate(cleanedText, { to: "pt" });
      return result.text || null;
    } catch (error) {
      this.logger.error(
        `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return null;
    }
  }

  async translateBatch(texts: string[]): Promise<(string | null)[]> {
    if (texts.length === 0) {
      return [];
    }

    const results: (string | null)[] = [];

    for (const text of texts) {
      const translation = await this.translateToPortuguese(text);
      results.push(translation);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return results;
  }
}
