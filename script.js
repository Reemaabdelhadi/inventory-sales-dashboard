
const defaultProducts = [
  { id: 1, name: "Coach Bag", price: 150, quantity: 3 },
  { id: 2, name: "Tory Burch Bag", price: 220, quantity: 2 },
  { id: 3, name: "Guess Wallet", price: 45, quantity: 5 }
];

// Load saved data
function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (saved === null) {
      return fallback;
    }

    const data = JSON.parse(saved);

    return Array.isArray(data) ? data : fallback;
  } catch (error) {
    console.error("Error loading " + key, error);
    return fallback;
  }
}

let products = loadData("products", defaultProducts);
let sales = loadData("sales", []);

// Save data
function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function saveSales() {
  localStorage.setItem("sales", JSON.stringify(sales));
}

// Inventory calculations
function calculateInventoryValue() {
  return products.reduce((total, product) => {
    return total + product.price * product.quantity;
  }, 0);
}

function updateStatistics() {
  const totalProducts = document.getElementById("totalProducts");
  const inventoryValue = document.getElementById("inventoryValue");

  totalProducts.textContent = products.length;

  inventoryValue.textContent =
    "$" + calculateInventoryValue().toFixed(2);
}

// Display products
function renderProducts() {
  const productList = document.getElementById("productList");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  const keyword = searchInput.value.toLowerCase().trim();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(keyword)
  );

  const sortedProducts = [...filteredProducts];

  if (sortSelect.value === "low") {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === "high") {
    sortedProducts.sort((a, b) => b.price - a.price);
  }

  productList.innerHTML = "";

  sortedProducts.forEach(product => {
    const li = document.createElement("li");
    const name = document.createElement("span");

    const sellBtn = document.createElement("button");
    const editBtn = document.createElement("button");
    const deleteBtn = document.createElement("button");

    name.textContent =
      `${product.name} - $${product.price.toFixed(2)} - Stock: ${product.quantity}`;

    // Sell button
    sellBtn.textContent = "Sell 1";
    sellBtn.disabled = product.quantity <= 0;

    sellBtn.addEventListener("click", function() {
      recordSale(product.id);
    });

    // Edit button
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", function() {
      const input = prompt("Enter new price:", product.price);

      if (input === null || input.trim() === "") {
        return;
      }

      const newPrice = Number(input);

      if (!Number.isFinite(newPrice) || newPrice < 0) {
        alert("Please enter a valid price");
        return;
      }

      editProduct(product.id, newPrice);
    });

    // Delete button
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", function() {
      deleteProduct(product.id);
    });

    li.append(name, sellBtn, editBtn, deleteBtn);
    productList.appendChild(li);
  });

  updateStatistics();
}

// Add product
const productForm = document.getElementById("productForm");
const nameInput = document.getElementById("productName");
const priceInput = document.getElementById("productPrice");
const quantityInput = document.getElementById("productQuantity");

productForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const quantity = Number(quantityInput.value);

  if (
    name === "" ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    priceInput.value.trim() === "" ||
    quantityInput.value.trim() === ""
  ) {
    alert("Please enter valid product information");
    return;
  }

  const newProduct = {
    id: Date.now() + Math.random(),
    name: name,
    price: price,
    quantity: quantity
  };

  products.push(newProduct);

  saveProducts();
  renderProducts();
  productForm.reset();
});

// Delete product
function deleteProduct(id) {
  products = products.filter(product => product.id !== id);

  saveProducts();
  renderProducts();
}

// Edit product
function editProduct(id, newPrice) {
  products = products.map(product => {
    if (product.id === id) {
      return { ...product, price: newPrice };
    }

    return product;
  });

  saveProducts();
  renderProducts();
}

// Record a sale
function recordSale(id) {
  const product = products.find(p => p.id === id);

  if (!product || product.quantity <= 0) {
    alert("Product out of stock");
    return;
  }

  product.quantity -= 1;

  const sale = {
    productId: product.id,
    productName: product.name,
    quantity: 1,
    total: product.price,
    date: new Date().toISOString()
  };

  sales.push(sale);

  saveProducts();
  saveSales();

  renderProducts();
  renderSales();
  renderSalesChart();
}

// Sales calculations
function calculateTotalSales() {
  return sales.reduce((total, sale) => {
    return total + sale.total;
  }, 0);
}

// Display sales
function renderSales() {
  const totalSales = document.getElementById("totalSales");
  const unitsSold = document.getElementById("unitsSold");
  const salesList = document.getElementById("salesList");

  totalSales.textContent =
    "$" + calculateTotalSales().toFixed(2);

  unitsSold.textContent = sales.reduce((total, sale) => {
    return total + sale.quantity;
  }, 0);

  salesList.innerHTML = "";

  sales.forEach(sale => {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = sale.productName;

    const amount = document.createElement("span");
    amount.textContent = " - $" + sale.total.toFixed(2);

    const date = document.createElement("small");
    date.textContent =
      " — " + new Date(sale.date).toLocaleDateString();

    li.append(name, amount, date);
    salesList.appendChild(li);
  });
}

// Sales chart
let salesChartInstance = null;

function renderSalesChart() {
  const canvas = document.getElementById("salesChart");
  const chartMessage = document.getElementById("chartMessage");

  if (!canvas) {
    console.error("salesChart canvas not found");
    return;
  }

  if (typeof Chart === "undefined") {
    chartMessage.textContent =
      "Chart.js could not load. Check your internet connection.";
    return;
  }

  chartMessage.textContent = "";

  const totals = {};

  sales.forEach(sale => {
    const key = sale.productId;

    if (!totals[key]) {
      totals[key] = {
        name: sale.productName,
        amount: 0
      };
    }

    totals[key].amount += sale.total;
  });

  const productsData = Object.values(totals);

  const names = productsData.map(item => item.name);
  const amounts = productsData.map(item => item.amount);

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  salesChartInstance = new Chart(canvas, {
    type: "bar",

    data: {
      labels: names,
      datasets: [{
        label: "Total Sales ($)",
        data: amounts,
        backgroundColor: "#64748b",
        borderRadius: 6
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  if (sales.length === 0) {
    chartMessage.textContent =
      "No sales yet. Click Sell 1 to see your chart.";
  }
}

// Search
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function() {
  renderProducts();
});

// Sort
const sortSelect = document.getElementById("sortSelect");

sortSelect.addEventListener("change", function() {
  renderProducts();
});

// Initial display
renderProducts();
renderSales();
renderSalesChart();
