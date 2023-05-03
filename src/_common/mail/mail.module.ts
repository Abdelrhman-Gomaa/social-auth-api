import { Module, Global } from '@nestjs/common';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { NodeMailerService } from './nodemailer.service';

@Global()
@Module({
  imports: [],
  providers: [
    MailService,
    NodeMailerService,
    MailProcessor
  ],
  exports: [MailService]
})
export class MailModule {}
