import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PublicOrganization } from '../../../core/models';
import { buildPublicOrganization } from '../../../core/models/public-tournament.testing';
import { PublicOrganizationCardComponent } from './public-organization-card.component';

describe('PublicOrganizationCardComponent', () => {
  let fixture: ComponentFixture<PublicOrganizationCardComponent>;
  let element: HTMLElement;

  function render(organization: PublicOrganization, compact = false): void {
    fixture = TestBed.createComponent(PublicOrganizationCardComponent);
    fixture.componentRef.setInput('organization', organization);
    fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  function link(kind: string): HTMLAnchorElement | null {
    return element.querySelector<HTMLAnchorElement>(`a.public-organization__link[data-link="${kind}"]`);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PublicOrganizationCardComponent] }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
  });

  it('renders the logo, display name, translated type and description', () => {
    render(buildPublicOrganization());

    expect(element.querySelector<HTMLImageElement>('img.public-organization__logo')?.getAttribute('src'))
      .toBe('https://cdn.example.com/club-norte.png');
    expect(element.querySelector('.public-organization__name')?.textContent?.trim()).toBe('Club Norte');
    expect(element.querySelector('.public-organization__type')?.textContent?.trim()).toBe('Circuito');
    expect(element.querySelector('.public-organization__description')?.textContent?.trim())
      .toBe('Club de pádel de la zona norte');
  });

  it('shows a fallback icon instead of a broken image when there is no logo', () => {
    render(buildPublicOrganization({ logoUrl: null }));

    expect(element.querySelector('img.public-organization__logo')).toBeNull();
    expect(element.querySelector('.public-organization__logo-fallback')).not.toBeNull();
  });

  it('hides the description in the compact variant used by tournament cards', () => {
    render(buildPublicOrganization(), true);

    expect(element.querySelector('.public-organization__description')).toBeNull();
    expect(element.querySelector('.public-organization__name')?.textContent?.trim()).toBe('Club Norte');
  });

  it('opens website and social links in a new tab with noopener noreferrer and an accessible label', () => {
    render(buildPublicOrganization());

    const expected: Record<string, string> = {
      website: 'https://clubnorte.example.com',
      instagram: 'https://www.instagram.com/clubnorte',
      facebook: 'https://www.facebook.com/clubnorte',
      tiktok: 'https://www.tiktok.com/@clubnorte',
      youtube: 'https://www.youtube.com/@clubnorte'
    };
    for (const [kind, href] of Object.entries(expected)) {
      const anchor = link(kind);
      expect(anchor?.getAttribute('href')).withContext(kind).toBe(href);
      expect(anchor?.getAttribute('target')).withContext(kind).toBe('_blank');
      expect(anchor?.getAttribute('rel')).withContext(kind).toBe('noopener noreferrer');
      expect(anchor?.getAttribute('aria-label')?.length).withContext(kind).toBeGreaterThan(0);
    }
    expect(link('instagram')?.getAttribute('aria-label')).toBe('Instagram de Club Norte (se abre en una pestaña nueva)');
  });

  it('links WhatsApp to wa.me with only the phone digits, in a new tab', () => {
    render(buildPublicOrganization());

    const whatsapp = link('whatsapp');
    expect(whatsapp?.getAttribute('href')).toBe('https://wa.me/5491122334455');
    expect(whatsapp?.getAttribute('target')).toBe('_blank');
    expect(whatsapp?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('links the contact email with mailto and keeps it in the same tab', () => {
    render(buildPublicOrganization());

    const email = link('email');
    expect(email?.getAttribute('href')).toBe('mailto:hola@clubnorte.example.com');
    expect(email?.hasAttribute('target')).toBeFalse();
    expect(email?.getAttribute('aria-label')).toBe('Enviar un email a Club Norte');
  });

  it('renders only the links the organization provided', () => {
    render(buildPublicOrganization({ links: { instagramUrl: 'https://www.instagram.com/clubnorte' } }));

    const kinds = Array.from(element.querySelectorAll('a.public-organization__link')).map(a => a.getAttribute('data-link'));
    expect(kinds).toEqual(['instagram']);
  });

  it('renders no links list when the organization has no links', () => {
    render(buildPublicOrganization({ links: {} }));

    expect(element.querySelector('.public-organization__links')).toBeNull();
  });

  it('drops web links that are not http or https', () => {
    render(buildPublicOrganization({ links: { websiteUrl: 'javascript:alert(1)', facebookUrl: 'https://www.facebook.com/clubnorte' } }));

    expect(link('website')).toBeNull();
    expect(link('facebook')).not.toBeNull();
  });

  it('translates the link labels with the active locale', () => {
    TestBed.inject(I18nService).setLocale('en');
    render(buildPublicOrganization());

    expect(link('instagram')?.getAttribute('aria-label')).toBe('Club Norte on Instagram (opens in a new tab)');
    expect(element.querySelector('.public-organization__type')?.textContent?.trim()).toBe('Circuit');
  });
});
