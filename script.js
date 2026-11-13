const currencyFormatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CL");

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
});

const totalSalesElement = document.querySelector("#totalSales");
const registeredSalesElement = document.querySelector(
    "#registeredSales"
);
const soldUnitsElement = document.querySelector("#soldUnits");
const averageTicketElement = document.querySelector(
    "#averageTicket"
);
const grossMarginElement = document.querySelector("#grossMargin");
const leadingProductElement = document.querySelector(
    "#leadingProduct"
);

const recentSalesBody = document.querySelector(
    "#recentSalesBody"
);
const stockAlertsBody = document.querySelector(
    "#stockAlertsBody"
);

const periodOption = document.querySelector("#periodOption");
const notification = document.querySelector("#notification");

const menuButton = document.querySelector("#menuButton");
const sidebar = document.querySelector("#sidebar");
const sidebarOverlay = document.querySelector(
    "#sidebarOverlay"
);

/* Elementos da página de produtos */

const productSearch = document.querySelector("#productSearch");
const categoryFilter = document.querySelector("#categoryFilter");
const statusFilter = document.querySelector("#statusFilter");
const productTableBody = document.querySelector(
    "#productTableBody"
);
const productCount = document.querySelector("#productCount");

const productFormPanel = document.querySelector(
    "#productFormPanel"
);
const productForm = document.querySelector("#productForm");
const productFormTitle = document.querySelector(
    "#productFormTitle"
);
const formModeBadge = document.querySelector("#formModeBadge");
const formError = document.querySelector("#formError");

const productCode = document.querySelector("#productCode");
const productName = document.querySelector("#productName");
const productCategory = document.querySelector(
    "#productCategory"
);
const productPresentation = document.querySelector(
    "#productPresentation"
);
const productSupplier = document.querySelector(
    "#productSupplier"
);
const productStatus = document.querySelector(
    "#productStatus"
);
const productCost = document.querySelector("#productCost");
const productPrice = document.querySelector("#productPrice");
const productMinimumStock = document.querySelector(
    "#productMinimumStock"
);
const currentStockText = document.querySelector(
    "#currentStockText"
);

const newProductButton = document.querySelector(
    "#newProductButton"
);
const cancelProductButton = document.querySelector(
    "#cancelProductButton"
);
const deactivateProductButton = document.querySelector(
    "#deactivateProductButton"
);
const exportProductsButton = document.querySelector(
    "#exportProductsButton"
);
const exportSalesButton = document.querySelector(
    "#exportSalesButton"
);
const exportSalesPageButton = document.querySelector(
    "#exportSalesPageButton"
);

const monthlySalesChart = document.querySelector(
    "#monthlySalesChart"
);
const categorySalesBody = document.querySelector(
    "#categorySalesBody"
);
const productRankingBody = document.querySelector(
    "#productRankingBody"
);

const salesDateFrom = document.querySelector("#salesDateFrom");
const salesDateTo = document.querySelector("#salesDateTo");
const salesPaymentFilter = document.querySelector(
    "#salesPaymentFilter"
);
const salesStatusFilter = document.querySelector(
    "#salesStatusFilter"
);
const salesTableBody = document.querySelector("#salesTableBody");
const salesCount = document.querySelector("#salesCount");
const salesPageInfo = document.querySelector("#salesPageInfo");
const saleDetailPanel = document.querySelector("#saleDetailPanel");
const saleDetailBody = document.querySelector("#saleDetailBody");

const purchaseDateFrom = document.querySelector("#purchaseDateFrom");
const purchaseDateTo = document.querySelector("#purchaseDateTo");
const purchaseSupplierFilter = document.querySelector(
    "#purchaseSupplierFilter"
);
const purchaseStatusFilter = document.querySelector(
    "#purchaseStatusFilter"
);
const purchasesTableBody = document.querySelector(
    "#purchasesTableBody"
);
const purchaseDetailPanel = document.querySelector(
    "#purchaseDetailPanel"
);
const purchaseDetailBody = document.querySelector(
    "#purchaseDetailBody"
);
const inventoryTableBody = document.querySelector(
    "#inventoryTableBody"
);

const marginSearch = document.querySelector("#marginSearch");
const marginCategoryFilter = document.querySelector(
    "#marginCategoryFilter"
);
const marginLinesBody = document.querySelector("#marginLinesBody");
const marginCategoryBody = document.querySelector(
    "#marginCategoryBody"
);
const marginRankingBody = document.querySelector(
    "#marginRankingBody"
);

const promotionStatusFilter = document.querySelector(
    "#promotionStatusFilter"
);
const promotionsTableBody = document.querySelector(
    "#promotionsTableBody"
);
const usersTableBody = document.querySelector("#usersTableBody");

let notificationTimer;
let products = [];
let filteredProducts = [];
let editingProductId = null;
let productsLoaded = false;
let dashboardLoaded = false;
let sales = [];
let filteredSales = [];
let salesLoaded = false;
let salesPageNumber = 0;
let purchases = [];
let filteredPurchases = [];
let purchaseDetails = [];
let inventory = [];
let purchasesLoaded = false;
let marginSales = [];
let marginsLoaded = false;
let promotions = [];
let promotionsLoaded = false;
let demoUsers = [];
let usersLoaded = false;
const salesPageSize = 25;


/* ======================================================
   FUNÇÕES GERAIS
   ====================================================== */

async function requestJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `La solicitud ${url} devolvió ${response.status}.`
        );
    }

    return response.json();
}


function showNotification(message) {
    window.clearTimeout(notificationTimer);

    notification.textContent = message;
    notification.classList.add("visible");

    notificationTimer = window.setTimeout(() => {
        notification.classList.remove("visible");
    }, 3200);
}


function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return String(value);
    }

    return dateFormatter.format(parsedDate);
}


/* ======================================================
   NAVEGAÇÃO
   ====================================================== */

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("visible");

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
}


function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("visible");

    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Cerrar menú");
}


function navigateToPage(pageName, updateHistory = true) {
    const validPages = [
        "inicio",
        "productos",
        "ventas",
        "compras",
        "costos",
        "promociones",
        "usuarios"
    ];
    const validPage = validPages.includes(pageName)
        ? pageName
        : "inicio";

    document
        .querySelectorAll("[data-page-content]")
        .forEach((page) => {
            page.hidden =
                page.dataset.pageContent !== validPage;
        });

    document
        .querySelectorAll("[data-page]")
        .forEach((button) => {
            const isActive =
                button.dataset.page === validPage;

            button.classList.toggle("active", isActive);

            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });

    const pageLoaders = {
        productos: loadProducts,
        ventas: loadSales,
        compras: loadPurchases,
        costos: loadMargins,
        promociones: loadPromotions,
        usuarios: loadUsers
    };

    if (pageLoaders[validPage]) {
        pageLoaders[validPage]();
    }

    if (updateHistory) {
        const destination = validPage === "inicio"
            ? "/"
            : `/#${validPage}`;

        history.pushState(
            { page: validPage },
            "",
            destination
        );
    }

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
}


