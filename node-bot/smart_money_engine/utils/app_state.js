/**
 * Модуль для управления глобальным состоянием приложения
 */
class AppState {
  constructor() {
    this.isShuttingDown = false;
    this.startTime = new Date();
    this.mainInterval = null;
  }

  /**
   * Установить флаг остановки
   */
  setShuttingDown(value = true) {
    this.isShuttingDown = value;
  }

  /**
   * Проверить, происходит ли остановка
   */
  isShutdownRequested() {
    return this.isShuttingDown;
  }

  /**
   * Получить время работы приложения
   */
  getUptime() {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Установить главный интервал
   */
  setMainInterval(interval) {
    this.mainInterval = interval;
  }

  /**
   * Получить главный интервал
   */
  getMainInterval() {
    return this.mainInterval;
  }

  /**
   * Сбросить состояние
   */
  reset() {
    this.isShuttingDown = false;
    this.startTime = new Date();
    this.mainInterval = null;
  }
}

// Экспортируем синглтон
const appState = new AppState();
module.exports = appState; 