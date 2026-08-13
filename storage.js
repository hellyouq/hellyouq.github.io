// ========================
// СИСТЕМА ХРАНЕНИЯ ДАННЫХ (localStorage)
// ========================

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'phoneTycoonData';
    this.CURRENT_USER_KEY = 'currentUserId';
    this.initStorage();
  }

  /**
   * Инициализирует хранилище, если оно не существует
   */
  initStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const initialData = this.getDefaultGameData();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
    }
  }

  /**
   * Получить данные игры
   */
  getGameData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : this.getDefaultGameData();
  }

  /**
   * Сохранить данные игры
   */
  saveGameData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Получить текущего пользователя
   */
  getCurrentUser() {
    const userId = localStorage.getItem(this.CURRENT_USER_KEY);
    if (!userId) return null;
    
    const gameData = this.getGameData();
    return gameData.users.find(u => u.id === userId) || null;
  }

  /**
   * Установить текущего пользователя
   */
  setCurrentUser(userId) {
    localStorage.setItem(this.CURRENT_USER_KEY, userId);
  }

  /**
   * Выйти из аккаунта
   */
  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  /**
   * Зарегистрировать нового пользователя
   */
  registerUser(login, password) {
    const gameData = this.getGameData();
    
    // Проверить, не существует ли уже такой пользователь
    if (gameData.users.some(u => u.login === login)) {
      return { success: false, error: 'Пользователь с таким логином уже существует' };
    }

    // Создать нового пользователя
    const newUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      login: login,
      passwordHash: this.hashPassword(password),
      balance: 5000,
      inventory: {
        phones: [],
        parts: {}
      },
      shopWindow: [],
      stats: {
        totalPurchases: 0,
        totalSales: 0,
        totalProfit: 0,
        totalRepairs: 0,
        rating: 5.0,
        reviews: []
      },
      reputation: 50,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    gameData.users.push(newUser);
    this.saveGameData(gameData);
    
    return { success: true, user: newUser };
  }

  /**
   * Вход пользователя
   */
  loginUser(login, password) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.login === login);

    if (!user) {
      return { success: false, error: 'Пользователь не найден' };
    }

    if (user.passwordHash !== this.hashPassword(password)) {
      return { success: false, error: 'Неверный пароль' };
    }

    // Обновить время последнего входа
    user.lastLogin = new Date().toISOString();
    this.saveGameData(gameData);
    
    return { success: true, user: user };
  }

  /**
   * Простое хеширование пароля (в реальном приложении нужен более надёжный метод)
   */
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  /**
   * Обновить баланс пользователя
   */
  updateBalance(userId, amount) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      user.balance += amount;
      this.saveGameData(gameData);
      return user.balance;
    }
    return null;
  }

  /**
   * Добавить телефон в инвентарь
   */
  addPhoneToInventory(userId, phone) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      user.inventory.phones.push(phone);
      this.saveGameData(gameData);
      return true;
    }
    return false;
  }

  /**
   * Добавить запчасть в инвентарь
   */
  addPartToInventory(userId, partId, partName, brand, quantity = 1) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      const key = `${brand}_${partId}`;
      if (!user.inventory.parts[key]) {
        user.inventory.parts[key] = {
          id: partId,
          name: partName,
          brand: brand,
          quantity: 0
        };
      }
      user.inventory.parts[key].quantity += quantity;
      this.saveGameData(gameData);
      return true;
    }
    return false;
  }

  /**
   * Добавить отзыв к пользователю
   */
  addReview(userId, review) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      user.stats.reviews.push({
        ...review,
        date: new Date().toISOString()
      });
      
      // Пересчитать рейтинг
      const avgRating = user.stats.reviews.reduce((sum, r) => sum + r.stars, 0) / user.stats.reviews.length;
      user.stats.rating = Math.round(avgRating * 10) / 10;
      
      // Обновить репутацию (от 0 до 100)
      user.reputation = Math.max(0, Math.min(100, 50 + user.stats.rating * 5));
      
      this.saveGameData(gameData);
      return true;
    }
    return false;
  }

  /**
   * Обновить статистику пользователя
   */
  updateStats(userId, stats) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      Object.assign(user.stats, stats);
      this.saveGameData(gameData);
      return true;
    }
    return false;
  }

  /**
   * Выставить телефон на продажу
   */
  listPhoneForSale(userId, phoneId, price) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      const phone = user.inventory.phones.find(p => p.id === phoneId);
      if (phone) {
        const listing = {
          id: 'listing_' + Math.random().toString(36).substr(2, 9),
          phoneId: phone.id,
          phoneName: phone.phoneName,
          brandName: phone.brandName,
          price: price,
          condition: phone.condition,
          listedAt: new Date().toISOString()
        };
        user.shopWindow.push(listing);
        this.saveGameData(gameData);
        return listing;
      }
    }
    return null;
  }

  /**
   * Удалить телефон с продажи
   */
  unlistPhone(userId, listingId) {
    const gameData = this.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    
    if (user) {
      user.shopWindow = user.shopWindow.filter(l => l.id !== listingId);
      this.saveGameData(gameData);
      return true;
    }
    return false;
  }

  /**
   * Экспортировать сохранение в файл
   */
  exportSave() {
    const gameData = this.getGameData();
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phoneTycoon_save_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  /**
   * Импортировать сохранение из файла
   */
  importSave(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const gameData = JSON.parse(e.target.result);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gameData));
        location.reload();
      } catch (error) {
        alert('Ошибка при импорте сохранения: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Получить структуру данных по умолчанию
   */
  getDefaultGameData() {
    return {
      version: '1.0',
      users: [],
      bots: [
        {
          id: 'bot_001',
          name: 'Андрей',
          generosity: 0.7,
          pickiness: 0.4,
          speed: 0.8,
          rating: 4.5
        },
        {
          id: 'bot_002',
          name: 'Мария',
          generosity: 0.5,
          pickiness: 0.8,
          speed: 0.6,
          rating: 3.8
        },
        {
          id: 'bot_003',
          name: 'Сергей',
          generosity: 0.9,
          pickiness: 0.2,
          speed: 0.9,
          rating: 4.8
        },
        {
          id: 'bot_004',
          name: 'Елена',
          generosity: 0.4,
          pickiness: 0.95,
          speed: 0.5,
          rating: 3.2
        },
        {
          id: 'bot_005',
          name: 'Иван',
          generosity: 0.6,
          pickiness: 0.5,
          speed: 0.7,
          rating: 4.0
        },
        {
          id: 'bot_006',
          name: 'Виктория',
          generosity: 0.8,
          pickiness: 0.3,
          speed: 0.85,
          rating: 4.6
        }
      ],
      market: {
        currentOffers: [],
        lastUpdate: null
      }
    };
  }
}

// Создать глобальный экземпляр менеджера хранилища
const storage = new StorageManager();
