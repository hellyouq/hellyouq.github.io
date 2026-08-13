// ========================
// ОСНОВНОЙ ИГРОВОЙ ДВИЖОК
// ========================

class PhoneTycoonGame {
  constructor() {
    this.currentUser = null;
    this.currentListing = null;
    this.currentPage = 0;
    this.itemsPerPage = 12;
    this.init();
  }

  /**
   * Инициализация игры
   */
  init() {
    // Проверяем, залогинен ли пользователь
    const currentUser = storage.getCurrentUser();
    
    if (currentUser) {
      this.currentUser = currentUser;
      this.showMainGame();
    } else {
      this.showAuthScreen();
    }
  }

  /**
   * Показать экран авторизации
   */
  showAuthScreen() {
    const html = `
      <div class="auth-container">
        <div class="auth-box">
          <div class="auth-header">
            <h1>📱 Phone Tycoon</h1>
            <p>Игра перекупщика смартфонов</p>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab active" id="loginTab">Вход</button>
            <button class="auth-tab" id="registerTab">Регистрация</button>
          </div>

          <form class="auth-form" id="authForm">
            <div class="form-group">
              <label>Логин</label>
              <input type="text" id="authLogin" placeholder="Введите логин" required>
            </div>

            <div class="form-group">
              <label>Пароль</label>
              <input type="password" id="authPassword" placeholder="Введите пароль" required>
            </div>

            <button type="submit" class="btn-primary btn-large" id="authBtn">Вход</button>
          </form>

          <div class="auth-footer">
            <p id="authMessage"></p>
          </div>

          <!-- Кнопка для импорта сохранения -->
          <div class="import-export">
            <label class="btn-secondary" for="importFile">📂 Загрузить сохранение</label>
            <input type="file" id="importFile" accept=".json" style="display: none;">
            <button class="btn-secondary" onclick="storage.exportSave()">💾 Сохранить игру</button>
          </div>
        </div>
      </div>
    `;

    document.body.innerHTML = html;
    document.body.style.background = '#1a1a2e';
    document.body.style.color = '#fff';
    document.body.style.fontFamily = 'Arial, sans-serif';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Стили для авторизации
    this.injectAuthStyles();

    // Обработчики
    let isLogin = true;

    document.getElementById('loginTab').addEventListener('click', () => {
      isLogin = true;
      document.getElementById('loginTab').classList.add('active');
      document.getElementById('registerTab').classList.remove('active');
      document.getElementById('authBtn').textContent = 'Вход';
      document.getElementById('authMessage').textContent = '';
    });

    document.getElementById('registerTab').addEventListener('click', () => {
      isLogin = false;
      document.getElementById('registerTab').classList.add('active');
      document.getElementById('loginTab').classList.remove('active');
      document.getElementById('authBtn').textContent = 'Зарегистрироваться';
      document.getElementById('authMessage').textContent = '';
    });

    document.getElementById('authForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const login = document.getElementById('authLogin').value;
      const password = document.getElementById('authPassword').value;

      if (isLogin) {
        const result = storage.loginUser(login, password);
        if (result.success) {
          storage.setCurrentUser(result.user.id);
          this.currentUser = result.user;
          this.showMainGame();
        } else {
          document.getElementById('authMessage').textContent = '❌ ' + result.error;
        }
      } else {
        const result = storage.registerUser(login, password);
        if (result.success) {
          storage.setCurrentUser(result.user.id);
          this.currentUser = result.user;
          this.showMainGame();
        } else {
          document.getElementById('authMessage').textContent = '❌ ' + result.error;
        }
      }
    });

