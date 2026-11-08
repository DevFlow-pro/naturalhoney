document.addEventListener('DOMContentLoaded', () => {

    const SITE_UNIQUE_ID = 'honey_prod_2026';

    const STORAGE_KEY = `${SITE_UNIQUE_ID}_cart_v1`;
    const FAV_STORAGE_KEY = `${SITE_UNIQUE_ID}_favs_v1`;
    const SAVED_TABLE_KEY = `${SITE_UNIQUE_ID}_saved_table`;
    const SAVED_TABLE_TIME_KEY = `${SITE_UNIQUE_ID}_saved_table_time`;

    const WHATSAPP_NUMBER = '77002623400';

    let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let favorites = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY)) || [];

    // Логика столов из QR
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    let selectedTable = null;

    if (tableFromUrl) {
        localStorage.setItem(SAVED_TABLE_KEY, tableFromUrl);
        localStorage.setItem(SAVED_TABLE_TIME_KEY, Date.now().toString());
        selectedTable = tableFromUrl;
    } else {
        const savedTable = localStorage.getItem(SAVED_TABLE_KEY);
        const savedTime = parseInt(localStorage.getItem(SAVED_TABLE_TIME_KEY) || '0', 10);
        if (savedTable && (Date.now() - savedTime < 172800000)) {
            selectedTable = savedTable;
        } else {
            localStorage.removeItem(SAVED_TABLE_KEY);
            localStorage.removeItem(SAVED_TABLE_TIME_KEY);
        }
    }

    const cards = document.querySelectorAll('.info-card[data-id]');

    const orderBar = document.getElementById('order-bar');
    const barTotalPrice = document.getElementById('bar-total-price');
    const barItemsText = document.getElementById('bar-items-text');
    const whatsappBtn = document.getElementById('whatsapp-send-btn');

    const cartPopup = document.getElementById('cart-popup');
    const orderBarToggle = document.getElementById('order-bar-toggle');
    const closePopupBtn = document.getElementById('close-cart-popup');
    const cartPopupItems = document.getElementById('cart-popup-items');

    const favoritesToggleBtn = document.getElementById('favorites-toggle-btn');
    const favoritesPopup = document.getElementById('favorites-popup');
    const closeFavoritesPopup = document.getElementById('close-favorites-popup');
    const favoritesPopupItems = document.getElementById('favorites-popup-items');

    const favNameInput = document.getElementById('fav-name-input');
    const saveCurrentFavBtn = document.getElementById('save-current-fav-btn');
    const favBadge = document.getElementById('fav-badge');

    const openSaveFavPanelBtn = document.getElementById('open-save-fav-panel-btn');
    const saveFavInputPanel = document.getElementById('save-fav-input-panel');
    const saveFavNameInput = document.getElementById('save-fav-name-input');
    const confirmSaveFavBtn = document.getElementById('confirm-save-fav-btn');

    // Кнопка "Наверх" и логика её позиции
    const toTopBtn = document.getElementById('toTopBtn');

    function updateToTopPosition() {
        if (!toTopBtn) return;
        const isFavActive = favoritesPopup && favoritesPopup.classList.contains('active');
        const isCartActive = cartPopup && cartPopup.classList.contains('active');
        if (window.innerWidth <= 767 && (isFavActive || isCartActive)) {
            toTopBtn.style.bottom = '200px';
        } else {
            toTopBtn.style.bottom = '';
        }
    }

    if (toTopBtn) {
        window.addEventListener('scroll', () => {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                toTopBtn.classList.add('visible');
            } else {
                toTopBtn.classList.remove('visible');
            }
        });
        toTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    window.addEventListener('resize', updateToTopPosition);

    // Модальное окно проверки заказа
    const orderConfirmModal = document.createElement('div');
    orderConfirmModal.id = 'order-confirm-modal';
    orderConfirmModal.className = 'cart-popup';
    orderConfirmModal.style.zIndex = '2000';
    orderConfirmModal.innerHTML = `
        <div class="cart-popup-header">
            <h3>Детали заказа</h3>
            <button id="close-confirm-modal" class="close-popup-btn">×</button>
        </div>
        <p style="font-size: 13px; color: #78716c; margin-bottom: 12px;">Проверьте ваш заказ, при необходимости измените количество или сохраните в избранное:</p>
        <div id="confirm-modal-items" class="cart-popup-items" style="margin-bottom: 15px;"></div>
        
        <div style="margin-bottom: 15px; display: flex; gap: 8px; align-items: center; background: #fffbeb; padding: 10px; border-radius: 12px; border: 1px solid #fef08a; flex-wrap: wrap;">
            <input type="text" id="confirm-modal-fav-name-input" placeholder="Название набора" class="fav-input" style="background: #fff; min-width: 120px; flex: 1;">
            <button id="confirm-modal-save-fav-btn" class="fav-save-btn" style="white-space: nowrap; padding: 8px 12px; font-size: 12px;">⭐ Сохранить</button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #fef08a; padding-top: 10px; flex-wrap: wrap; gap: 10px;">
            <span style="font-size: 15px; font-weight: 700; color: #713f12;">Итого: <strong id="confirm-total-price" style="color: #ca8a04;">0 ₸</strong></span>
            <button id="confirm-whatsapp-final-btn" class="whatsapp-btn" style="padding: 10px 20px;">
                <span class="wa-text">Отправить в WhatsApp</span>
                <span class="wa-icon">➔</span>
            </button>
        </div>
    `;
    document.body.appendChild(orderConfirmModal);

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'modal-backdrop';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1999;
        display: none;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(modalBackdrop);

    const closeConfirmModalBtn = document.getElementById('close-confirm-modal');
    const confirmModalItems = document.getElementById('confirm-modal-items');
    const confirmTotalPrice = document.getElementById('confirm-total-price');
    const confirmWhatsappFinalBtn = document.getElementById('confirm-whatsapp-final-btn');
    const confirmModalFavNameInput = document.getElementById('confirm-modal-fav-name-input');
    const confirmModalSaveFavBtn = document.getElementById('confirm-modal-save-fav-btn');

    // Универсальный formatWeight
    function formatWeight(weight) {
        return String(weight).replace('.', ',') + ' кг';
    }

    function getCartKey(id, weight) {
        return `${id}_${weight}`;
    }

    function getCartItems() {
        const items = [];
        cards.forEach(card => {
            const id = card.dataset.id;
            const name = card.dataset.name;
            const weightOptions = card.querySelectorAll('.weight-option');

            weightOptions.forEach(option => {
                const weight = option.dataset.weight;
                const price = parseInt(option.dataset.price);
                const key = getCartKey(id, weight);
                const qty = cart[key] || 0;

                if (qty > 0) {
                    items.push({ id, name, weight, price, qty, key });
                }
            });
        });
        return items;
    }

    function updateUI() {
        let totalSum = 0;
        let totalCount = 0;
        let itemsSummaryArray = [];
        let popupHtml = '';

        cards.forEach(card => {
            const id = card.dataset.id;
            const weightOptions = card.querySelectorAll('.weight-option');

            weightOptions.forEach(option => {
                const weight = option.dataset.weight;
                const key = getCartKey(id, weight);
                const qty = cart[key] || 0;
                const countSpan = option.querySelector('.cnt-value');
                if (countSpan) countSpan.textContent = qty;
            });
        });

        getCartItems().forEach(item => {
            const itemSum = item.price * item.qty;
            totalSum += itemSum;
            totalCount += item.qty;

            itemsSummaryArray.push(`${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            popupHtml += `
                <div class="popup-item-row">
                    <div class="popup-item-info">
                        <span class="popup-item-name">${item.name}</span>
                        <span class="popup-item-price">
                            ${formatWeight(item.weight)} — ${item.price} ₸ × ${item.qty} = <strong>${itemSum} ₸</strong>
                        </span>
                    </div>
                    <div class="popup-item-controls">
                        <div class="counter-box">
                            <button class="cnt-btn popup-minus" data-key="${item.key}">-</button>
                            <span class="cnt-value">${item.qty}</span>
                            <button class="cnt-btn popup-plus" data-key="${item.key}">+</button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (cartPopupItems) {
            cartPopupItems.innerHTML = popupHtml || '<p style="text-align:center; color:#78716c; padding:10px;">Корзина пуста</p>';
            attachPopupListeners();
        }

        if (barTotalPrice) {
            barTotalPrice.textContent = totalSum + ' ₸';
        }

        if (totalCount > 0) {
            if (barItemsText) barItemsText.textContent = itemsSummaryArray.join(', ');
            if (orderBar) orderBar.classList.remove('hidden');
        } else {
            if (orderBar) orderBar.classList.add('hidden');
            if (cartPopup) cartPopup.classList.remove('active');
            if (saveFavInputPanel) saveFavInputPanel.classList.add('hidden');
            closeOrderConfirmModal();
        }

        updateFavoritesUI();
        updateToTopPosition();

        if (orderConfirmModal.classList.contains('active')) {
            updateConfirmModalContent();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    function updateFavoritesUI() {
        if (!favBadge) return;
        if (favorites.length > 0) {
            favBadge.textContent = favorites.length;
            favBadge.classList.remove('hidden');
        } else {
            favBadge.classList.add('hidden');
        }

        if (favoritesPopupItems) {
            let html = '';
            if (favorites.length === 0) {
                html = '<p style="text-align:center; color:#78716c; padding:10px;">Нет сохраненных заказов</p>';
            } else {
                favorites.forEach((fav, index) => {
                    html += `
                        <div class="fav-item-row">
                            <div class="fav-item-info">
                                <span class="fav-item-name">${fav.name}</span>
                                <span class="fav-item-desc">${fav.summary} (${fav.total} ₸)</span>
                            </div>
                            <div class="fav-actions">
                                <button class="fav-load-btn" data-index="${index}">Выбрать</button>
                                <button class="fav-del-btn" data-index="${index}">✕</button>
                            </div>
                        </div>
                    `;
                });
            }
            favoritesPopupItems.innerHTML = html;
            attachFavoritesListeners();
        }
    }

    cards.forEach(card => {
        const id = card.dataset.id;
        const weightOptions = card.querySelectorAll('.weight-option');

        weightOptions.forEach(option => {
            const weight = option.dataset.weight;
            const key = getCartKey(id, weight);
            const plusBtn = option.querySelector('.plus');
            const minusBtn = option.querySelector('.minus');

            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    cart[key] = (cart[key] || 0) + 1;
                    updateUI();
                });
            }

            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    if (cart[key] > 0) {
                        cart[key]--;
                        if (cart[key] === 0) delete cart[key];
                        updateUI();
                    }
                });
            }
        });
    });

    function attachPopupListeners() {
        if (!cartPopupItems) return;
        cartPopupItems.querySelectorAll('.popup-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                cart[key] = (cart[key] || 0) + 1;
                updateUI();
            });
        });
        cartPopupItems.querySelectorAll('.popup-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (cart[key] > 0) {
                    cart[key]--;
                    if (cart[key] === 0) delete cart[key];
                    updateUI();
                }
            });
        });
    }

    function openOrderConfirmModal() {
        const cartItems = getCartItems();
        if (cartItems.length === 0) {
            alert('Корзина пуста!');
            return;
        }
        if (cartPopup) cartPopup.classList.remove('active');
        if (favoritesPopup) favoritesPopup.classList.remove('active');

        updateConfirmModalContent();
        modalBackdrop.style.display = 'block';
        orderConfirmModal.classList.add('active');
        updateToTopPosition();
    }

    function closeOrderConfirmModal() {
        orderConfirmModal.classList.remove('active');
        modalBackdrop.style.display = 'none';
        updateToTopPosition();
    }

    function updateConfirmModalContent() {
        const cartItems = getCartItems();
        let html = '';
        let totalSum = 0;

        if (cartItems.length === 0) {
            closeOrderConfirmModal();
            return;
        }

        cartItems.forEach(item => {
            const itemSum = item.price * item.qty;
            totalSum += itemSum;
            html += `
                <div class="popup-item-row">
                    <div class="popup-item-info">
                        <span class="popup-item-name">${item.name}</span>
                        <span class="popup-item-price">${formatWeight(item.weight)} — ${item.price} ₸ × ${item.qty} = <strong>${itemSum} ₸</strong></span>
                    </div>
                    <div class="popup-item-controls">
                        <div class="counter-box">
                            <button class="cnt-btn confirm-minus" data-key="${item.key}">-</button>
                            <span class="cnt-value">${item.qty}</span>
                            <button class="cnt-btn confirm-plus" data-key="${item.key}">+</button>
                        </div>
                    </div>
                </div>
            `;
        });

        confirmModalItems.innerHTML = html;
        confirmTotalPrice.textContent = totalSum + ' ₸';

        confirmModalItems.querySelectorAll('.confirm-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                cart[key] = (cart[key] || 0) + 1;
                updateUI();
            });
        });

        confirmModalItems.querySelectorAll('.confirm-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                if (cart[key] > 0) {
                    cart[key]--;
                    if (cart[key] === 0) delete cart[key];
                    updateUI();
                }
            });
        });
    }

    if (closeConfirmModalBtn) {
        closeConfirmModalBtn.addEventListener('click', closeOrderConfirmModal);
    }
    modalBackdrop.addEventListener('click', closeOrderConfirmModal);

    if (confirmModalSaveFavBtn) {
        confirmModalSaveFavBtn.addEventListener('click', () => {
            const cartItems = getCartItems();
            if (cartItems.length === 0) {
                alert('Корзина пуста!');
                return;
            }
            let customName = confirmModalFavNameInput.value.trim() || `Набор #${favorites.length + 1}`;
            const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
            const summaryArr = cartItems.map(item => `${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            favorites.push({
                name: customName,
                summary: summaryArr.join(', '),
                total: totalSum,
                cartData: { ...cart }
            });

            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            confirmModalFavNameInput.value = '';
            updateFavoritesUI();
            alert('Заказ успешно сохранен в избранное! ⭐');
        });
    }

    function attachFavoritesListeners() {
        if (!favoritesPopupItems) return;
        favoritesPopupItems.querySelectorAll('.fav-load-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                cart = { ...favorites[index].cartData };
                favoritesPopup.classList.remove('active');
                updateUI();
            });
        });
        favoritesPopupItems.querySelectorAll('.fav-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                favorites.splice(index, 1);
                localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
                updateFavoritesUI();
            });
        });
    }

    if (orderBarToggle && cartPopup) {
        orderBarToggle.addEventListener('click', () => {
            if (favoritesPopup) favoritesPopup.classList.remove('active');
            cartPopup.classList.toggle('active');
            if (!cartPopup.classList.contains('active') && saveFavInputPanel) {
                saveFavInputPanel.classList.add('hidden');
            }
            updateToTopPosition();
        });
    }

    if (closePopupBtn && cartPopup) {
        closePopupBtn.addEventListener('click', () => {
            cartPopup.classList.remove('active');
            if (saveFavInputPanel) saveFavInputPanel.classList.add('hidden');
            updateToTopPosition();
        });
    }

    if (favoritesToggleBtn && favoritesPopup) {
        favoritesToggleBtn.addEventListener('click', () => {
            if (cartPopup) cartPopup.classList.remove('active');
            favoritesPopup.classList.toggle('active');
            updateToTopPosition();
        });
    }

    if (closeFavoritesPopup && favoritesPopup) {
        closeFavoritesPopup.addEventListener('click', () => {
            favoritesPopup.classList.remove('active');
            updateToTopPosition();
        });
    }

    if (saveCurrentFavBtn) {
        saveCurrentFavBtn.addEventListener('click', () => {
            const totalCount = getCartItems().reduce((sum, item) => sum + item.qty, 0);
            if (totalCount === 0) {
                alert('Корзина пуста, нечего сохранять!');
                return;
            }
            let customName = favNameInput.value.trim() || `Набор #${favorites.length + 1}`;
            const cartItems = getCartItems();
            const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
            const summaryArr = cartItems.map(item => `${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            favorites.push({
                name: customName,
                summary: summaryArr.join(', '),
                total: totalSum,
                cartData: { ...cart }
            });

            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            favNameInput.value = '';
            updateFavoritesUI();
            alert('Заказ успешно сохранен в избранное! ⭐');
        });
    }

    if (confirmWhatsappFinalBtn) {
        confirmWhatsappFinalBtn.addEventListener('click', () => {
            const cartItems = getCartItems();
            if (cartItems.length === 0) {
                alert('Корзина пуста!');
                return;
            }

            let message = "Здравствуйте! Хочу сделать заказ:\n";
            if (selectedTable) {
                message += `🪑 Стол №${selectedTable}\n`;
            }
            message += "\n";

            let totalSum = 0;
            cartItems.forEach(item => {
                const sum = item.price * item.qty;
                totalSum += sum;
                message += `▪️ ${item.name} — ${formatWeight(item.weight)}, ${item.qty} шт. (${sum} ₸)\n`;
            });

            message += `\n📦 Итого к оплате: ${totalSum} ₸`;

            const encodedMessage = encodeURIComponent(message);
            const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

            closeOrderConfirmModal();
            window.open(waURL, '_blank');
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openOrderConfirmModal();
        });
    }

    if (openSaveFavPanelBtn && saveFavInputPanel) {
        openSaveFavPanelBtn.addEventListener('click', () => {
            saveFavInputPanel.classList.toggle('hidden');
            if (!saveFavInputPanel.classList.contains('hidden')) {
                saveFavNameInput.focus();
            }
        });
    }

    if (confirmSaveFavBtn) {
        confirmSaveFavBtn.addEventListener('click', () => {
            const cartItems = getCartItems();
            if (cartItems.length === 0) {
                alert('Корзина пуста, нечего сохранять!');
                return;
            }

            let customName = saveFavNameInput.value.trim() || `Набор #${favorites.length + 1}`;
            const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
            const summaryArr = cartItems.map(item => `${item.name} — ${formatWeight(item.weight)} x${item.qty}`);

            favorites.push({
                name: customName,
                summary: summaryArr.join(', '),
                total: totalSum,
                cartData: { ...cart }
            });

            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
            saveFavNameInput.value = '';
            saveFavInputPanel.classList.add('hidden');
            updateFavoritesUI();
            alert('Заказ успешно сохранен в избранное! ⭐');
        });
    }

    updateUI();

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const images = document.querySelectorAll('.info-card img');

    if (lightbox) {
        images.forEach(img => {
            img.addEventListener('click', () => {
                lightbox.classList.add('active');
                lightboxImg.src = img.src;
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                lightbox.classList.remove('active');
            });
        }

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
    }

});