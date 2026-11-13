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

let notificationTimer;
let products = [];
let filteredProducts = [];
let editingProductId = null;
let productsLoaded = false;


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
    const validPage = pageName === "productos"
        ? "productos"
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

    if (validPage === "productos") {
        loadProducts();

        if (updateHistory) {
            history.pushState(
                { page: "productos" },
                "",
                "/#productos"
            );
        }
    } else if (updateHistory) {
        history.pushState(
            { page: "inicio" },
            "",
            "/"
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
    const page = window.location.hash === "#productos"
        ? "productos"
        : "inicio";

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
                <td colspan="8" class="table-message">
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
                <td colspan="8" class="table-message error">
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

const initialPage =
    window.location.hash === "#productos"
        ? "productos"
        : "inicio";

navigateToPage(initialPage, false);
loadDashboard();