    // Импорт сохранения
    document.getElementById('importFile').addEventListener('change', (e) => {
      storage.importSave(e.target.files[0]);
    });
  }

  /**
   * Показать главное меню игры
   */
  showMainGame() {
    // Загружаем HTML из index.html
    const mainHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h1>📱 Phone Tycoon</h1>
            <p class="user-info">👤 ${this.currentUser.login}</p>
          </div>

          <div class="balance-card">
            <div class="balance-label">Баланс</div>
            <div class="balance-amount" id="balanceDisplay">${this.formatCurrency(this.currentUser.balance)}</div>
          </div>

          <div class="rank-card">
            <div class="rank-label">Рейтинг</div>
            <div class="rank-value">⭐ ${this.currentUser.stats.rating.toFixed(1)} (${this.currentUser.stats.reviews.length} отзывов)</div>
            <div class="reputation-bar">
              <div class="reputation-fill" style="width: ${this.currentUser.reputation}%"></div>
            </div>
          </div>

          <nav class="nav-menu">
            <button class="nav-btn active" data-tab="market">📊 Рынок</button>
            <button class="nav-btn" data-tab="inventory">📦 Инвентарь</button>
            <button class="nav-btn" data-tab="shop">🔧 Магазин</button>
            <button class="nav-btn" data-tab="sales">💰 Мои продажи</button>
            <button class="nav-btn" data-tab="profile">👤 Профиль</button>
            <button class="nav-btn" data-tab="stats">📈 Статистика</button>
          </nav>

          <div class="auth-buttons">
            <button class="btn-secondary" onclick="app.toggleSounds()" id="soundToggle">🔊 Звуки ВКЛ</button>
            <button class="btn-secondary" onclick="app.logout()">🚪 Выход</button>
            <button class="btn-secondary" onclick="storage.exportSave()">💾 Сохранить</button>
          </div>
        </aside>

        <main class="main-content">
          <!-- РЫНОК -->
          <section id="market" class="tab-content active">
            <div class="section-header">
              <h2>📊 Доска объявлений</h2>
              <button class="btn-primary" onclick="app.refreshMarket()">🔄 Обновить</button>
            </div>
            <div class="market-grid" id="marketGrid"></div>
            <div class="pagination">
              <button class="btn-pagination" onclick="app.prevPage()">← Назад</button>
              <span class="page-info" id="pageInfo">Страница 1</span>
              <button class="btn-pagination" onclick="app.nextPage()">Далее →</button>
            </div>
          </section>

          <!-- ИНВЕНТАРЬ -->
          <section id="inventory" class="tab-content">
            <div class="section-header"><h2>📦 Инвентарь</h2></div>
            <div class="inventory-container">
              <h3>📱 Телефоны</h3>
              <div class="inventory-grid" id="phonesInventory"><p>Нет телефонов</p></div>
              <h3>🔧 Запчасти</h3>
              <div class="inventory-grid" id="partsInventory"><p>Нет запчастей</p></div>
            </div>
          </section>

          <!-- МАГАЗИН -->
          <section id="shop" class="tab-content">
            <div class="section-header"><h2>🔧 Магазин запчастей</h2></div>
            <div id="shopGrid"></div>
          </section>

          <!-- ПРОДАЖИ -->
          <section id="sales" class="tab-content">
            <div class="section-header"><h2>💰 Мои продажи</h2></div>
            <div id="salesList"></div>
          </section>

          <!-- ПРОФИЛЬ -->
          <section id="profile" class="tab-content">
            <div class="section-header"><h2>👤 Профиль</h2></div>
            <div id="profileContent"></div>
          </section>

          <!-- СТАТИСТИКА -->
          <section id="stats" class="tab-content">
            <div class="section-header"><h2>📈 Статистика</h2></div>
            <div id="statsContent"></div>
          </section>
        </main>

        <!-- МОДАЛЬНЫЕ ОКНА -->
        <div id="listingModal" class="modal">
          <div class="modal-content">
            <button class="modal-close" onclick="app.closeListing()">&times;</button>
            <div id="listingContent"></div>
          </div>
        </div>
      </div>

      <div id="notificationContainer" class="notification-container"></div>
    `;

    document.body.innerHTML = mainHTML;
    this.injectMainStyles();

    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audioManager.playTabSwitch();
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        e.target.classList.add('active');
        const tabId = e.target.dataset.tab;
        document.getElementById(tabId).classList.add('active');

        // Заполнить содержимое вкладки
        if (tabId === 'inventory') {
          audioManager.playPanelOpen();
          this.showInventory();
        }
        if (tabId === 'shop') {
          audioManager.playPanelOpen();
          this.showShop();
        }
        if (tabId === 'sales') {
          audioManager.playPanelOpen();
          this.showSales();
        }
        if (tabId === 'profile') {
          audioManager.playPanelOpen();
          this.showProfile();
        }
        if (tabId === 'stats') {
          audioManager.playPanelOpen();
          this.showStats();
        }
      });
    });

    // Загружаем рынок
    this.refreshMarket();
  }

  /**
   * Обновить рынок объявлений
   */
  refreshMarket() {
    audioManager.playButtonClick();
    this.currentPage = 0;
    const allListings = [];
    const brandNames = Object.keys(PHONES_DATABASE);

    // Генерируем 24 объявления
    for (let i = 0; i < 24; i++) {
      const brandName = brandNames[Math.floor(Math.random() * brandNames.length)];
      const brand = PHONES_DATABASE[brandName];
      const phone = brand[Math.floor(Math.random() * brand.length)];
      const listing = generateListing(phone.id, brandName);
      if (listing) allListings.push(listing);
    }

    // Сохраняем в localStorage
    const gameData = storage.getGameData();
    gameData.market.currentOffers = allListings;
    gameData.market.lastUpdate = new Date().toISOString();
    storage.saveGameData(gameData);

    this.displayMarket();
  }

  /**
   * Показать текущую страницу рынка
   */
  displayMarket() {
    const gameData = storage.getGameData();
    const listings = gameData.market.currentOffers;
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageListings = listings.slice(start, end);

    const grid = document.getElementById('marketGrid');
    grid.innerHTML = pageListings.map(listing => `
      <div class="listing-card" onclick="app.openListing('${listing.id}')">
        <div class="listing-image">
          <img src="${getPhoneImage(listing.phoneId)}" alt="${listing.phoneName}" 
               onerror="this.src='${generatePhonePlaceholder(listing.phoneName)}'">
          <span class="condition-badge condition-${listing.condition}">${this.getConditionLabel(listing.condition)}</span>
        </div>
        <div class="listing-info">
          <h4>${listing.phoneName}</h4>
          <p>${listing.brandName}</p>
          <div class="listing-price">${this.formatCurrency(listing.price)}</div>
        </div>
      </div>
    `).join('');

    document.getElementById('pageInfo').textContent = `Страница ${this.currentPage + 1} из ${Math.ceil(listings.length / this.itemsPerPage)}`;
  }

  /**
   * Открыть объявление
   */
  openListing(listingId) {
    audioManager.playSelectItem();
    const gameData = storage.getGameData();
    this.currentListing = gameData.market.currentOffers.find(l => l.id === listingId);
    
    if (!this.currentListing) return;

    const damagesList = this.currentListing.damages.map(d => `<span class="damage-tag">${d.name}</span>`).join('');
    const accessoriesList = this.currentListing.accessories.map(acc => {
      const accObj = ACCESSORIES.find(a => a.id === acc);
      return accObj ? `<span class="accessory-tag">✓ ${accObj.name}</span>` : '';
    }).join('');

    // Получаем рыночную цену
    const marketPrice = BotSystem.getMarketPrice(
      this.currentListing.phoneId,
      this.currentListing.brandName,
      this.currentListing.condition
    );
    
    // Проверяем, адекватна ли цена
    const priceRatio = this.currentListing.price / marketPrice;
    let priceWarning = '';
    let priceColor = '#00ff00'; // зелёный - нормальная цена
    
    if (priceRatio > 1.5) {
      priceWarning = '<p style="color: #ff4444; font-weight: bold;">⚠️ СИЛЬНО завышена! Боты не купят!</p>';
      priceColor = '#ff4444'; // красный - очень дорого
    } else if (priceRatio > 1.3) {
      priceWarning = '<p style="color: #ffaa00; font-weight: bold;">⚠️ Завышена. Только щедрые боты купят.</p>';
      priceColor = '#ffaa00'; // жёлтый - дорого
    } else if (priceRatio > 1.1) {
      priceWarning = '<p style="color: #ffaa00;">ℹ️ Немного выше рыночной цены</p>';
      priceColor = '#ffaa00';
    } else if (priceRatio < 0.7) {
      priceWarning = '<p style="color: #00ff00; font-weight: bold;">✅ Отличная цена! Боты скупят быстро!</p>';
      priceColor = '#00ff00';
    }

    const phoneImage = getPhoneImage(this.currentListing.phoneId);

    const content = `
      <img src="${phoneImage}" class="listing-image-modal" alt="${this.currentListing.phoneName}" onerror="this.src='${generatePhonePlaceholder(this.currentListing.phoneName)}'">
      <h2>${this.currentListing.phoneName}</h2>
      <p class="listing-seller">Продавец: ${this.currentListing.seller}</p>
      <p class="listing-condition">Состояние: ${this.getConditionLabel(this.currentListing.condition)}</p>
      
      <div class="price-analysis" style="background: rgba(255, 170, 0, 0.1); border: 2px solid #ffaa00; border-radius: 10px; padding: 15px; margin: 15px 0;">
        <h4 style="color: #ffaa00; margin: 0 0 10px 0;">📊 Анализ цены</h4>
        <p>Цена объявления: <span style="color: ${priceColor}; font-weight: bold;">${this.formatCurrency(this.currentListing.price)}</span></p>
        <p>Рыночная цена: <span style="color: #00d4ff; font-weight: bold;">${this.formatCurrency(marketPrice)}</span></p>
        <p>Соотношение: <span style="color: ${priceColor}; font-weight: bold;">${(priceRatio * 100).toFixed(0)}%</span></p>
        ${priceWarning}
      </div>
      
      <div class="damages-section">
        <h4>Дефекты:</h4>
        <div class="damages-list">${damagesList || '<p>Нет дефектов</p>'}</div>
      </div>

      <div class="accessories-section">
        <h4>Комплектация:</h4>
        <div class="accessories-list">${accessoriesList || '<p>Без комплектации</p>'}</div>
      </div>

      <div class="price-section">
        <div class="price-display">
          <span class="price-label">Цена продавца</span>
          <span class="price-value" style="color: ${priceColor};">${this.formatCurrency(this.currentListing.price)}</span>
        </div>

        <div class="buyer-section">
          <p style="color: #ffaa00; font-size: 0.9em; margin: 10px 0;">💡 По цене продавца (${this.formatCurrency(this.currentListing.price)}) - купи сразу. Ниже - торгуйся!</p>
          <input type="number" id="offerPrice" placeholder="Твое предложение" class="price-input" value="${this.currentListing.price}" step="100">
          <button class="btn-primary" onclick="app.buyPhone()">💳 Купить по цене</button>
          <button class="btn-secondary" onclick="app.negotiatePrice()">🤝 Торговаться</button>
        </div>
      </div>
    `;

    document.getElementById('listingContent').innerHTML = content;
    document.getElementById('listingModal').style.display = 'flex';
  }

  /**
   * Купить телефон по цене
   */
  buyPhone() {
    const offerPrice = parseInt(document.getElementById('offerPrice').value) || this.currentListing.price;
    const sellerPrice = this.currentListing.price;

    // Если цена равна цене продавца - можно купить сразу
    if (offerPrice === sellerPrice) {
      if (this.currentUser.balance < offerPrice) {
        audioManager.playError();
        this.showNotification('❌ Недостаточно средств!', 'error');
        return;
      }
      this._completePurchase(offerPrice);
      return;
    }

    // Если цена ниже - должен быть торг, не прямая покупка
    if (offerPrice < sellerPrice) {
      audioManager.playDeny();
      this.showNotification('❌ Используй кнопку "🤝 Торговаться" для предложения более низкой цены!', 'error');
      return;
    }

    // Если цена выше цены продавца - нельзя
    if (offerPrice > sellerPrice) {
      audioManager.playError();
      this.showNotification(`❌ Цена не может быть выше чем просит продавец (${this.formatCurrency(sellerPrice)})!`, 'error');
      return;
    }
  }

  /**
   * Завершить покупку (внутренний метод)
   */
  _completePurchase(offerPrice) {
    if (this.currentUser.balance < offerPrice) {
      this.showNotification('❌ Недостаточно средств!', 'error');
      return;
    }

    // Выполнить покупку
    const phone = {
      id: 'phone_' + Math.random().toString(36).substr(2, 9),
      phoneId: this.currentListing.phoneId,
      phoneName: this.currentListing.phoneName,
      brandName: this.currentListing.brandName,
      condition: this.currentListing.condition,
      damages: this.currentListing.damages,
      accessories: this.currentListing.accessories,
      purchasePrice: offerPrice,
      purchasedAt: new Date().toISOString()
    };

    // Обновить баланс
    this.currentUser.balance -= offerPrice;
    storage.updateBalance(this.currentUser.id, -offerPrice);
    storage.addPhoneToInventory(this.currentUser.id, phone);

    // Обновить статистику
    this.currentUser.stats.totalPurchases++;
    storage.updateStats(this.currentUser.id, this.currentUser.stats);

    // Удалить объявление с рынка
    const gameData = storage.getGameData();
    gameData.market.currentOffers = gameData.market.currentOffers.filter(l => l.id !== this.currentListing.id);
    storage.saveGameData(gameData);

    audioManager.playPurchase();
    audioManager.playSuccess();
    this.showNotification(`✅ Куплено: ${this.currentListing.phoneName} за ${this.formatCurrency(offerPrice)}`, 'success');
    document.getElementById('balanceDisplay').textContent = this.formatCurrency(this.currentUser.balance);
    this.closeListing();
    this.displayMarket();
  }

  /**
   * Торговаться
   */
  negotiatePrice() {
    const offerPrice = parseInt(document.getElementById('offerPrice').value);
    
    // Проверка: нельзя торговаться по цене продавца
    if (offerPrice >= this.currentListing.price) {
      audioManager.playError();
      this.showNotification('❌ Это уже цена продавца! Просто купи сразу.', 'error');
      return;
    }

    if (!offerPrice) {
      audioManager.playError();
      this.showNotification('❌ Введите предложенную цену!', 'error');
      return;
    }

    const result = negotiatePrice(this.currentListing.price, offerPrice);

    if (result.accepted) {
      audioManager.playSuccess();
      this.showNotification('✅ Продавец согласился!', 'success');
      setTimeout(() => this._completePurchase(offerPrice), 500);
    } else if (result.counterOffer) {
      audioManager.playNotification();
      this.showNotification(`Продавец предлагает ${this.formatCurrency(result.counterOffer)}`, 'info');
      document.getElementById('offerPrice').value = result.counterOffer;
    } else {
      audioManager.playDeny();
      this.showNotification('❌ ' + result.reason, 'error');
    }
  }

  /**
   * Закрыть объявление
   */
  closeListing() {
    audioManager.playPanelClose();
    document.getElementById('listingModal').style.display = 'none';
  }

  /**
   * Показать инвентарь
   */
  showInventory() {
    const user = storage.getCurrentUser();
    
    const phonesHTML = user.inventory.phones.map(p => `
      <div class="inventory-item">
        <img src="${getPhoneImage(p.phoneId)}" class="inventory-phone-image" alt="${p.phoneName}" onerror="this.src='https://via.placeholder.com/150x200/0f0f1e/00d4ff?text=${encodeURIComponent(p.phoneName)}'">
        <h4>${p.phoneName}</h4>
        <p>Куплено за: ${this.formatCurrency(p.purchasePrice)}</p>
        <p>Состояние: ${this.getConditionLabel(p.condition)}</p>
        <div class="inventory-buttons">
          <button class="btn-small" onclick="app.sellPhone('${p.id}')">Продать</button>
          <button class="btn-small" onclick="app.repairPhone('${p.id}')">Ремонт</button>
        </div>
      </div>
    `).join('') || '<p>Нет телефонов</p>';

    const partsHTML = Object.values(user.inventory.parts).map(p => `
      <div class="inventory-item">
        <h4>${p.name}</h4>
        <p>Бренд: ${p.brand}</p>
        <p>Количество: ${p.quantity}</p>
      </div>
    `).join('') || '<p>Нет запчастей</p>';

    document.getElementById('phonesInventory').innerHTML = phonesHTML;
    document.getElementById('partsInventory').innerHTML = partsHTML;
  }

  /**
   * Показать магазин запчастей
   */
  showShop() {
    const brandNames = Object.keys(PHONES_DATABASE);
    let shopHTML = '<div class="shop-container">';

    brandNames.slice(0, 10).forEach(brand => {
      const prices = getPartsPricesByBrand(brand);
      shopHTML += `<div class="brand-section">
        <h4>${brand}</h4>`;
      
      Object.entries(prices).forEach(([partId, price]) => {
        shopHTML += `
          <div class="part-item">
            <p>${partId}: ${this.formatCurrency(price)}</p>
            <input type="number" min="1" value="1" class="qty-input">
            <button class="btn-small" onclick="app.buyPart('${brand}', '${partId}', ${price})">Купить</button>
          </div>
        `;
      });
      
      shopHTML += '</div>';
    });

    shopHTML += '</div>';
    document.getElementById('shopGrid').innerHTML = shopHTML;
  }

  /**
   * Показать мои продажи
   */
  showSales() {
    const user = storage.getCurrentUser();
    const salesHTML = user.shopWindow.map(listing => `
      <div class="sale-item">
        <h4>${listing.phoneName}</h4>
        <p>Цена: ${this.formatCurrency(listing.price)}</p>
        <p>На витрине с: ${new Date(listing.listedAt).toLocaleDateString('ru')}</p>
        <button class="btn-small btn-danger" onclick="app.unlistPhone('${listing.id}')">Снять с продажи</button>
      </div>
    `).join('') || '<p>Нет телефонов на продажу</p>';

    document.getElementById('salesList').innerHTML = salesHTML;
  }

  /**
   * Показать профиль
   */
  showProfile() {
    const user = storage.getCurrentUser();
    const profileHTML = `
      <div class="profile-card">
        <h3>👤 ${user.login}</h3>
        <p>ID: ${user.id}</p>
        <hr>
        <h4>Статистика</h4>
        <p>Рейтинг: ⭐ ${user.stats.rating.toFixed(1)}</p>
        <p>Отзывов: ${user.stats.reviews.length}</p>
        <p>Репутация: ${user.reputation}/100</p>
        <p>Куплено: ${user.stats.totalPurchases}</p>
        <p>Продано: ${user.stats.totalSales}</p>
        <p>Заработано: ${this.formatCurrency(user.stats.totalProfit)}</p>
        
        <hr>
        <h4>Последние отзывы</h4>
        <div class="reviews-list">
          ${user.stats.reviews.slice(-5).reverse().map(r => `
            <div class="review-item">
              <span class="review-stars">${'⭐'.repeat(r.stars)}</span>
              <p>${r.text}</p>
            </div>
          `).join('') || '<p>Нет отзывов</p>'}
        </div>
      </div>
    `;

    document.getElementById('profileContent').innerHTML = profileHTML;
  }

  /**
   * Показать статистику
   */
  showStats() {
    const user = storage.getCurrentUser();
    const avgProfit = user.stats.totalSales > 0 ? Math.floor(user.stats.totalProfit / user.stats.totalSales) : 0;

    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h4>Всего сделок</h4>
          <div class="stat-big">${user.stats.totalPurchases + user.stats.totalSales}</div>
        </div>
        <div class="stat-card">
          <h4>Куплено</h4>
          <div class="stat-big">${user.stats.totalPurchases}</div>
        </div>
        <div class="stat-card">
          <h4>Продано</h4>
          <div class="stat-big">${user.stats.totalSales}</div>
        </div>
        <div class="stat-card">
          <h4>Заработано</h4>
          <div class="stat-big profit">${this.formatCurrency(user.stats.totalProfit)}</div>
        </div>
        <div class="stat-card">
          <h4>Средняя прибыль на сделку</h4>
          <div class="stat-big">${this.formatCurrency(avgProfit)}</div>
        </div>
        <div class="stat-card">
          <h4>Рейтинг</h4>
          <div class="stat-big">⭐ ${user.stats.rating.toFixed(1)}</div>
        </div>
      </div>
    `;

    document.getElementById('statsContent').innerHTML = statsHTML;
  }

  /**
   * Продать телефон
   */
  sellPhone(phoneId) {
    const price = prompt('Введи цену для продажи:');
    if (!price) {
      audioManager.playDeny();
      return;
    }

    const user = storage.getCurrentUser();
    const phone = user.inventory.phones.find(p => p.id === phoneId);
    
    if (phone) {
      // Создаем листинг
      const listing = storage.listPhoneForSale(user.id, phoneId, parseInt(price));
      if (listing) {
        // УДАЛЯЕМ телефон из инвентаря ДО выставки
        user.inventory.phones = user.inventory.phones.filter(p => p.id !== phoneId);
        
        // Сохраняем изменения в storage
        storage.saveGameData(storage.getGameData());
        
        audioManager.playSuccess();
        this.showNotification(`✅ Телефон выставлен на продажу за ${this.formatCurrency(parseInt(price))}`, 'success');
        this.showInventory();
      }
    }
  }

  /**
   * Снять с продажи
   */
  unlistPhone(listingId) {
    storage.unlistPhone(this.currentUser.id, listingId);
    audioManager.playButtonClick();
    this.showNotification('✅ Телефон снят с продажи', 'success');
    this.showSales();
  }

  /**
   * Отремонтировать телефон (заглушка)
   */
  repairPhone(phoneId) {
    this.showNotification('🔧 Функция ремонта скоро будет доступна!', 'info');
  }

  /**
   * Купить запчасть
   */
  buyPart(brand, partId, price) {
    if (this.currentUser.balance < price) {
      audioManager.playError();
      this.showNotification('❌ Недостаточно средств!', 'error');
      return;
    }

    this.currentUser.balance -= price;
    storage.updateBalance(this.currentUser.id, -price);
    storage.addPartToInventory(this.currentUser.id, partId, partId, brand, 1);

    audioManager.playMoneyLoss();
    audioManager.playSuccess();
    this.showNotification(`✅ Запчасть куплена за ${this.formatCurrency(price)}`, 'success');
  }

  /**
   * Перейти на предыдущую страницу
   */
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.displayMarket();
    }
  }

  /**
   * Перейти на следующую страницу
   */
  nextPage() {
    const gameData = storage.getGameData();
    const maxPage = Math.ceil(gameData.market.currentOffers.length / this.itemsPerPage);
    if (this.currentPage < maxPage - 1) {
      this.currentPage++;
      this.displayMarket();
    }
  }

  /**
   * Выйти из игры
   */
  logout() {
    audioManager.playError();
    storage.logout();
    location.reload();
  }

  /**
   * Переключить звуки
   */
  toggleSounds() {
    const enabled = audioManager.toggleSounds();
    const btn = document.getElementById('soundToggle');
    if (btn) {
      btn.textContent = enabled ? '🔊 Звуки ВКЛ' : '🔇 Звуки ВЫКЛ';
      if (enabled) {
        audioManager.playSuccess();
      }
    }
  }

  /**
   * Показать уведомление
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Форматировать валюту
   */
  formatCurrency(amount) {
    return amount.toLocaleString('ru-RU') + ' ₽';
  }

  /**
   * Получить название состояния
   */
  getConditionLabel(condition) {
    const labels = {
      'perfect': '🟢 Идеально',
      'good': '🟡 Хорошо',
      'fair': '🟠 Приемлемо',
      'poor': '🔴 Плохо',
      'critical': '⚫ Критическое'
    };
    return labels[condition] || condition;
  }

  /**
   * Обновить UI - вызывается когда боты покупают телефоны
   * Обновляет текущий активный раздел если это "Мои продажи" или "Инвентарь"
   */
  refreshUI() {
    // Ищем активную кнопку в навигации
    const activeButton = document.querySelector('.nav-btn.active');
    if (!activeButton) return;

    const tabName = activeButton.getAttribute('data-tab');
    
    // Обновляем текущий пользователя из хранилища (для актуальных данных)
    this.currentUser = storage.getCurrentUser();

    // Обновляем соответствующий раздел если он активный
    if (tabName === 'sales') {
      this.showSales();
    } else if (tabName === 'inventory') {
      this.showInventory();
    } else if (tabName === 'shop') {
      this.showShop();
    } else if (tabName === 'stats') {
      this.showStats();
    } else if (tabName === 'market') {
      this.displayMarket();
    }
  }

  /**
   * Инжектить стили авторизации
   */
  injectAuthStyles() {
    const style = `
      <style>
        * { box-sizing: border-box; }
        body { 
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          font-family: 'Segoe UI', Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .auth-container {
          width: 100%;
          max-width: 400px;
          padding: 20px;
        }
        .auth-box {
          background: rgba(30, 40, 60, 0.95);
          border: 2px solid #00d4ff;
          border-radius: 15px;
          padding: 30px;
          backdrop-filter: blur(10px);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .auth-header h1 {
          margin: 0;
          color: #00d4ff;
          font-size: 32px;
        }
        .auth-header p {
          margin: 10px 0 0 0;
          color: #00d4ff;
          opacity: 0.7;
        }
        .auth-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .auth-tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.3s;
        }
        .auth-tab.active {
          background: #00d4ff;
          color: #1a1a2e;
          font-weight: bold;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #00d4ff;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #00d4ff;
          background: rgba(0, 212, 255, 0.1);
          color: #fff;
          border-radius: 5px;
          font-size: 14px;
        }
        .btn-primary {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          border: none;
          color: #1a1a2e;
          font-weight: bold;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
        }
        .btn-large {
          padding: 15px !important;
          font-size: 18px !important;
          margin-top: 20px;
        }
        .btn-secondary {
          padding: 10px 15px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid #00d4ff;
          color: #00d4ff;
          cursor: pointer;
          border-radius: 5px;
          margin-top: 10px;
          width: 100%;
          transition: all 0.3s;
        }
        .btn-secondary:hover {
          background: rgba(0, 212, 255, 0.2);
        }
        .auth-footer {
          margin-top: 20px;
          text-align: center;
        }
        .auth-footer p {
          color: #00d4ff;
          margin: 0;
        }
        .import-export {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      </style>
    `;
    document.head.insertAdjacentHTML('beforeend', style);
  }

  /**
   * Инжектить главные стили
   */
  injectMainStyles() {
    // Стили загружаются из styles-modern.css
    // Этот метод оставлен для совместимости
  }
}

// Создать глобальный экземпляр игры
const app = new PhoneTycoonGame();