document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
        navigateToPage(button.dataset.page);
    });
});


menuButton.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});


sidebarOverlay.addEventListener("click", closeSidebar);


window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSidebar();
    }
});


window.addEventListener("popstate", () => {
    const page = window.location.hash.slice(1) || "inicio";

    navigateToPage(page, false);
});


/* ======================================================
   DASHBOARD INICIAL
   ====================================================== */

function finishKpiLoading() {
    document.querySelectorAll(".kpi-card").forEach((card) => {
        card.classList.remove("loading");
    });
}


function renderIndicators(indicators) {
    totalSalesElement.textContent = currencyFormatter.format(
        indicators.ingresos_clp ?? 0
    );

    registeredSalesElement.textContent = numberFormatter.format(
        indicators.ventas_completadas ?? 0
    );

    soldUnitsElement.textContent = numberFormatter.format(
        indicators.unidades_vendidas ?? 0
    );

    averageTicketElement.textContent = currencyFormatter.format(
        indicators.ticket_promedio_clp ?? 0
    );
    grossMarginElement.textContent = currencyFormatter.format(
        indicators.margen_bruto_clp ?? 0
    );
    leadingProductElement.textContent =
        indicators.producto_lider ?? "—";

    finishKpiLoading();
}


function renderRecentSales(sales) {
    if (!Array.isArray(sales) || sales.length === 0) {
        recentSalesBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-message">
                    No hay ventas para mostrar.
                </td>
            </tr>
        `;

        return;
    }

    recentSalesBody.innerHTML = sales
        .map((sale) => `
            <tr>
                <td>${formatDate(sale.Fecha)}</td>
                <td>${escapeHtml(sale.ID_Venta ?? "—")}</td>
                <td>
                    ${currencyFormatter.format(
                        sale.Total_CLP ?? 0
                    )}
                </td>
            </tr>
        `)
        .join("");
}


function renderStockAlerts(alerts) {
    if (!Array.isArray(alerts) || alerts.length === 0) {
        stockAlertsBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-message">
                    No hay productos con stock bajo.
                </td>
            </tr>
        `;

        return;
    }

    stockAlertsBody.innerHTML = alerts
        .map((product) => `
            <tr>
                <td>
                    ${escapeHtml(
                        product.Nombre_Producto ?? "—"
                    )}
                </td>

                <td>
                    <span class="stock-value">
                        ${numberFormatter.format(
                            product.Stock_Actual ?? 0
                        )}
                    </span>
                </td>

                <td>
                    ${numberFormatter.format(
                        product.Stock_Minimo ?? 0
                    )}
                </td>
            </tr>
        `)
        .join("");
}


function renderMonthlySales(monthlySales) {
    if (!monthlySales.length) {
        monthlySalesChart.innerHTML = `
            <p class="table-message">No hay ventas para mostrar.</p>
        `;

        return;
    }

    const maximum = Math.max(
        ...monthlySales.map((item) => Number(item.Ventas_CLP) || 0),
        1
    );

    monthlySalesChart.innerHTML = monthlySales
        .map((item) => {
            const amount = Number(item.Ventas_CLP) || 0;
            const width = Math.max(2, amount / maximum * 100);

            return `
                <div class="bar-chart-row" role="listitem">
                    <span>${escapeHtml(formatMonth(item.Mes))}</span>
                    <div class="bar-chart-track">
                        <div
                            class="bar-chart-fill"
                            style="width: ${width}%"
                            aria-label="${currencyFormatter.format(amount)}"
                        ></div>
                    </div>
                    <strong>${currencyFormatter.format(amount)}</strong>
                </div>
            `;
        })
        .join("");
}


function renderCategorySales(categories) {
    categorySalesBody.innerHTML = categories.length
        ? categories.map((item) => `
            <tr>
                <td>${escapeHtml(item.Categoria ?? "Sin categoría")}</td>
                <td>${numberFormatter.format(item.Unidades ?? 0)}</td>
                <td>${currencyFormatter.format(item.Ventas_CLP ?? 0)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="3" class="table-message">No hay datos.</td></tr>`;
}


function renderProductRanking(ranking) {
    productRankingBody.innerHTML = ranking.length
        ? ranking.slice(0, 5).map((item) => `
            <tr>
                <td>${escapeHtml(item.Nombre_Producto ?? "—")}</td>
                <td>${numberFormatter.format(item.Unidades_Vendidas ?? 0)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="2" class="table-message">No hay datos.</td></tr>`;
}


function formatMonth(monthValue) {
    const date = new Date(`${monthValue}-01T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
        return monthValue;
    }

    return new Intl.DateTimeFormat("es-CL", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(date);
}


function renderPeriod(monthlySales) {
    if (
        !Array.isArray(monthlySales) ||
        monthlySales.length === 0
    ) {
        periodOption.textContent = "Período no disponible";
        return;
    }

    const months = monthlySales
        .map((item) => item.Mes)
        .filter(Boolean);

    if (months.length === 1) {
        periodOption.textContent = formatMonth(months[0]);
        return;
    }

    const first = formatMonth(months[0]);
    const last = formatMonth(months[months.length - 1]);

    const firstParts = first.split(" ");
    const lastParts = last.split(" ");

    const firstMonth = firstParts[0];
    const firstYear = firstParts.at(-1);
    const lastMonth = lastParts[0];
    const lastYear = lastParts.at(-1);

    periodOption.textContent = firstYear === lastYear
        ? `${firstMonth}–${lastMonth} ${lastYear}`
        : `${first}–${last}`;
}


async function loadDashboard() {
    try {
        const [summary, salesResponse] = await Promise.all([
            requestJson("/api/resumen"),
            requestJson(
                "/api/ventas?estado=Completada&limite=3"
            )
        ]);

        renderIndicators(summary.indicadores ?? {});
        renderPeriod(summary.ventas_por_mes ?? []);
        renderStockAlerts(summary.alertas_stock ?? []);
        renderRecentSales(salesResponse.datos ?? []);
        renderMonthlySales(summary.ventas_por_mes ?? []);
        renderCategorySales(summary.ventas_por_categoria ?? []);
        renderProductRanking(summary.ranking_productos ?? []);
        dashboardLoaded = true;
    } catch (error) {
        console.error("Error al cargar el dashboard:", error);

        finishKpiLoading();

        recentSalesBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-message error">
                    No fue posible cargar las ventas.
                </td>
            </tr>
        `;

        stockAlertsBody.innerHTML = `
            <tr>
                <td colspan="3" class="table-message error">
                    No fue posible cargar el inventario.
                </td>
            </tr>
        `;

        showNotification(
            "No fue posible cargar los datos del dashboard."
        );
    }
}


/* ======================================================
   PRODUTOS
   ====================================================== */

function populateSelect(
    selectElement,
    values,
    firstOptionText
) {
    const currentValue = selectElement.value;

    selectElement.innerHTML = `
        <option value="">
            ${escapeHtml(firstOptionText)}
        </option>
    `;

    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });

    if (values.includes(currentValue)) {
        selectElement.value = currentValue;
    }
}


