import { Component, inject, signal, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

interface ChatbotFaq {
  questionKey: string;
  answerKey: string;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot-bubble',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  templateUrl: './chatbot-bubble.component.html',
  styleUrl: './chatbot-bubble.component.scss'
})
export class ChatbotBubbleComponent {
  readonly isOpen = signal(false);
  readonly selectedFaq = signal<number | null>(null);
  readonly chatMode = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly userInput = signal('');
  readonly isTyping = signal(false);

  private readonly chatBody = viewChild<ElementRef>('chatBodyRef');
  private readonly i18nService = inject(I18nService);

  readonly faqs: ChatbotFaq[] = [
    { questionKey: 'chatbot.faq.q1', answerKey: 'chatbot.faq.a1' },
    { questionKey: 'chatbot.faq.q2', answerKey: 'chatbot.faq.a2' },
    { questionKey: 'chatbot.faq.q3', answerKey: 'chatbot.faq.a3' },
    { questionKey: 'chatbot.faq.q4', answerKey: 'chatbot.faq.a4' },
    { questionKey: 'chatbot.faq.q5', answerKey: 'chatbot.faq.a5' },
    { questionKey: 'chatbot.faq.q6', answerKey: 'chatbot.faq.a6' }
  ];

  toggle(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.selectedFaq.set(null);
      this.chatMode.set(false);
    }
  }

  selectFaq(index: number): void {
    this.selectedFaq.update(current => current === index ? null : index);
  }

  openChat(): void {
    this.chatMode.set(true);
    if (this.messages().length === 0) {
      this.messages.set([{
        role: 'bot',
        text: this.i18nService.translate('chatbot.chat.greeting'),
        timestamp: new Date()
      }]);
    }
  }

  backToFaq(): void {
    this.chatMode.set(false);
  }

  sendMessage(): void {
    const text = this.userInput().trim();
    if (!text || this.isTyping()) return;

    this.messages.update(msgs => [...msgs, {
      role: 'user',
      text,
      timestamp: new Date()
    }]);
    this.userInput.set('');
    this.scrollToBottom();

    this.isTyping.set(true);

    setTimeout(() => {
      const reply = this.generateReply(text);
      this.messages.update(msgs => [...msgs, {
        role: 'bot',
        text: reply,
        timestamp: new Date()
      }]);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 800 + Math.random() * 700);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.chatBody()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  private generateReply(input: string): string {
    const lower = input.toLowerCase();

    if (lower.includes('torneo') || lower.includes('tournament')) {
      return this.i18nService.translate('chatbot.chat.reply.tournament');
    }
    if (lower.includes('inscri') || lower.includes('regist')) {
      return this.i18nService.translate('chatbot.chat.reply.registration');
    }
    if (lower.includes('plan') || lower.includes('precio') || lower.includes('price')) {
      return this.i18nService.translate('chatbot.chat.reply.plans');
    }
    if (lower.includes('deporte') || lower.includes('sport')) {
      return this.i18nService.translate('chatbot.chat.reply.sports');
    }
    if (lower.includes('organiza')) {
      return this.i18nService.translate('chatbot.chat.reply.organization');
    }
    if (lower.includes('complejo') || lower.includes('complex') || lower.includes('cancha') || lower.includes('court')) {
      return this.i18nService.translate('chatbot.chat.reply.complex');
    }
    if (lower.includes('hola') || lower.includes('hello') || lower.includes('hi') || lower.includes('olá')) {
      return this.i18nService.translate('chatbot.chat.reply.hello');
    }
    if (lower.includes('gracia') || lower.includes('thank') || lower.includes('obrigad')) {
      return this.i18nService.translate('chatbot.chat.reply.thanks');
    }

    return this.i18nService.translate('chatbot.chat.reply.default');
  }
}
