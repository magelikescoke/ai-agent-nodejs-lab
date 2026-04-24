import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LLMGenerateTextDto } from './llm.dto';
import { LLMService } from './llm.service';

@Controller('/llm')
export class LLMController {
  @Inject()
  private llmService: LLMService;

  @Post('/generate/text')
  public async generateText(@Body() generateTextDto: LLMGenerateTextDto) {
    return {
      text: await this.llmService.generateText(generateTextDto.prompt),
    };
  }
}
