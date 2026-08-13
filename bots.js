// ========================
// СИСТЕМА БОТОВ И ОТЗЫВОВ
// ========================

class BotSystem {
  /**
   * Генерирует отзыв от бота после продажи
   */
  static generateReview(salePrice, marketPrice, phoneCondition, sellerReputation, timeOnShelf) {
    let score = 0;

    // Влияние цены (основной фактор)
    const priceRatio = salePrice / marketPrice;
    if (priceRatio < 0.7) {
      score += 3; // Отличная цена
    } else if (priceRatio < 0.85) {
      score += 2; // Хорошая цена
    } else if (priceRatio <= 1.0) {
      score += 0; // Нормальная цена
    } else if (priceRatio <= 1.1) {
      score -= 1; // Немного дороже
    } else {
      score -= 3; // Намного дороже
    }

    // Влияние состояния телефона
    const damageCount = phoneCondition.damages ? phoneCondition.damages.length : 0;
    if (damageCount === 0) {
      score += 2; // Идеальное состояние
    } else if (damageCount <= 2) {
      score += 0; // Приемлемое состояние
    } else {
      score -= 2; // Много проблем
    }

    // Влияние времени на витрине (в часах игры, примерно)
    if (timeOnShelf < 1) {
      score += 1; // Быстрая продажа - боты любят популярные товары
    } else if (timeOnShelf < 5) {
      score += 0; // Нормальное время
    } else {
      score -= 1; // Долгое время - может быть проблема с ценой
    }

    // Влияние репутации продавца (даёт небольшой бонус)
    if (sellerReputation > 75) {
      score += 1; // Высокая репутация даёт доверие
    } else if (sellerReputation < 30) {
      score -= 1; // Низкая репутация вызывает недоверие
    }

    // Случайный фактор (±1)
    score += Math.floor(Math.random() * 3) - 1;

    // Преобразуем скор в звёзды
    let stars = 3; // Нейтральная оценка по умолчанию
    if (score >= 5) {
      stars = 5;
    } else if (score >= 3) {
      stars = 4;
    } else if (score >= 1) {
      stars = 3;
    } else if (score >= -2) {
      stars = 2;
    } else {
      stars = 1;
    }

    // Текст отзыва в зависимости от оценки
    const reviewTexts = {
      5: [
        'Отличный продавец! Всё честно и быстро. Буду покупать ещё!',
        'Супер! Цена, качество, скорость доставки - всё на высоте!',
        'Спасибо за честность! Телефон даже лучше, чем ожидал.',
        'Рекомендую! Надёжный продавец с хорошей репутацией.'
      ],
      4: [
        'Хорошая сделка, без нареканий. Спасибо!',
        'Всё понравилось. Можно было бы чуть дешевле, но в целом хорошо.',
        'Честный продавец. Буду рекомендовать друзьям.',
        'Довольны покупкой. Вполне адекватная цена.'
      ],
      3: [
        'Всё нормально, но могло бы быть и лучше.',
        'Цена соответствует качеству. Ничего особенного.',
        'Среднее впечатление. Пойдёт, но не выдающееся.',
        'Как-то так... ничего хорошего и ничего плохого.'
      ],
      2: [
        'Цена завышена, телефон не совсем соответствует описанию.',
        'Ожидал большего за такую цену. Есть претензии.',
        'Обидно, что скрывали состояние телефона.',
        'Не стоит переплачивать у этого продавца.'
      ],
      1: [
        'Ужасный опыт! Телефон совсем не такой, как описано. Не рекомендую!',
        'Потратил деньги впустую. Продавец нечестный.',
        'Больше не буду покупать у этого человека. Полный обман.',
        'Кошмар! Цена завышена, качество ниже плинтуса.'
      ]
    };

    const textList = reviewTexts[stars];
    const reviewText = textList[Math.floor(Math.random() * textList.length)];

    return {
      stars: stars,
      text: reviewText,
      score: score,
      date: new Date().toISOString()
    };
  }

  /**
   * Получить рандомного бота из списка
   */
  static getRandomBot() {
    const gameData = storage.getGameData();
    const bots = gameData.bots;
    return bots[Math.floor(Math.random() * bots.length)];
  }

  /**
   * Симулировать "посещение" витрины продавца ботом
   * Возвращает, хочет ли бот что-то купить
   */
  static botVisitShop(userId) {
    const gameData = storage.getGameData();
    const user = gameData.users.find(u => u.id === userId);
    const bot = this.getRandomBot();

    if (!user || user.shopWindow.length === 0) {
      return { interested: false };
    }

    // Вероятность того, что боту что-то понравится зависит от:
    // 1. Скорости реакции бота
    // 2. Репутации продавца (высокая репутация привлекает)
    // 3. Количества товаров на витрине

    const reputationBonus = user.reputation / 100; // 0-1
    const baseInterestChance = 0.5 + reputationBonus * 0.3 + bot.speed * 0.1;
    
    if (Math.random() > baseInterestChance) {
      return { interested: false };
    }

    // Боту что-то понравилось. Выбираем рандомный телефон
    const listing = user.shopWindow[Math.floor(Math.random() * user.shopWindow.length)];
    
    return {
      interested: true,
      bot: bot,
      listing: listing,
      listing_id: listing.id
    };
  }

