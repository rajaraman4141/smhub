const STORE_CONFIG = {
  name: "Sattumakhana",
  phone: "+918292294887",
  razorpayKeyId: "rzp_test_REPLACE_WITH_YOUR_KEY",
  upiId: "your-upi-id@bank",
  deliveryFee: 40,
  freeDeliveryAbove: 899,
};

const products = [
  {
    id: "classic-makhana",
    name: "Classic Roasted Makhana",
    size: "200 g",
    price: 289,
    marker: "M",
    description: "Lightly roasted makhana with clean seasoning and a crisp finish.",
  },
  {
    id: "peri-peri-makhana",
    name: "Peri Peri Makhana",
    size: "200 g",
    price: 329,
    marker: "P",
    description: "A spicier snack pack for tea time, office breaks, and travel.",
  },
  {
    id: "sattu",
    name: "Sattu",
    size: "500 g",
    price: 149,
    marker: "S",
    description: "Nutritious sattu base for quick summer drinks and daily energy.",
  },
  {
    id: "family-combo",
    name: "Family Combo Pack",
    size: "3 packs",
    price: 449,
    marker: "C",
    description: "A balanced combo of makhana flavours and sattu for home use.",
  },
  {
    id: "Makhana",
    name: "Makhana",
    size: "1 Kg ",
    price: 1299,
    marker: "O",
    description: ".",
  },
  {
    id: "Premium Makhana",
    name: "Premium Makhana",
    size: "1 kg",
    price: 1599,
    marker: "T",
    description: ".",
  },
];

let cart = {};

const productGrid = document.querySelector("#productGrid");
const cartItems = document.querySelector("#cartItems");
const subtotalEl = document.querySelector("#subtotal");
const deliveryEl = document.querySelector("#delivery");
const grandTotalEl = document.querySelector("#grandTotal");
const clearCartBtn = document.querySelector("#clearCart");
const orderForm = document.querySelector("#orderForm");
const orderMessage = document.querySelector("#orderMessage");

const formatCurrency = (value) => `Rs ${value.toLocaleString("en-IN")}`;

const getCartLines = () =>
  products
    .map((product) => ({ ...product, quantity: cart[product.id] || 0 }))
    .filter((product) => product.quantity > 0);

const getTotals = () => {
  const subtotal = getCartLines().reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal === 0 || subtotal >= STORE_CONFIG.freeDeliveryAbove ? 0 : STORE_CONFIG.deliveryFee;
  return { subtotal, delivery, grandTotal: subtotal + delivery };
};

const renderProducts = () => {
  productGrid.innerHTML = products
    .map((product) => {
      const quantity = cart[product.id] || 0;
      return `
        <article class="product-card">
          <div class="product-visual" aria-hidden="true">${product.marker}</div>
          <div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <div class="price-row">
            <div>
              <strong>${formatCurrency(product.price)}</strong>
              <small>${product.size}</small>
            </div>
            <div class="stepper" aria-label="Quantity for ${product.name}">
              <button type="button" data-action="decrease" data-id="${product.id}" aria-label="Decrease ${product.name}">-</button>
              <span>${quantity}</span>
              <button type="button" data-action="increase" data-id="${product.id}" aria-label="Increase ${product.name}">+</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
};

const renderCart = () => {
  const lines = getCartLines();
  const totals = getTotals();

  if (lines.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Your cart is empty. Add products above to start an order.</p>`;
  } else {
    cartItems.innerHTML = lines
      .map(
        (item) => `
          <div class="cart-item">
            <strong>${item.name}</strong>
            <strong>${formatCurrency(item.price * item.quantity)}</strong>
            <small>${item.quantity} x ${item.size}</small>
            <small>${formatCurrency(item.price)} each</small>
          </div>
        `,
      )
      .join("");
  }

  subtotalEl.textContent = formatCurrency(totals.subtotal);
  deliveryEl.textContent = formatCurrency(totals.delivery);
  grandTotalEl.textContent = formatCurrency(totals.grandTotal);
};

const saveCart = () => {
  localStorage.setItem("sattumakhana-cart", JSON.stringify(cart));
};

const loadCart = () => {
  try {
    cart = JSON.parse(localStorage.getItem("sattumakhana-cart")) || {};
  } catch {
    cart = {};
  }
};

const updateCart = (id, delta) => {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (cart[id] === 0) {
    delete cart[id];
  }
  saveCart();
  renderProducts();
  renderCart();
};

const buildOrderText = (formData, totals) => {
  const lines = getCartLines()
    .map((item) => `- ${item.name} (${item.size}) x ${item.quantity}: ${formatCurrency(item.price * item.quantity)}`)
    .join("%0A");

  return [
    `New order for ${STORE_CONFIG.name}`,
    "",
    `Name: ${formData.get("name")}`,
    `Phone: ${formData.get("phone")}`,
    `Address: ${formData.get("address")}, ${formData.get("city")} - ${formData.get("pincode")}`,
    `Payment: ${formData.get("payment")}`,
    "",
    "Items:",
    lines,
    "",
    `Total: ${formatCurrency(totals.grandTotal)}`,
  ].join("%0A");
};

const openRazorpay = (formData, totals) => {
  const keyLooksConfigured = !STORE_CONFIG.razorpayKeyId.includes("REPLACE");

  if (!window.Razorpay || !keyLooksConfigured) {
    orderMessage.innerHTML =
      `Online payment is ready for setup. Replace <code>razorpayKeyId</code> in <code>app.js</code>, then add backend order creation and payment verification. For now, use UPI or COD.`;
    return;
  }

  const payment = new window.Razorpay({
    key: STORE_CONFIG.razorpayKeyId,
    amount: totals.grandTotal * 100,
    currency: "INR",
    name: STORE_CONFIG.name,
    description: "Snack order payment",
    prefill: {
      name: formData.get("name"),
      contact: formData.get("phone"),
    },
    notes: {
      address: `${formData.get("address")}, ${formData.get("city")} - ${formData.get("pincode")}`,
    },
    handler() {
      orderMessage.textContent = "Payment received. Please verify this payment on your backend before dispatch.";
      cart = {};
      saveCart();
      renderProducts();
      renderCart();
      orderForm.reset();
    },
  });

  payment.open();
};

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const delta = button.dataset.action === "increase" ? 1 : -1;
  updateCart(button.dataset.id, delta);
});

clearCartBtn.addEventListener("click", () => {
  cart = {};
  saveCart();
  renderProducts();
  renderCart();
  orderMessage.textContent = "";
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const lines = getCartLines();
  if (lines.length === 0) {
    orderMessage.textContent = "Please add at least one product before confirming the order.";
    return;
  }

  const formData = new FormData(orderForm);
  const totals = getTotals();
  const paymentMethod = formData.get("payment");

  if (paymentMethod === "razorpay") {
    openRazorpay(formData, totals);
    return;
  }

  if (paymentMethod === "upi") {
    orderMessage.innerHTML =
      `Order captured. Ask customer to pay <strong>${formatCurrency(totals.grandTotal)}</strong> to <strong>${STORE_CONFIG.upiId}</strong>, then confirm manually.`;
  } else {
    orderMessage.textContent = "Order captured for cash on delivery. Confirm stock and delivery time with the customer.";
  }

  const whatsappText = buildOrderText(formData, totals);
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.phone.replace(/\D/g, "")}?text=${whatsappText}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

loadCart();
renderProducts();
renderCart();
