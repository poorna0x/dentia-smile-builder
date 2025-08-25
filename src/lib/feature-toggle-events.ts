// Simple event system for feature toggle changes
class FeatureToggleEventEmitter {
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    this.listeners.forEach(callback => callback());
  }
}

export const featureToggleEvents = new FeatureToggleEventEmitter();
