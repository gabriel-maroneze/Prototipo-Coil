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

let notificationTimer;


/**
 * Faz uma requisição e retorna o JSON recebido.
 */
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


/**
 * Mostra uma mensagem temporária na parte inferior.
 */
function showNotification(message) {
    window.clearTimeout(notificationTimer);

    notification.textContent = message;
    notification.classList.add("visible");

    notificationTimer = window.setTimeout(() => {
        notification.classList.remove("visible");
    }, 3200);
}


/**
 * Remove o efeito visual de carregamento dos cartões.
 */
function finishKpiLoading() {
    document.querySelectorAll(".kpi-card").forEach((card) => {
        card.classList.remove("loading");
    });
}


/**
 * Preenche os quatro indicadores principais.
 */
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


/**
 * Converte a data retornada pela API para o padrão chileno.
 */
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


/**
 * Preenche a tabela de vendas recentes.
 */
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
        .map((sale) => {
            const total = currencyFormatter.format(
                sale.Total_CLP ?? 0
            );

            return `
                <tr>
                    <td>${formatDate(sale.Fecha)}</td>
                    <td>${sale.ID_Venta ?? "—"}</td>
                    <td>${total}</td>
                </tr>
            `;
        })
        .join("");
}


/**
 * Preenche a tabela de alertas ou apresenta um estado vazio.
 */
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
        .map((product) => {
            const currentStock = numberFormatter.format(
                product.Stock_Actual ?? 0
            );

            const minimumStock = numberFormatter.format(
                product.Stock_Minimo ?? 0
            );

            return `
                <tr>
                    <td>${product.Nombre_Producto ?? "—"}</td>
                    <td>
                        <span class="stock-value">
                            ${currentStock}
                        </span>
                    </td>
                    <td>${minimumStock}</td>
                </tr>
            `;
        })
        .join("");
}


/**
 * Transforma "2026-09" em "septiembre 2026".
 */
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


/**
 * Define o texto mostrado no seletor de período.
 */
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
    const firstYear = firstParts[firstParts.length - 1];
    const lastMonth = lastParts[0];
    const lastYear = lastParts[lastParts.length - 1];

    if (firstYear === lastYear) {
        periodOption.textContent =
            `${firstMonth}–${lastMonth} ${lastYear}`;

        return;
    }

    periodOption.textContent = `${first}–${last}`;
}


/**
 * Apresenta um erro nas tabelas quando a API não responde.
 */
function renderLoadingError() {
    finishKpiLoading();

    totalSalesElement.textContent = "—";
    registeredSalesElement.textContent = "—";
    soldUnitsElement.textContent = "—";
    averageTicketElement.textContent = "—";

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

    periodOption.textContent = "Período no disponible";
}


/**
 * Carrega todos os dados necessários para a tela inicial.
 */
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

        renderLoadingError();

        showNotification(
            "No fue posible cargar los datos. Verifique si la API está funcionando."
        );
    }
}


/**
 * Controla o menu lateral em telas pequenas.
 */
function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("visible");

    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Cerrar menú");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("visible");

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
}

menuButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");

    if (isOpen) {
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


/**
 * Dá retorno para funcionalidades das próximas etapas.
 */
document.querySelectorAll("[data-coming-soon]").forEach(
    (element) => {
        element.addEventListener("click", () => {
            showNotification(element.dataset.comingSoon);
        });
    }
);


/**
 * Inicia o carregamento quando o HTML estiver pronto.
 */
loadDashboard();