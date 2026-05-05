import { Component, inject, signal, ElementRef, viewChild, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
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

export type ChatbotMode = 'floating' | 'embedded';
export type ChatbotContext = 'general' | 'registrations' | 'players' | 'tournaments';

@Component({
  selector: 'app-chatbot-bubble',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  templateUrl: './chatbot-bubble.component.html',
  styleUrl: './chatbot-bubble.component.scss'
})
export class ChatbotBubbleComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode: ChatbotMode = 'floating';
  @Input() context: ChatbotContext = 'general';
  @Output() modeChanged = new EventEmitter<ChatbotMode>();

  readonly isOpen = signal(false);
  readonly selectedFaq = signal<number | null>(null);
  readonly chatMode = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly userInput = signal('');
  readonly isTyping = signal(false);

  private readonly chatBody = viewChild<ElementRef>('chatBodyRef');
  private readonly i18nService = inject(I18nService);
  private readonly openChatbotHandler = (e: Event) => this.handleOpenChatbot(e as CustomEvent);

  /** Track whether chatbot was visible before entering embedded mode */
  private wasVisibleBeforeEmbedded = false;

  constructor() {}

  /** Get context-specific greeting message */
  private getGreetingForContext(): string {
    switch (this.context) {
      case 'registrations':
        return this.i18nService.translate('chatbot.registrations.greeting');
      case 'players':
        return this.i18nService.translate('chatbot.players.greeting');
      case 'tournaments':
        return this.i18nService.translate('chatbot.tournaments.greeting');
      default:
        return this.i18nService.translate('chatbot.chat.greeting');
    }
  }

  readonly faqs: ChatbotFaq[] = [
    { questionKey: 'chatbot.faq.q1', answerKey: 'chatbot.faq.a1' },
    { questionKey: 'chatbot.faq.q2', answerKey: 'chatbot.faq.a2' },
    { questionKey: 'chatbot.faq.q3', answerKey: 'chatbot.faq.a3' },
    { questionKey: 'chatbot.faq.q4', answerKey: 'chatbot.faq.a4' },
    { questionKey: 'chatbot.faq.q5', answerKey: 'chatbot.faq.a5' },
    { questionKey: 'chatbot.faq.q6', answerKey: 'chatbot.faq.a6' }
  ];

  toggle(): void {
    // In embedded mode, toggle means close and return to floating
    if (this.mode === 'embedded') {
      this.modeChanged.emit('floating');
      return;
    }

    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.selectedFaq.set(null);
      this.chatMode.set(false);
    }
  }

  /**
   * Switches to embedded mode while preserving chatbot visibility state.
   * @param wasVisible Whether the chatbot was visible before switching to embedded
   */
  switchToEmbedded(wasVisible: boolean): void {
    this.wasVisibleBeforeEmbedded = wasVisible;
    this.mode = 'embedded';
    this.modeChanged.emit('embedded');
  }

  /**
   * Switches back to floating mode and restores previous visibility.
   */
  switchToFloating(): void {
    this.mode = 'floating';
    this.isOpen.set(this.wasVisibleBeforeEmbedded);
    if (!this.isOpen()) {
      this.chatMode.set(false);
      this.selectedFaq.set(null);
    }
    this.modeChanged.emit('floating');
  }

  ngOnInit(): void {
    window.addEventListener('zh-open-chatbot', this.openChatbotHandler);
    this.ensureEmbeddedOpenState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode']) {
      this.ensureEmbeddedOpenState();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('zh-open-chatbot', this.openChatbotHandler);
  }

  private handleOpenChatbot(event: CustomEvent): void {
    const message = event.detail?.message;
    this.isOpen.set(true);
    this.chatMode.set(true);

    if (this.messages().length === 0) {
      this.messages.set([{
        role: 'bot',
        text: this.getGreetingForContext(),
        timestamp: new Date()
      }]);
    }

    if (message) {
      // Send the pre-filled message
      this.messages.update(msgs => [...msgs, {
        role: 'user',
        text: message,
        timestamp: new Date()
      }]);
      this.scrollToBottom();

      this.isTyping.set(true);
      setTimeout(() => {
        const reply = this.generateReply(message);
        this.messages.update(msgs => [...msgs, {
          role: 'bot',
          text: reply,
          timestamp: new Date()
        }]);
        this.isTyping.set(false);
        this.scrollToBottom();
      }, 1000 + Math.random() * 500);
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
        text: this.getGreetingForContext(),
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

  private ensureEmbeddedOpenState(): void {
    if (this.mode !== 'embedded') {
      return;
    }

    this.isOpen.set(true);
    this.chatMode.set(true);

    if (this.messages().length === 0) {
      this.messages.set([{
        role: 'bot',
        text: this.getGreetingForContext(),
        timestamp: new Date()
      }]);
    }
  }
}
