import { InjectQueue, OnGlobalQueueActive, OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
const nodemailer = require('nodemailer');
import * as os from 'os';
import { MailDetails } from './mail.type';

@Processor('mail-otp')
@Injectable()
export class MailProcessor {
  private from: any;
  private transporter: any;

  constructor(
    @InjectQueue('mail-otp') private readonly mailQueue: Queue
  ) {
    const fromEnv = process.env.MAIL_ACCOUNT;
    const fromDetails = (fromEnv || 'email:password').split(':');

    this.from = {
      mail: fromDetails[0],
      password: fromDetails[1]
    };

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      secureConnection: false,
      secure: false,
      port: 587,
      auth: {
        user: this.from.mail,
        pass: this.from.password
      }
    });
  }

  public async send(input: MailDetails) {
    const { to, html, from, subject } = input;
    const transporter = this.transporter;
    try {
      await transporter.sendMail({
        from: from || this.from.mail,
        to,
        subject,
        html
      });
    } catch (e) {
      console.log(e);
    }
  }

  @Process({
    name: 'mail-otp',
    concurrency: os.cpus().length
  })
  async sendEmail(job: Job) {
    const input: MailDetails = job.data;
    if (!input.from) {
      input.from = process.env.MAIL_NAME;
    }
    if (!input.text) {
      input.text = process.env.DEFAULT_SUBJECT;
    }
    await this.transporter.sendMail(job.data);
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} `,
    );
  }
}