function configureProductOptions() {
    const categories = [
        ...new Set(
            products
                .map((product) => product.Categoria)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "es"));

    const suppliers = [
        ...new Set(
            products
                .map(
                    (product) =>
                        product.Proveedor_Referencia
                )
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "es"));

    populateSelect(
        categoryFilter,
        categories,
        "Todas las categorías"
    );

    populateSelect(
        productCategory,
        categories,
        "Seleccionar"
    );

    populateSelect(
        productSupplier,
        suppliers,
        "Seleccionar"
    );
}


function applyProductFilters() {
    const search = productSearch.value
        .trim()
        .toLocaleLowerCase("es");

    const category = categoryFilter.value;
    const status = statusFilter.value;

    filteredProducts = products.filter((product) => {
        const code = String(
            product.ID_Producto ?? ""
        ).toLocaleLowerCase("es");

        const name = String(
            product.Nombre_Producto ?? ""
        ).toLocaleLowerCase("es");

        const matchesSearch =
            !search ||
            code.includes(search) ||
            name.includes(search);

        const matchesCategory =
            !category ||
            product.Categoria === category;

        const matchesStatus =
            !status ||
            product.Estado === status;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
        );
    });

    renderProductTable();
}


function renderProductTable() {
    productCount.textContent =
        `${filteredProducts.length} producto` +
        `${filteredProducts.length === 1 ? "" : "s"}`;

    if (filteredProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="11" class="table-message">
                    No se encontraron productos.
                </td>
            </tr>
        `;

        return;
    }

    productTableBody.innerHTML = filteredProducts
        .map((product) => {
            const stock = Number(product.Stock_Actual ?? 0);
            const minimum = Number(
                product.Stock_Minimo ?? 0
            );

            const lowStockClass =
                stock <= minimum ? "stock-low" : "";

            const statusClass =
                product.Estado === "Activo"
                    ? "active"
                    : "inactive";

            return `
                <tr>
                    <td>
                        ${escapeHtml(product.ID_Producto)}
                    </td>

                    <td class="product-name-cell">
                        ${escapeHtml(
                            product.Nombre_Producto
                        )}
                    </td>

                    <td>
                        ${escapeHtml(product.Categoria)}
                    </td>

                    <td>${escapeHtml(product.Presentacion ?? "—")}</td>

                    <td>${escapeHtml(
                        product.Proveedor_Referencia ?? "—"
                    )}</td>

                    <td>
                        ${currencyFormatter.format(
                            product.Costo_Unitario_CLP ?? 0
                        )}
                    </td>

                    <td>
                        ${currencyFormatter.format(
                            product.Precio_Venta_CLP ?? 0
                        )}
                    </td>

                    <td>
                        <span class="${lowStockClass}">
                            ${numberFormatter.format(stock)}
                        </span>
                    </td>

                    <td>
                        ${numberFormatter.format(minimum)}
                    </td>

                    <td>
                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${escapeHtml(product.Estado)}
                        </span>
                    </td>

                    <td>
                        <button
                            class="edit-product-button"
                            type="button"
                            data-edit-product="${escapeHtml(
                                product.ID_Producto
                            )}"
                        >
                            <span
                                class="material-symbols-outlined"
                                aria-hidden="true"
                            >
                                edit
                            </span>

                            Editar
                        </button>
                    </td>
                </tr>
            `;
        })
        .join("");
}


function generateNextProductId() {
    const numbers = products
        .map((product) => {
            const match = String(
                product.ID_Producto ?? ""
            ).match(/(\d+)$/);

            return match ? Number(match[1]) : 0;
        });

    const nextNumber = Math.max(0, ...numbers) + 1;

    return `MED${String(nextNumber).padStart(3, "0")}`;
}


function hideFormError() {
    formError.hidden = true;
    formError.textContent = "";
}


function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}


function resetProductForm() {
    editingProductId = null;

    productForm.reset();

    productCode.value = generateNextProductId();
    productCode.readOnly = false;

    productStatus.value = "Activo";
    productCost.value = 0;
    productPrice.value = 0;
    productMinimumStock.value = 0;

    productFormTitle.textContent = "Nuevo producto";
    formModeBadge.textContent = "Nuevo";

    currentStockText.textContent = "0 unidades";

    deactivateProductButton.disabled = true;

    hideFormError();
}


function editProduct(productId) {
    const product = products.find(
        (item) => item.ID_Producto === productId
    );

    if (!product) {
        showNotification("El producto no fue encontrado.");
        return;
    }

    editingProductId = productId;

    productCode.value = product.ID_Producto ?? "";
    productCode.readOnly = true;

    productName.value = product.Nombre_Producto ?? "";
    productCategory.value = product.Categoria ?? "";
    productPresentation.value = product.Presentacion ?? "";
    productSupplier.value =
        product.Proveedor_Referencia ?? "";
    productStatus.value = product.Estado ?? "Activo";
    productCost.value =
        product.Costo_Unitario_CLP ?? 0;
    productPrice.value =
        product.Precio_Venta_CLP ?? 0;
    productMinimumStock.value =
        product.Stock_Minimo ?? 0;

    currentStockText.textContent =
        `${numberFormatter.format(
            product.Stock_Actual ?? 0
        )} unidades`;

    productFormTitle.textContent = "Editar producto";
    formModeBadge.textContent = "Edición";

    deactivateProductButton.disabled =
        product.Estado === "Inactivo";

    hideFormError();

    productFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function validateProductForm() {
    const code = productCode.value.trim();
    const name = productName.value.trim();

    if (!code || !name) {
        return "El código y el nombre son obligatorios.";
    }

    if (
        !productCategory.value ||
        !productPresentation.value.trim() ||
        !productSupplier.value
    ) {
        return (
            "Complete la categoría, la presentación " +
            "y el proveedor."
        );
    }

    const values = [
        Number(productCost.value),
        Number(productPrice.value),
        Number(productMinimumStock.value)
    ];

    if (
        values.some(
            (value) =>
                !Number.isFinite(value) || value < 0
        )
    ) {
        return "Los montos y el stock mínimo no pueden ser negativos.";
    }

    const duplicate = products.some((product) => {
        const sameCode =
            String(product.ID_Producto).toUpperCase() ===
            code.toUpperCase();

        return (
            sameCode &&
            product.ID_Producto !== editingProductId
        );
    });

    if (duplicate) {
        return "Ya existe un producto con ese código.";
    }

    return null;
}


function saveProduct(event) {
    event.preventDefault();

    const error = validateProductForm();

    if (error) {
        showFormError(error);
        return;
    }

    hideFormError();

    const existingProduct = products.find(
        (product) =>
            product.ID_Producto === editingProductId
    );

    const productData = {
        ID_Producto: productCode.value.trim().toUpperCase(),
        Nombre_Producto: productName.value.trim(),
        Categoria: productCategory.value,
        Presentacion: productPresentation.value.trim(),
        Proveedor_Referencia: productSupplier.value,
        Estado: productStatus.value,
        Costo_Unitario_CLP: Number(productCost.value),
        Precio_Venta_CLP: Number(productPrice.value),
        Stock_Minimo: Number(
            productMinimumStock.value
        ),
        Stock_Actual: existingProduct?.Stock_Actual ?? 0
    };

    if (existingProduct) {
        Object.assign(existingProduct, productData);

        showNotification(
            "Producto actualizado durante esta sesión."
        );
    } else {
        products.push(productData);

        showNotification(
            "Producto agregado durante esta sesión."
        );
    }

    configureProductOptions();
    applyProductFilters();
    resetProductForm();
}


function deactivateCurrentProduct() {
    if (!editingProductId) {
        return;
    }

    const product = products.find(
        (item) =>
            item.ID_Producto === editingProductId
    );

    if (!product) {
        return;
    }

    product.Estado = "Inactivo";

    configureProductOptions();
    applyProductFilters();
    editProduct(product.ID_Producto);

    showNotification(
        "Producto desactivado durante esta sesión."
    );
}


function escapeCsvValue(value) {
    let text = String(value ?? "");

    if (
        typeof value === "string" &&
        /^[\t\r ]*[=+\-@]/.test(text)
    ) {
        text = `'${text}`;
    }

    return `"${text.replaceAll('"', '""')}"`;
}


