import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

function installChunkLoadRecovery(): void {
	const storageKey = 'zh_chunk_reload_once';

	window.addEventListener('unhandledrejection', (event) => {
		const message = String((event.reason as { message?: unknown } | null)?.message ?? event.reason ?? '');
		if (!message.includes('Failed to fetch dynamically imported module')) {
			return;
		}

		// Recover once from stale chunk maps after dev-server rebuilds.
		if (!sessionStorage.getItem(storageKey)) {
			sessionStorage.setItem(storageKey, '1');
			window.location.reload();
			return;
		}

		sessionStorage.removeItem(storageKey);
	});
}

installChunkLoadRecovery();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
