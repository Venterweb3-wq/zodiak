const Signal = require('../models/Signal');

class SignalDeduplication {
  constructor() {
    this.duplicateWindow = 2 * 60 * 60 * 1000; // 2 часа в миллисекундах
    this.cache = new Map(); // Кэш для быстрой проверки
  }

  /**
   * Проверить является ли сигнал дубликатом
   * @param {string} symbol - Символ монеты
   * @param {string} type - Тип сигнала (buy/sell)
   * @param {Object} analysisResult - Результат анализа
   * @returns {boolean} true если дубликат
   */
  async isDuplicateSignal(symbol, type, analysisResult) {
    const cacheKey = `${symbol}_${type}`;
    
    // Быстрая проверка по кэшу
    if (this.cache.has(cacheKey)) {
      const cachedTime = this.cache.get(cacheKey);
      if (Date.now() - cachedTime < this.duplicateWindow) {
        console.log(`🔄 Дубликат в кэше: ${symbol} ${type}`);
        return true;
      }
    }

    try {
      // Проверка в базе данных
      const recentSignal = await Signal.findOne({
        symbol: symbol,
        type: type,
        created_at: {
          $gte: new Date(Date.now() - this.duplicateWindow)
        }
      }).sort({ created_at: -1 });

      if (recentSignal) {
        // Дополнительная проверка на изменение условий
        const conditionsChanged = this.haveConditionsChanged(recentSignal, analysisResult);
        
        if (!conditionsChanged) {
          console.log(`🔄 Дубликат в БД: ${symbol} ${type} (создан ${this.getTimeAgo(recentSignal.created_at)})`);
          
          // Обновляем кэш
          this.cache.set(cacheKey, Date.now());
          return true;
        } else {
          console.log(`🔄 Условия изменились для ${symbol} ${type}, разрешаем новый сигнал`);
        }
      }

      return false;

    } catch (error) {
      console.error(`❌ Ошибка проверки дубликата для ${symbol}:`, error.message);
      return false; // В случае ошибки разрешаем создание сигнала
    }
  }

  /**
   * Проверить изменились ли условия анализа
   * @param {Object} oldSignal - Старый сигнал из БД
   * @param {Object} newAnalysis - Новый результат анализа
   * @returns {boolean} true если условия значительно изменились
   */
  haveConditionsChanged(oldSignal, newAnalysis) {
    if (!oldSignal.reasoning || !newAnalysis.reasoning) {
      return true; // Если нет данных для сравнения, считаем что изменились
    }

    // Сравниваем основные факторы
    const oldReasons = new Set(oldSignal.reasoning);
    const newReasons = new Set(newAnalysis.reasoning);
    
    // Рассчитываем пересечение множеств
    const intersection = new Set([...oldReasons].filter(x => newReasons.has(x)));
    const union = new Set([...oldReasons, ...newReasons]);
    
    // Коэффициент схожести Жаккара
    const similarity = intersection.size / union.size;
    
    // Если схожесть меньше 60%, считаем что условия изменились
    const significantChange = similarity < 0.6;
    
    if (significantChange) {
      console.log(`📊 Схожесть условий: ${(similarity * 100).toFixed(1)}% - условия изменились`);
      console.log(`📊 Старые: ${Array.from(oldReasons).slice(0, 3).join(', ')}`);
      console.log(`📊 Новые: ${Array.from(newReasons).slice(0, 3).join(', ')}`);
    }
    
    return significantChange;
  }

  /**
   * Получить время назад в читаемом формате
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}м назад`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}ч ${diffMins % 60}м назад`;
    }
  }

  /**
   * Очистить устаревшие записи из кэша
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.duplicateWindow) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Получить статистику дедупликации
   */
  getStats() {
    return {
      cache_size: this.cache.size,
      duplicate_window_hours: this.duplicateWindow / (60 * 60 * 1000),
      cached_signals: Array.from(this.cache.keys())
    };
  }

  /**
   * Принудительно очистить кэш
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Кэш дедупликации очищен');
  }

  /**
   * Добавить сигнал в кэш (вызывается после успешного создания)
   */
  addToCache(symbol, type) {
    const cacheKey = `${symbol}_${type}`;
    this.cache.set(cacheKey, Date.now());
  }

  /**
   * Проверить дубликаты для пакета сигналов
   * @param {Array} candidateSignals - Массив кандидатов на сигналы
   * @returns {Array} Отфильтрованный массив без дубликатов
   */
  async filterDuplicates(candidateSignals) {
    const filtered = [];
    
    for (const candidate of candidateSignals) {
      const isDuplicate = await this.isDuplicateSignal(
        candidate.symbol,
        candidate.analysisResult.recommendation,
        candidate.analysisResult
      );
      
      if (!isDuplicate) {
        filtered.push(candidate);
      }
    }
    
    console.log(`🔄 Дедупликация: ${candidateSignals.length} → ${filtered.length} сигналов`);
    return filtered;
  }

  /**
   * Получить активные сигналы для мониторинга дубликатов
   */
  async getActiveSignals() {
    try {
      const activeSignals = await Signal.find({
        status: { $in: ['pending', 'active'] },
        created_at: {
          $gte: new Date(Date.now() - this.duplicateWindow)
        }
      }).select('symbol type created_at reasoning').lean();

      return activeSignals.map(signal => ({
        symbol: signal.symbol,
        type: signal.type,
        age_minutes: Math.floor((Date.now() - signal.created_at.getTime()) / 60000),
        reasoning_count: signal.reasoning?.length || 0
      }));

    } catch (error) {
      console.error('❌ Ошибка получения активных сигналов:', error.message);
      return [];
    }
  }
}

module.exports = SignalDeduplication; 