  /**
   * Генерирует предложение от бота
   */
  static generateBotOffer(listing, bot, marketPrice, sellerReputation) {
    let offerPrice = listing.price;

    // Щедрость бота: может предложить выше или ниже цены
    const generosityFactor = bot.generosity * 2 - 1; // -1 до 1
    
    if (generosityFactor > 0) {
      // Щедрый бот может предложить выше
      offerPrice = Math.floor(listing.price * (1 + generosityFactor * 0.15));
    } else if (generosityFactor < 0) {
      // Скупой бот попытается торговаться
      offerPrice = Math.floor(listing.price * (1 + generosityFactor * 0.20));
    }

    // Требовательность бота к состоянию
    if (bot.pickiness > 0.7) {
      // Очень требовательный бот может требовать скидку если есть дефекты
      const damageCount = listing.damages ? listing.damages.length : 0;
      if (damageCount > 0) {
        offerPrice = Math.floor(offerPrice * (1 - damageCount * 0.05));
      }
    }

    // Высокая репутация продавца влияет на готовность платить больше
    const reputationBonus = 1 + (sellerReputation - 50) / 500; // от 0.9 до 1.1
    offerPrice = Math.floor(offerPrice * reputationBonus);

    return {
      offerPrice: Math.max(offerPrice, marketPrice * 0.5), // Не ниже 50% от рыночной цены
      acceptanceChance: 0.5 + bot.generosity * 0.3
    };
  }

  /**
   * Проверить, разумна ли цена объявления
   * Если цена слишком завышена - бот не купит
   */
  static isPriceReasonable(listingPrice, basePrice, bot) {
    const priceRatio = listingPrice / basePrice;
    
    // Если цена больше чем базовая + 50% - очень дорого
    if (priceRatio > 1.5) {
      return false;
    }
    
    // Если цена больше чем базовая + 30% - дорого, но требовательный бот может согласиться
    if (priceRatio > 1.3) {
      // Только щедрые боты (generosity > 0.7) согласятся
      return bot.generosity > 0.7;
    }
    
    // Если цена больше чем базовая + 20% - разумная цена
    if (priceRatio > 1.2) {
      // Боты со средней щедростью согласятся
      return bot.generosity > 0.4;
    }
    
    // Если цена до 120% от базовой - хорошая цена, почти все согласятся
    return true;
  }

  /**
   * Получить рыночную цену телефона по его ID и состоянию
   */
  static getMarketPrice(phoneId, brandName, condition) {
    // Находим базовую цену телефона
    const brand = PHONES_DATABASE[brandName];
    if (!brand) return 50000; // Fallback
    
    const phone = brand.find(p => p.id === phoneId);
    if (!phone) return 50000;
    
    const basePrice = phone.basePrice;
    
    // Применяем множитель состояния
    const conditionMultipliers = {
      'perfect': 0.95,
      'good': 0.80,
      'fair': 0.55,
      'poor': 0.30,
      'critical': 0.10
    };
    
    const multiplier = conditionMultipliers[condition] || 0.5;
    return Math.floor(basePrice * multiplier);
  }

  /**
   * Симулировать автоматическую продажу у ботов
   * Вызывается периодически в фоне
   */
  static runBotSimulation() {
    const gameData = storage.getGameData();

    // Для каждого пользователя с витриной
    gameData.users.forEach(user => {
      if (user.shopWindow.length > 0) {
        // 30% вероятность того, что в этот момент посетит бот
        if (Math.random() < 0.3) {
          const botVisit = this.botVisitShop(user.id);
          
          if (botVisit.interested) {
            // Боту понравилось, проверяем разумность цены
            const marketPrice = this.getMarketPrice(
              botVisit.listing.phoneId,
              botVisit.listing.brandName,
              botVisit.listing.condition
            );
            
            // ✅ ПРОВЕРКА: Цена разумна?
            if (!this.isPriceReasonable(botVisit.listing.price, marketPrice, botVisit.bot)) {
              // Цена слишком завышена - бот не купит
              console.log(`❌ Бот ${botVisit.bot.name} отказал ${botVisit.listing.phoneName} (цена ${botVisit.listing.price} > рынок ${marketPrice})`);
              return;
            }
            
            // Цена нормальная, генерируем предложение
            const offer = this.generateBotOffer(
              botVisit.listing,
              botVisit.bot,
              marketPrice,
              user.reputation
            );

            // Если цена приемлема, боту может понравиться
            if (Math.random() < offer.acceptanceChance) {
              // Продажа состоялась!
              const salePrice = botVisit.listing.price;
              
              // Добавляем прибыль продавцу
              user.balance += salePrice;
              user.stats.totalSales++;
              user.stats.totalProfit += (salePrice - marketPrice); // Дополнительная статистика
              
              // Генерируем отзыв
              const review = this.generateReview(
                salePrice,
                marketPrice,
                botVisit.listing,
                user.reputation,
                0.5 // примерное время на витрине
              );

              user.stats.reviews.push(review);
              
              // Пересчитываем рейтинг
              const avgRating = user.stats.reviews.reduce((sum, r) => sum + r.stars, 0) / user.stats.reviews.length;
              user.stats.rating = Math.round(avgRating * 10) / 10;
              user.reputation = Math.max(0, Math.min(100, 50 + user.stats.rating * 5));

              // ✅ УДАЛЯЕМ из витрины (ВАЖНО!)
              user.shopWindow = user.shopWindow.filter(l => l.id !== botVisit.listing_id);
              
              console.log(`✅ Бот ${botVisit.bot.name} купил ${botVisit.listing.phoneName} за ${salePrice} (рынок: ${marketPrice})`);
            }
          }
        }
      }
    });

    // Сохраняем обновленные данные
    storage.saveGameData(gameData);
  }
}

// Запускать симуляцию ботов каждые 5 секунд
setInterval(() => BotSystem.runBotSimulation(), 5000);