async function exportSalesCsv() {
    try {
        const response = await requestJson("/api/ventas");
        const sales = Array.isArray(response.datos)
            ? response.datos
            : [];

        if (sales.length === 0) {
            showNotification(
                "No hay ventas disponibles para exportar."
            );

            return;
        }

        const columns = Object.keys(sales[0]);
        const header = columns
            .map(escapeCsvValue)
            .join(";");
        const rows = sales.map((sale) =>
            columns
                .map((column) => escapeCsvValue(sale[column]))
                .join(";")
        );
        const csv = [header, ...rows].join("\r\n");
        const blob = new Blob(
            [`\uFEFF${csv}`],
            { type: "text/csv;charset=utf-8" }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "ventas_farmavital.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        showNotification(
            `Se exportaron ${sales.length} ventas a CSV.`
        );
    } catch (error) {
        console.error("Error al exportar ventas:", error);
        showNotification(
            "No fue posible exportar las ventas."
        );
    }
}


function exportProductsCsv() {
    if (filteredProducts.length === 0) {
        showNotification(
            "No hay productos disponibles para exportar."
        );

        return;
    }

    const columns = [
        ["ID_Producto", "Código"],
        ["Nombre_Producto", "Producto"],
        ["Categoria", "Categoría"],
        ["Presentacion", "Presentación"],
        ["Costo_Unitario_CLP", "Costo CLP"],
        ["Precio_Venta_CLP", "Precio CLP"],
        ["Stock_Actual", "Stock actual"],
        ["Stock_Minimo", "Stock mínimo"],
        ["Proveedor_Referencia", "Proveedor"],
        ["Estado", "Estado"]
    ];

    const header = columns
        .map(([, label]) => escapeCsvValue(label))
        .join(";");

    const rows = filteredProducts.map((product) =>
        columns
            .map(([key]) => escapeCsvValue(product[key]))
            .join(";")
    );

    const csv = [header, ...rows].join("\r\n");

    const blob = new Blob(
        [`\uFEFF${csv}`],
        {
            type: "text/csv;charset=utf-8"
        }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "productos_farmavital.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showNotification("Archivo CSV exportado.");
}


async function loadProducts() {
    if (productsLoaded) {
        return;
    }

    try {
        const response = await requestJson("/api/productos");

        products = Array.isArray(response.datos)
            ? response.datos
            : [];

        productsLoaded = true;

        configureProductOptions();
        resetProductForm();
        applyProductFilters();
    } catch (error) {
        console.error("Error al cargar productos:", error);

        productTableBody.innerHTML = `
            <tr>
                <td colspan="11" class="table-message error">
                    No fue posible cargar los productos.
                </td>
            </tr>
        `;

        productCount.textContent = "Error de carga";

        showNotification(
            "No fue posible cargar el catálogo de productos."
        );
    }
}


function populateFilter(selectElement, values, placeholder) {
    populateSelect(
        selectElement,
        [...new Set(values.filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "es")),
        placeholder
    );
}


function applySalesFilters() {
    const from = salesDateFrom.value;
    const to = salesDateTo.value;
    const payment = salesPaymentFilter.value;
    const status = salesStatusFilter.value;

    filteredSales = sales.filter((sale) => {
        const saleDate = String(sale.Fecha ?? "").slice(0, 10);

        return (
            (!from || saleDate >= from) &&
            (!to || saleDate <= to) &&
            (!payment || sale.Medio_Pago === payment) &&
            (!status || sale.Estado === status)
        );
    });

    salesPageNumber = 0;
    renderSales();
}


function renderSales() {
    const pageCount = Math.max(
        1,
        Math.ceil(filteredSales.length / salesPageSize)
    );
    salesPageNumber = Math.min(salesPageNumber, pageCount - 1);
    const start = salesPageNumber * salesPageSize;
    const pageSales = filteredSales.slice(
        start,
        start + salesPageSize
    );

    salesCount.textContent =
        `${filteredSales.length} venta${filteredSales.length === 1 ? "" : "s"}`;
    salesPageInfo.textContent =
        `Página ${salesPageNumber + 1} de ${pageCount}`;

    document.querySelector("#salesPreviousPage").disabled =
        salesPageNumber === 0;
    document.querySelector("#salesNextPage").disabled =
        salesPageNumber >= pageCount - 1;

    if (!pageSales.length) {
        salesTableBody.innerHTML = `
            <tr><td colspan="9" class="table-message">
                No se encontraron ventas con esos filtros.
            </td></tr>
        `;

        return;
    }

    const usersById = new Map(
        demoUsers.map((user) => [user.ID_Usuario, user.Nombre_Demo])
    );

    salesTableBody.innerHTML = pageSales.map((sale) => `
        <tr>
            <td>${formatDate(sale.Fecha)}</td>
            <td>${escapeHtml(sale.ID_Venta)}</td>
            <td>${escapeHtml(
                usersById.get(sale.ID_Usuario) ?? sale.ID_Usuario ?? "—"
            )}</td>
            <td>${escapeHtml(sale.Medio_Pago ?? "—")}</td>
            <td>${currencyFormatter.format(sale.Subtotal_CLP ?? 0)}</td>
            <td>${currencyFormatter.format(sale.Descuento_CLP ?? 0)}</td>
            <td>${currencyFormatter.format(sale.Total_CLP ?? 0)}</td>
            <td>${escapeHtml(sale.Estado ?? "—")}</td>
            <td>
                <button
                    class="table-action"
                    type="button"
                    data-sale-id="${escapeHtml(sale.ID_Venta)}"
                >Ver detalle</button>
            </td>
        </tr>
    `).join("");
}


async function loadSales() {
    if (salesLoaded) {
        return;
    }

    try {
        const [salesResponse, usersResponse] = await Promise.all([
            requestJson("/api/ventas"),
            requestJson("/api/usuarios")
        ]);

        sales = salesResponse.datos ?? [];
        demoUsers = usersResponse.datos ?? [];
        populateFilter(
            salesPaymentFilter,
            sales.map((sale) => sale.Medio_Pago),
            "Todos los medios"
        );
        populateFilter(
            salesStatusFilter,
            sales.map((sale) => sale.Estado),
            "Todos los estados"
        );
        salesLoaded = true;
        applySalesFilters();
    } catch (error) {
        console.error("Error al cargar ventas:", error);
        salesTableBody.innerHTML = `
            <tr><td colspan="9" class="table-message error">
                No fue posible cargar las ventas.
            </td></tr>
        `;
        salesCount.textContent = "Error de carga";
        showNotification("No fue posible cargar las ventas.");
    }
}


async function showSaleDetails(saleId) {
    try {
        const sale = await requestJson(
            `/api/ventas/${encodeURIComponent(saleId)}`
        );
        const header = sale.venta;

        document.querySelector("#saleDetailTitle").textContent =
            `Venta ${header.ID_Venta}`;
        document.querySelector("#saleDetailSummary").innerHTML = `
            <span>Fecha: <strong>${formatDate(header.Fecha)}</strong></span>
            <span>Medio: <strong>${escapeHtml(header.Medio_Pago)}</strong></span>
            <span>Subtotal: <strong>${currencyFormatter.format(
                header.Subtotal_CLP ?? 0
            )}</strong></span>
            <span>Descuento: <strong>${currencyFormatter.format(
                header.Descuento_CLP ?? 0
            )}</strong></span>
            <span>Total: <strong>${currencyFormatter.format(
                header.Total_CLP ?? 0
            )}</strong></span>
        `;
        saleDetailBody.innerHTML = sale.detalle.length
            ? sale.detalle.map((item) => `
                <tr>
                    <td>${escapeHtml(item.Nombre_Producto ?? item.ID_Producto)}</td>
                    <td>${escapeHtml(item.Categoria ?? "—")}</td>
                    <td>${numberFormatter.format(item.Cantidad ?? 0)}</td>
                    <td>${currencyFormatter.format(item.Precio_Unitario_CLP ?? 0)}</td>
                    <td>${numberFormatter.format(item.Descuento_Porcentaje ?? 0)}%</td>
                    <td>${currencyFormatter.format(item.Total_Linea_CLP ?? 0)}</td>
                    <td>${currencyFormatter.format(item.Margen_Bruto_Linea_CLP ?? 0)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="7" class="table-message">Sin productos asociados.</td></tr>`;

        saleDetailPanel.hidden = false;
        saleDetailPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        console.error("Error al cargar el detalle de venta:", error);
        showNotification("No fue posible cargar el detalle de la venta.");
    }
}


function applyPurchaseFilters() {
    const from = purchaseDateFrom.value;
    const to = purchaseDateTo.value;
    const supplier = purchaseSupplierFilter.value;
    const status = purchaseStatusFilter.value;

    filteredPurchases = purchases.filter((purchase) => {
        const purchaseDate = String(purchase.Fecha ?? "").slice(0, 10);

        return (
            (!from || purchaseDate >= from) &&
            (!to || purchaseDate <= to) &&
            (!supplier || purchase.Proveedor === supplier) &&
            (!status || purchase.Estado === status)
        );
    });

    renderPurchases();
}


function renderInventory() {
    const lowStock = inventory.filter(
        (product) =>
            Number(product.Stock_Actual ?? 0) <=
            Number(product.Stock_Minimo ?? 0)
    );

    document.querySelector("#inventoryCount").textContent =
        `${inventory.length} productos`;
    document.querySelector("#lowStockCount").textContent =
        numberFormatter.format(lowStock.length);

    inventoryTableBody.innerHTML = inventory.length
        ? inventory.map((product) => {
            const isLow =
                Number(product.Stock_Actual ?? 0) <=
                Number(product.Stock_Minimo ?? 0);

            return `
                <tr>
                    <td>${escapeHtml(product.ID_Producto)}</td>
                    <td>${escapeHtml(product.Nombre_Producto)}</td>
                    <td>${escapeHtml(product.Categoria)}</td>
                    <td>${escapeHtml(product.Presentacion)}</td>
                    <td>${escapeHtml(product.Proveedor_Referencia)}</td>
                    <td><span class="${isLow ? "stock-low" : ""}">${
                        numberFormatter.format(product.Stock_Actual ?? 0)
                    }</span></td>
                    <td>${numberFormatter.format(product.Stock_Minimo ?? 0)}</td>
                    <td>${currencyFormatter.format(product.Costo_Unitario_CLP ?? 0)}</td>
                    <td>${currencyFormatter.format(product.Precio_Venta_CLP ?? 0)}</td>
                    <td>${escapeHtml(product.Estado)}</td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="10" class="table-message">No hay productos.</td></tr>`;
}


function renderPurchases() {
    document.querySelector("#purchaseListCount").textContent =
        `${filteredPurchases.length} compras`;

    purchasesTableBody.innerHTML = filteredPurchases.length
        ? filteredPurchases.map((purchase) => `
            <tr>
                <td>${formatDate(purchase.Fecha)}</td>
                <td>${escapeHtml(purchase.ID_Compra)}</td>
                <td>${escapeHtml(purchase.Proveedor)}</td>
                <td>${escapeHtml(purchase.Estado)}</td>
                <td>${currencyFormatter.format(purchase.Total_CLP ?? 0)}</td>
                <td>
                    <button
                        class="table-action"
                        type="button"
                        data-purchase-id="${escapeHtml(purchase.ID_Compra)}"
                    >Ver detalle</button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" class="table-message">No se encontraron compras.</td></tr>`;
}


async function loadPurchases() {
    if (purchasesLoaded) {
        return;
    }

    try {
        const [purchaseResponse, detailResponse, productResponse] =
            await Promise.all([
                requestJson("/api/compras"),
                requestJson("/api/detalle-compras"),
                requestJson("/api/productos")
            ]);

        purchases = purchaseResponse.datos ?? [];
        filteredPurchases = [...purchases];
        purchaseDetails = detailResponse.datos ?? [];
        inventory = productResponse.datos ?? [];

        populateFilter(
            purchaseSupplierFilter,
            purchases.map((purchase) => purchase.Proveedor),
            "Todos los proveedores"
        );
        populateFilter(
            purchaseStatusFilter,
            purchases.map((purchase) => purchase.Estado),
            "Todos los estados"
        );

        document.querySelector("#purchaseCount").textContent =
            numberFormatter.format(purchases.length);
        document.querySelector("#purchaseTotal").textContent =
            currencyFormatter.format(
                purchases.reduce(
                    (total, purchase) =>
                        total + Number(purchase.Total_CLP ?? 0),
                    0
                )
            );
        document.querySelector("#purchasedUnits").textContent =
            numberFormatter.format(
                purchaseDetails.reduce(
                    (total, item) =>
                        total + Number(item.Cantidad ?? 0),
                    0
                )
            );

        renderInventory();
        renderPurchases();
        purchasesLoaded = true;
    } catch (error) {
        console.error("Error al cargar compras e inventario:", error);
        purchasesTableBody.innerHTML = `
            <tr><td colspan="6" class="table-message error">
                No fue posible cargar las compras.
            </td></tr>
        `;
        inventoryTableBody.innerHTML = `
            <tr><td colspan="10" class="table-message error">
                No fue posible cargar el inventario.
            </td></tr>
        `;
        showNotification(
            "No fue posible cargar las compras y el inventario."
        );
    }
}


async function showPurchaseDetails(purchaseId) {
    try {
        const result = await requestJson(
            `/api/compras/${encodeURIComponent(purchaseId)}`
        );
        const purchase = result.compra;

        document.querySelector("#purchaseDetailTitle").textContent =
            `Compra ${purchase.ID_Compra}`;
        document.querySelector("#purchaseDetailSummary").innerHTML = `
            <span>Fecha: <strong>${formatDate(purchase.Fecha)}</strong></span>
            <span>Proveedor: <strong>${escapeHtml(purchase.Proveedor)}</strong></span>
            <span>Estado: <strong>${escapeHtml(purchase.Estado)}</strong></span>
            <span>Total: <strong>${currencyFormatter.format(
                purchase.Total_CLP ?? 0
            )}</strong></span>
        `;
        purchaseDetailBody.innerHTML = result.detalle.length
            ? result.detalle.map((item) => `
                <tr>
                    <td>${escapeHtml(item.Nombre_Producto ?? item.ID_Producto)}</td>
                    <td>${escapeHtml(item.Categoria ?? "—")}</td>
                    <td>${numberFormatter.format(item.Cantidad ?? 0)}</td>
                    <td>${currencyFormatter.format(item.Costo_Unitario_CLP ?? 0)}</td>
                    <td>${currencyFormatter.format(item.Total_Linea_CLP ?? 0)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5" class="table-message">Sin productos asociados.</td></tr>`;
        purchaseDetailPanel.hidden = false;
        purchaseDetailPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        console.error("Error al cargar el detalle de compra:", error);
        showNotification("No fue posible cargar el detalle de la compra.");
    }
}


function renderMarginLines() {
    const search = marginSearch.value
        .trim()
        .toLocaleLowerCase("es");
    const category = marginCategoryFilter.value;
    const filtered = marginSales.filter((item) => {
        const productName = String(
            item.Nombre_Producto ?? ""
        ).toLocaleLowerCase("es");
        const productId = String(
            item.ID_Producto ?? ""
        ).toLocaleLowerCase("es");
        const saleId = String(
            item.ID_Venta ?? ""
        ).toLocaleLowerCase("es");

        return (
            (!search ||
                productName.includes(search) ||
                productId.includes(search) ||
                saleId.includes(search)) &&
            (!category || item.Categoria === category)
        );
    });

    document.querySelector("#marginLineCount").textContent =
        `${filtered.length} líneas`;
    marginLinesBody.innerHTML = filtered.length
        ? filtered.map((item) => `
            <tr>
                <td>${formatDate(item.Fecha)}</td>
                <td>${escapeHtml(item.ID_Venta)}</td>
                <td>${escapeHtml(item.Nombre_Producto ?? item.ID_Producto)}</td>
                <td>${escapeHtml(item.Categoria ?? "—")}</td>
                <td>${numberFormatter.format(item.Cantidad ?? 0)}</td>
                <td>${currencyFormatter.format(item.Precio_Unitario_CLP ?? 0)}</td>
                <td>${numberFormatter.format(item.Descuento_Porcentaje ?? 0)}%</td>
                <td>${currencyFormatter.format(item.Total_Linea_CLP ?? 0)}</td>
                <td>${currencyFormatter.format(
                    item.Costo_Unitario_Referencia_CLP ?? 0
                )}</td>
                <td>${currencyFormatter.format(
                    item.Margen_Bruto_Linea_CLP ?? 0
                )}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="10" class="table-message">No hay líneas con esos filtros.</td></tr>`;
}


function renderMarginSummaries(summary) {
    const indicators = summary.indicadores ?? {};
    const revenue = Number(indicators.ingresos_clp ?? 0);
    const grossMargin = Number(indicators.margen_bruto_clp ?? 0);
    const marginPercent = revenue > 0
        ? grossMargin / revenue * 100
        : 0;

    document.querySelector("#marginRevenue").textContent =
        currencyFormatter.format(revenue);
    document.querySelector("#marginGross").textContent =
        currencyFormatter.format(grossMargin);
    document.querySelector("#marginPercent").textContent =
        `${numberFormatter.format(marginPercent)}%`;
    document.querySelector("#marginLeader").textContent =
        indicators.producto_lider ?? "—";

    const categories = new Map();
    const productsByMargin = new Map();

    marginSales.forEach((item) => {
        const category = item.Categoria ?? "Sin categoría";
        const categoryTotals = categories.get(category) ?? {
            units: 0,
            sales: 0,
            margin: 0
        };
        categoryTotals.units += Number(item.Cantidad ?? 0);
        categoryTotals.sales += Number(item.Total_Linea_CLP ?? 0);
        categoryTotals.margin += Number(
            item.Margen_Bruto_Linea_CLP ?? 0
        );
        categories.set(category, categoryTotals);

        const productId = item.ID_Producto;
        const productTotals = productsByMargin.get(productId) ?? {
            name: item.Nombre_Producto ?? productId,
            category,
            units: 0,
            margin: 0
        };
        productTotals.units += Number(item.Cantidad ?? 0);
        productTotals.margin += Number(
            item.Margen_Bruto_Linea_CLP ?? 0
        );
        productsByMargin.set(productId, productTotals);
    });

    const categoryRows = [...categories.entries()]
        .sort((a, b) => b[1].sales - a[1].sales);
    marginCategoryBody.innerHTML = categoryRows.length
        ? categoryRows.map(([name, values]) => `
            <tr>
                <td>${escapeHtml(name)}</td>
                <td>${numberFormatter.format(values.units)}</td>
                <td>${currencyFormatter.format(values.sales)}</td>
                <td>${currencyFormatter.format(values.margin)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="4" class="table-message">No hay datos.</td></tr>`;

    const productRows = [...productsByMargin.values()]
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 10);
    marginRankingBody.innerHTML = productRows.length
        ? productRows.map((product) => `
            <tr>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.category)}</td>
                <td>${numberFormatter.format(product.units)}</td>
                <td>${currencyFormatter.format(product.margin)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="4" class="table-message">No hay datos.</td></tr>`;
}


async function loadMargins() {
    if (marginsLoaded) {
        return;
    }

    try {
        const [summary, detailResponse] = await Promise.all([
            requestJson("/api/resumen"),
            requestJson("/api/detalle-ventas")
        ]);

        marginSales = detailResponse.datos ?? [];
        populateFilter(
            marginCategoryFilter,
            marginSales.map((item) => item.Categoria),
            "Todas las categorías"
        );
        renderMarginSummaries(summary);
        renderMarginLines();
        marginsLoaded = true;
    } catch (error) {
        console.error("Error al cargar costos y márgenes:", error);
        marginLinesBody.innerHTML = `
            <tr><td colspan="10" class="table-message error">
                No fue posible cargar el detalle de costos y márgenes.
            </td></tr>
        `;
        showNotification("No fue posible cargar costos y márgenes.");
    }
}


function renderPromotions() {
    const filtered = promotions.filter(
        (promotion) =>
            !promotionStatusFilter.value ||
            promotion.Estado === promotionStatusFilter.value
    );

    document.querySelector("#promotionCount").textContent =
        `${filtered.length} promociones`;
    promotionsTableBody.innerHTML = filtered.length
        ? filtered.map((promotion) => `
            <tr>
                <td>${escapeHtml(promotion.ID_Promo)}</td>
                <td>${escapeHtml(promotion.Nombre)}</td>
                <td>${escapeHtml(promotion.Tipo)}</td>
                <td>${numberFormatter.format(
                    promotion.Valor_Porcentaje ?? 0
                )}%</td>
                <td>${formatDate(promotion.Inicio)}</td>
                <td>${formatDate(promotion.Fin)}</td>
                <td>${escapeHtml(promotion.Aplica_A)}</td>
                <td>${escapeHtml(promotion.Estado)}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="8" class="table-message">No hay promociones para este estado.</td></tr>`;
}


async function loadPromotions() {
    if (promotionsLoaded) {
        return;
    }

    try {
        const response = await requestJson("/api/promociones");
        promotions = response.datos ?? [];
        populateFilter(
            promotionStatusFilter,
            promotions.map((promotion) => promotion.Estado),
            "Todos los estados"
        );
        renderPromotions();
        promotionsLoaded = true;
    } catch (error) {
        console.error("Error al cargar promociones:", error);
        promotionsTableBody.innerHTML = `
            <tr><td colspan="8" class="table-message error">
                No fue posible cargar las promociones.
            </td></tr>
        `;
        showNotification("No fue posible cargar las promociones.");
    }
}


async function loadUsers() {
    if (usersLoaded) {
        return;
    }

    try {
        const response = await requestJson("/api/usuarios");
        demoUsers = response.datos ?? [];
        document.querySelector("#usersCount").textContent =
            `${demoUsers.length} usuarios`;
        usersTableBody.innerHTML = demoUsers.length
            ? demoUsers.map((user) => `
                <tr>
                    <td>${escapeHtml(user.ID_Usuario)}</td>
                    <td>${escapeHtml(user.Nombre_Demo)}</td>
                    <td>${escapeHtml(user.Rol)}</td>
                    <td>${escapeHtml(user.Estado)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" class="table-message">No hay usuarios.</td></tr>`;
        usersLoaded = true;
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        usersTableBody.innerHTML = `
            <tr><td colspan="4" class="table-message error">
                No fue posible cargar los usuarios.
            </td></tr>
        `;
        showNotification("No fue posible cargar los usuarios.");
    }
}


function downloadCsv(filename, columns, rows) {
    if (!rows.length) {
        showNotification("No hay datos disponibles para exportar.");
        return;
    }

    const header = columns
        .map(([, label]) => escapeCsvValue(label))
        .join(";");
    const csvRows = rows.map((row) =>
        columns
            .map(([key]) => escapeCsvValue(row[key]))
            .join(";")
    );
    const blob = new Blob(
        [`\uFEFF${[header, ...csvRows].join("\r\n")}`],
        { type: "text/csv;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotification("Archivo CSV exportado.");
}


function exportCurrentSales() {
    downloadCsv(
        "ventas_farmavital.csv",
        [
            ["ID_Venta", "N.º venta"],
            ["Fecha", "Fecha"],
            ["ID_Usuario", "ID usuario"],
            ["Medio_Pago", "Medio de pago"],
            ["Subtotal_CLP", "Subtotal CLP"],
            ["Descuento_CLP", "Descuento CLP"],
            ["Total_CLP", "Total CLP"],
            ["Estado", "Estado"]
        ],
        filteredSales
    );
}


function exportCurrentPurchases() {
    downloadCsv(
        "compras_farmavital.csv",
        [
            ["ID_Compra", "N.º compra"],
            ["Fecha", "Fecha"],
            ["Proveedor", "Proveedor"],
            ["Estado", "Estado"],
            ["Total_CLP", "Total CLP"]
        ],
        filteredPurchases
    );
}


function exportMarginLines() {
    const search = marginSearch.value
        .trim()
        .toLocaleLowerCase("es");
    const category = marginCategoryFilter.value;
    const rows = marginSales.filter((item) => {
        const values = [
            item.Nombre_Producto,
            item.ID_Producto,
            item.ID_Venta
        ].join(" ").toLocaleLowerCase("es");

        return (
            (!search || values.includes(search)) &&
            (!category || item.Categoria === category)
        );
    });

    downloadCsv(
        "costos_margenes_farmavital.csv",
        [
            ["Fecha", "Fecha"],
            ["ID_Venta", "N.º venta"],
            ["ID_Producto", "Código producto"],
            ["Nombre_Producto", "Producto"],
            ["Categoria", "Categoría"],
            ["Cantidad", "Unidades"],
            ["Precio_Unitario_CLP", "Precio unitario CLP"],
            ["Descuento_Porcentaje", "Descuento %"],
            ["Total_Linea_CLP", "Total línea CLP"],
            [
                "Costo_Unitario_Referencia_CLP",
                "Costo unitario CLP"
            ],
            ["Margen_Bruto_Linea_CLP", "Margen bruto CLP"]
        ],
        rows
    );
}


function exportPromotions() {
    const rows = promotions.filter(
        (promotion) =>
            !promotionStatusFilter.value ||
            promotion.Estado === promotionStatusFilter.value
    );

    downloadCsv(
        "promociones_farmavital.csv",
        [
            ["ID_Promo", "Código"],
            ["Nombre", "Promoción"],
            ["Tipo", "Tipo"],
            ["Valor_Porcentaje", "Descuento %"],
            ["Inicio", "Inicio"],
            ["Fin", "Fin"],
            ["Aplica_A", "Aplica a"],
            ["Estado", "Estado"]
        ],
        rows
    );
}


/* Eventos dos produtos */

productSearch.addEventListener(
    "input",
    applyProductFilters
);

categoryFilter.addEventListener(
    "change",
    applyProductFilters
);

statusFilter.addEventListener(
    "change",
    applyProductFilters
);

productTableBody.addEventListener("click", (event) => {
    const button = event.target.closest(
        "[data-edit-product]"
    );

    if (button) {
        editProduct(button.dataset.editProduct);
    }
});

newProductButton.addEventListener("click", () => {
    resetProductForm();

    productFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    productCode.focus();
});

cancelProductButton.addEventListener(
    "click",
    resetProductForm
);

deactivateProductButton.addEventListener(
    "click",
    deactivateCurrentProduct
);

exportProductsButton.addEventListener(
    "click",
    exportProductsCsv
);
exportSalesButton.addEventListener(
    "click",
    exportSalesCsv
);
exportSalesPageButton.addEventListener(
    "click",
    exportCurrentSales
);
document.querySelector("#salesDateFrom").addEventListener(
    "change",
    applySalesFilters
);
document.querySelector("#salesDateTo").addEventListener(
    "change",
    applySalesFilters
);
salesPaymentFilter.addEventListener("change", applySalesFilters);
salesStatusFilter.addEventListener("change", applySalesFilters);
document.querySelector("#resetSalesFilters").addEventListener(
    "click",
    () => {
        salesDateFrom.value = "";
        salesDateTo.value = "";
        salesPaymentFilter.value = "";
        salesStatusFilter.value = "";
        applySalesFilters();
    }
);
document.querySelector("#salesPreviousPage").addEventListener(
    "click",
    () => {
        salesPageNumber -= 1;
        renderSales();
    }
);
document.querySelector("#salesNextPage").addEventListener(
    "click",
    () => {
        salesPageNumber += 1;
        renderSales();
    }
);
salesTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sale-id]");

    if (button) {
        showSaleDetails(button.dataset.saleId);
    }
});
document.querySelector("#closeSaleDetail").addEventListener(
    "click",
    () => {
        saleDetailPanel.hidden = true;
    }
);

purchaseDateFrom.addEventListener("change", applyPurchaseFilters);
purchaseDateTo.addEventListener("change", applyPurchaseFilters);
purchaseSupplierFilter.addEventListener(
    "change",
    applyPurchaseFilters
);
purchaseStatusFilter.addEventListener(
    "change",
    applyPurchaseFilters
);
document.querySelector("#resetPurchaseFilters").addEventListener(
    "click",
    () => {
        purchaseDateFrom.value = "";
        purchaseDateTo.value = "";
        purchaseSupplierFilter.value = "";
        purchaseStatusFilter.value = "";
        applyPurchaseFilters();
    }
);
purchasesTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-purchase-id]");

    if (button) {
        showPurchaseDetails(button.dataset.purchaseId);
    }
});
document.querySelector("#closePurchaseDetail").addEventListener(
    "click",
    () => {
        purchaseDetailPanel.hidden = true;
    }
);
document.querySelector("#exportPurchasesButton").addEventListener(
    "click",
    exportCurrentPurchases
);

marginSearch.addEventListener("input", renderMarginLines);
marginCategoryFilter.addEventListener("change", renderMarginLines);
document.querySelector("#exportMarginsButton").addEventListener(
    "click",
    exportMarginLines
);
promotionStatusFilter.addEventListener(
    "change",
    renderPromotions
);
document.querySelector("#exportPromotionsButton").addEventListener(
    "click",
    exportPromotions
);

productForm.addEventListener("submit", saveProduct);


/* Funcionalidades ainda não implementadas */

document
    .querySelectorAll(
        "[data-coming-soon]:not([data-page])"
    )
    .forEach((element) => {
        element.addEventListener("click", () => {
            showNotification(
                element.dataset.comingSoon
            );
        });
    });


/* Inicialização */

const initialPage = window.location.hash.slice(1) || "inicio";

navigateToPage(initialPage, false);
loadDashboard();