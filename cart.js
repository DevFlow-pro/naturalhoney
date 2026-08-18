document.addEventListener('DOMContentLoaded', () => {

    const WHATSAPP_NUMBER = '77074242531';

    const STORAGE_KEY = 'honey_shop_cart_v2';
    const FAV_STORAGE_KEY = 'honey_shop_favs_v2';

    let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let favorites = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY)) || [];


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


    function formatWeight(weight) {

        return weight === '1.5'
            ? '1,5 кг'
            : `${weight} кг`;

    }


    function getCartKey(id, weight) {

        return `${id}_${weight}`;

    }


    function getCartItems() {

        const items = [];

        cards.forEach(card => {

            const id = card.dataset.id;
            const name = card.dataset.name;

            const weightOptions =
                card.querySelectorAll('.weight-option');


            weightOptions.forEach(option => {

                const weight = option.dataset.weight;
                const price = parseInt(option.dataset.price);

                const key = getCartKey(id, weight);

                const qty = cart[key] || 0;


                if (qty > 0) {

                    items.push({

                        id,
                        name,
                        weight,
                        price,
                        qty,
                        key

                    });

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


        /*
         * Обновляем счётчики
         * непосредственно в карточках товаров
         */

        cards.forEach(card => {

            const id = card.dataset.id;

            const weightOptions =
                card.querySelectorAll('.weight-option');


            weightOptions.forEach(option => {

                const weight = option.dataset.weight;

                const key = getCartKey(id, weight);

                const qty = cart[key] || 0;

                const countSpan =
                    option.querySelector('.cnt-value');


                if (countSpan) {

                    countSpan.textContent = qty;

                }

            });

        });


        /*
         * Формируем содержимое корзины
         */

        getCartItems().forEach(item => {

            const itemSum = item.price * item.qty;

            totalSum += itemSum;
            totalCount += item.qty;


            itemsSummaryArray.push(
                `${item.name} — ${formatWeight(item.weight)} x${item.qty}`
            );


            popupHtml += `

                <div class="popup-item-row">

                    <div class="popup-item-info">

                        <span class="popup-item-name">
                            ${item.name}
                        </span>

                        <span class="popup-item-price">
                            ${formatWeight(item.weight)}
                            — ${item.price} ₸ × ${item.qty}
                            =
                            <strong>${itemSum} ₸</strong>
                        </span>

                    </div>


                    <div class="popup-item-controls">

                        <div class="counter-box">

                            <button
                                class="cnt-btn popup-minus"
                                data-key="${item.key}"
                            >
                                -
                            </button>

                            <span class="cnt-value">
                                ${item.qty}
                            </span>

                            <button
                                class="cnt-btn popup-plus"
                                data-key="${item.key}"
                            >
                                +
                            </button>

                        </div>

                    </div>

                </div>

            `;

        });


        /*
         * Обновляем popup корзины
         */

        if (cartPopupItems) {

            cartPopupItems.innerHTML =
                popupHtml ||
                '<p style="text-align:center; color:#78716c; padding:10px;">Корзина пуста</p>';

            attachPopupListeners();

        }


        /*
         * Общая сумма
         */

        if (barTotalPrice) {

            barTotalPrice.textContent =
                totalSum + ' ₸';

        }


        /*
         * Нижняя панель заказа
         */

        if (totalCount > 0) {

            if (barItemsText) {

                barItemsText.textContent =
                    itemsSummaryArray.join(', ');

            }

            if (orderBar) {

                orderBar.classList.remove('hidden');

            }

        } else {

            if (orderBar) {

                orderBar.classList.add('hidden');

            }

            if (cartPopup) {

                cartPopup.classList.remove('active');

            }

        }


        updateFavoritesUI();


        /*
         * Сохраняем корзину
         */

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(cart)
        );

    }


    function updateFavoritesUI() {

        if (!favBadge) return;


        /*
         * Счётчик избранных заказов
         */

        if (favorites.length > 0) {

            favBadge.textContent =
                favorites.length;

            favBadge.classList.remove('hidden');

        } else {

            favBadge.classList.add('hidden');

        }


        if (favoritesPopupItems) {

            let html = '';


            if (favorites.length === 0) {

                html =
                    '<p style="text-align:center; color:#78716c; padding:10px;">Нет сохраненных заказов</p>';

            } else {

                favorites.forEach((fav, index) => {

                    html += `

                        <div class="fav-item-row">

                            <div class="fav-item-info">

                                <span class="fav-item-name">
                                    ${fav.name}
                                </span>

                                <span class="fav-item-desc">
                                    ${fav.summary}
                                    (${fav.total} ₸)
                                </span>

                            </div>


                            <div class="fav-actions">

                                <button
                                    class="fav-load-btn"
                                    data-index="${index}"
                                >
                                    Выбрать
                                </button>

                                <button
                                    class="fav-del-btn"
                                    data-index="${index}"
                                >
                                    ✕
                                </button>

                            </div>

                        </div>

                    `;

                });

            }


            favoritesPopupItems.innerHTML = html;

            attachFavoritesListeners();

        }

    }


    /*
     * Кнопки + и - у каждого веса
     */

    cards.forEach(card => {

        const id = card.dataset.id;

        const weightOptions =
            card.querySelectorAll('.weight-option');


        weightOptions.forEach(option => {

            const weight = option.dataset.weight;

            const key =
                getCartKey(id, weight);


            const plusBtn =
                option.querySelector('.plus');

            const minusBtn =
                option.querySelector('.minus');


            /*
             * +
             */

            if (plusBtn) {

                plusBtn.addEventListener('click', () => {

                    cart[key] =
                        (cart[key] || 0) + 1;

                    updateUI();

                });

            }


            /*
             * -
             */

            if (minusBtn) {

                minusBtn.addEventListener('click', () => {

                    if (cart[key] > 0) {

                        cart[key]--;

                        if (cart[key] === 0) {

                            delete cart[key];

                        }

                        updateUI();

                    }

                });

            }

        });

    });


    /*
     * Кнопки + и - внутри корзины
     */

    function attachPopupListeners() {

        if (!cartPopupItems) return;


        const popupPlusBtns =
            cartPopupItems.querySelectorAll('.popup-plus');

        const popupMinusBtns =
            cartPopupItems.querySelectorAll('.popup-minus');


        popupPlusBtns.forEach(btn => {

            btn.addEventListener('click', () => {

                const key =
                    btn.dataset.key;

                cart[key] =
                    (cart[key] || 0) + 1;

                updateUI();

            });

        });


        popupMinusBtns.forEach(btn => {

            btn.addEventListener('click', () => {

                const key =
                    btn.dataset.key;


                if (cart[key] > 0) {

                    cart[key]--;

                    if (cart[key] === 0) {

                        delete cart[key];

                    }

                    updateUI();

                }

            });

        });

    }


    /*
     * Избранные заказы
     */

    function attachFavoritesListeners() {

        if (!favoritesPopupItems) return;


        const loadBtns =
            favoritesPopupItems.querySelectorAll('.fav-load-btn');

        const delBtns =
            favoritesPopupItems.querySelectorAll('.fav-del-btn');


        /*
         * Загрузить заказ
         */

        loadBtns.forEach(btn => {

            btn.addEventListener('click', () => {

                const index =
                    btn.dataset.index;


                cart =
                    { ...favorites[index].cartData };


                favoritesPopup.classList.remove('active');

                updateUI();

            });

        });


        /*
         * Удалить сохранённый заказ
         */

        delBtns.forEach(btn => {

            btn.addEventListener('click', () => {

                const index =
                    btn.dataset.index;


                favorites.splice(index, 1);


                localStorage.setItem(
                    FAV_STORAGE_KEY,
                    JSON.stringify(favorites)
                );


                updateFavoritesUI();

            });

        });

    }


    /*
     * Открытие корзины
     */

    if (orderBarToggle && cartPopup) {

        orderBarToggle.addEventListener('click', () => {

            if (favoritesPopup) {

                favoritesPopup.classList.remove('active');

            }

            cartPopup.classList.toggle('active');

        });

    }


    /*
     * Закрытие корзины
     */

    if (closePopupBtn && cartPopup) {

        closePopupBtn.addEventListener('click', () => {

            cartPopup.classList.remove('active');

        });

    }


    /*
     * Открытие избранного
     */

    if (favoritesToggleBtn && favoritesPopup) {

        favoritesToggleBtn.addEventListener('click', () => {

            if (cartPopup) {

                cartPopup.classList.remove('active');

            }

            favoritesPopup.classList.toggle('active');

        });

    }


    /*
     * Закрытие избранного
     */

    if (closeFavoritesPopup && favoritesPopup) {

        closeFavoritesPopup.addEventListener('click', () => {

            favoritesPopup.classList.remove('active');

        });

    }


    /*
     * Сохранение текущей корзины в избранное
     */

    if (saveCurrentFavBtn) {

        saveCurrentFavBtn.addEventListener('click', () => {

            const totalCount =
                getCartItems().reduce(
                    (sum, item) => sum + item.qty,
                    0
                );


            if (totalCount === 0) {

                alert(
                    'Корзина пуста, нечего сохранять!'
                );

                return;

            }


            let customName =
                favNameInput.value.trim();


            if (!customName) {

                customName =
                    `Набор #${favorites.length + 1}`;

            }


            const cartItems =
                getCartItems();


            const totalSum =
                cartItems.reduce(
                    (sum, item) =>
                        sum + item.price * item.qty,
                    0
                );


            const summaryArr =
                cartItems.map(item =>
                    `${item.name} — ${formatWeight(item.weight)} x${item.qty}`
                );


            favorites.push({

                name: customName,

                summary:
                    summaryArr.join(', '),

                total:
                    totalSum,

                cartData:
                    { ...cart }

            });


            localStorage.setItem(
                FAV_STORAGE_KEY,
                JSON.stringify(favorites)
            );


            favNameInput.value = '';


            updateFavoritesUI();


            alert(
                'Заказ успешно сохранен в избранное! 🔖'
            );

        });

    }


    /*
     * Отправка заказа в WhatsApp
     */

    if (whatsappBtn) {

        whatsappBtn.addEventListener('click', () => {

            const cartItems =
                getCartItems();


            if (cartItems.length === 0) {

                alert('Корзина пуста!');

                return;

            }


            let message =
                "Здравствуйте! Хочу сделать заказ:\n\n";


            let totalSum = 0;


            cartItems.forEach(item => {

                const sum =
                    item.price * item.qty;


                totalSum += sum;


                message +=
                    `▪️ ${item.name} — ${formatWeight(item.weight)}, ${item.qty} шт. (${sum} ₸)\n`;

            });


            message +=
                `\n📦 Итого к оплате: ${totalSum} ₸`;


            const encodedMessage =
                encodeURIComponent(message);


            const waURL =
                `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;


            window.open(
                waURL,
                '_blank'
            );

        });

    }


    /*
     * Первоначальное обновление
     */

    updateUI();


    /*
     * Lightbox
     */

    const lightbox =
        document.getElementById('lightbox');

    const lightboxImg =
        document.getElementById('lightbox-img');

    const closeBtn =
        document.querySelector('.lightbox-close');

    const images =
        document.querySelectorAll('.info-card img');


    if (lightbox) {

        images.forEach(img => {

            img.addEventListener('click', () => {

                lightbox.classList.add('active');

                lightboxImg.src =
                    img.src;

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