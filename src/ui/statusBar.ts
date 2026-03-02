export class StatusBarManager {
	private statusBarEl: HTMLElement;
	private lastPullTime: Date | null = null;
	private intervalId: number | null = null;

	constructor(statusBarEl: HTMLElement) {
		this.statusBarEl = statusBarEl;
		this.statusBarEl.addClass("confluence-sync-status-bar");
		this.update();
	}

	setLastPullTime(time: Date): void {
		this.lastPullTime = time;
		this.update();
	}

	startAutoUpdate(): void {
		if (this.intervalId !== null) return;
		this.intervalId = window.setInterval(() => this.update(), 60_000);
	}

	stopAutoUpdate(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private update(): void {
		if (!this.lastPullTime) {
			this.statusBarEl.setText("Confluence: no pulls yet");
			return;
		}

		const diff = Date.now() - this.lastPullTime.getTime();
		const minutes = Math.floor(diff / 60_000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		let ago: string;
		if (days > 0) {
			ago = `${days}d ago`;
		} else if (hours > 0) {
			ago = `${hours}h ago`;
		} else if (minutes > 0) {
			ago = `${minutes}m ago`;
		} else {
			ago = "just now";
		}

		this.statusBarEl.setText(`Confluence: last pull ${ago}`);
	}
}
