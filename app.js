// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Sample menu data (in real app, this would come from your backend)
const menuData = {
    hot: [
        {
            id: 1,
            name: "Стейк Рибай",
            description: "Сочный стейк из мраморной говядины",
            price: 2500,
            image: "steak.jpg",
            category: "hot"
        },
        {
            id: 2,
            name: "Паста Карбонара",
            description: "Классическая итальянская паста с беконом",
            price: 850,
            image: "pasta.jpg",
            category: "hot"
        }
    ],
    cold: [
        {
            id: 3,
            name: "Цезарь с курицей",
            description: "Свежий салат с куриным филе",
            price: 650,
            image: "caesar.jpg",
            category: "cold"
        }
    ],
    desserts: [
        {
            id: 4,
            name: "Тирамису",
            description: "Классический итальянский десерт",
            price: 450,
            image: "tiramisu.jpg",
            category: "desserts"
        }
    ],
    drinks: [
        {
            id: 5,
            name: "Мохито",
            description: "Освежающий коктейль с мятой",
            price: 550,
            image: "mojito.webp",
            category: "drinks"
        }
    ]
};

// Cart state
let cart = [];

// DOM Elements
const menuItemsContainer = document.getElementById('menuItems');
const cartItemsContainer = document.getElementById('cartItems');
const totalPriceElement = document.getElementById('totalPrice');
const categoryButtons = document.querySelectorAll('.category-btn');
const orderButton = document.getElementById('orderButton');

// Initialize the app
function init() {
    if (!tg.initData) {
        console.error("Telegram WebApp is not initialized. Check if the app is opened via Telegram.");
        return;
    }
    renderMenu('all');
    setupEventListeners();
}

// Render menu items
function renderMenu(category) {
    menuItemsContainer.innerHTML = '';
    
    let items = [];
    if (category === 'all') {
        Object.values(menuData).forEach(categoryItems => {
            items = items.concat(categoryItems);
        });
    } else {
        items = menuData[category] || [];
    }

    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="price">${item.price} ₽</div>
            <button class="add-to-cart" data-id="${item.id}">Добавить в корзину</button>
        `;
        menuItemsContainer.appendChild(menuItem);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Category buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderMenu(button.dataset.category);
        });
    });

    // Add to cart buttons
    menuItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const itemId = parseInt(e.target.dataset.id);
            addToCart(itemId);
        }
    });

    // Order button
    orderButton.addEventListener('click', submitOrder);
}

// Add item to cart
function addToCart(itemId) {
    const item = findItemById(itemId);
    if (!item) return;

    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }

    updateCart();
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCart();
}

// Update item quantity in cart
function updateItemQuantity(itemId, delta) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCart();
        }
    }
}

// Update cart display
function updateCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'menu-item'; // Используем тот же класс для стилизации
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div>${item.price} ₽ × ${item.quantity}</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateItemQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateItemQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    totalPriceElement.textContent = `${total} ₽`;
}

// Find item by ID
function findItemById(id) {
    for (const category of Object.values(menuData)) {
        const item = category.find(item => item.id === id);
        if (item) return item;
    }
    return null;
}

// Submit order
function submitOrder() {
    if (cart.length === 0) {
        tg.showAlert('Добавьте товары в корзину');
        return;
    }

    const order = {
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };

    // Debug: Log the order data
    console.log("Order being sent:", order);
    console.log("Serialized order:", JSON.stringify(order));

    // Show confirmation before sending
    tg.showPopup({
        title: "Подтверждение заказа",
        message: `Итоговая сумма: ${order.total} ₽. Подтвердить заказ?`,
        buttons: [
            { id: "cancel", type: "cancel", text: "Отмена" },
            { id: "confirm", type: "default", text: "Подтвердить" }
        ]
    }, (buttonId) => {
        if (buttonId === "confirm") {
            try {
                tg.sendData(JSON.stringify(order));
                console.log("Data sent successfully");
                tg.showAlert("Заказ отправлен!");
            } catch (error) {
                console.error("Error sending data:", error);
                tg.showAlert("Ошибка при отправке заказа: " + error.message);
            }
        } else {
            console.log("Order cancelled by user");
            tg.showAlert("Заказ отменен.");
        }
        tg.close();
    });
}

// Initialize the app
init();
