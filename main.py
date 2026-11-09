from datetime import date
from pathlib import Path
from typing import Optional
import json

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse


# =========================================================
# CONFIGURAÇÕES
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

EXCEL_PATH = (
    BASE_DIR / "FarmaVital_Datos_Ficticios_Pruebas_MVP.xlsx"
)

ABAS_OBRIGATORIAS = {
    "Productos",
    "Ventas",
    "Detalle_Ventas",
}


# =========================================================
# LEITURA DO EXCEL
# =========================================================

def carregar_planilha() -> dict[str, pd.DataFrame]:
    """
    Lê todas as abas do arquivo Excel.

    O retorno é um dicionário no formato:

    {
        "Productos": DataFrame,
        "Ventas": DataFrame,
        "Detalle_Ventas": DataFrame,
        ...
    }
    """

    if not EXCEL_PATH.exists():
        raise FileNotFoundError(
            "A planilha não foi encontrada.\n"
            f"Caminho esperado: {EXCEL_PATH}"
        )

    try:
        planilha = pd.read_excel(
            EXCEL_PATH,
            sheet_name=None,
            engine="openpyxl"
        )

    except Exception as erro:
        raise RuntimeError(
            f"Não foi possível abrir a planilha: {erro}"
        ) from erro

    abas_ausentes = ABAS_OBRIGATORIAS.difference(
        planilha.keys()
    )

    if abas_ausentes:
        nomes = ", ".join(sorted(abas_ausentes))

        raise RuntimeError(
            f"A planilha não contém as abas obrigatórias: {nomes}"
        )

    return planilha


def dataframe_para_lista(
    dataframe: pd.DataFrame
) -> list[dict]:
    """
    Converte um DataFrame em uma lista de dicionários
    compatível com respostas JSON.

    A conversão também trata:
    - valores vazios;
    - números do pandas/NumPy;
    - datas.
    """

    texto_json = dataframe.to_json(
        orient="records",
        date_format="iso",
        force_ascii=False
    )

    return json.loads(texto_json)


# A planilha é carregada uma vez durante a inicialização.
# Se o Excel for alterado, reinicie o servidor.
abas = carregar_planilha()


# =========================================================
# APLICAÇÃO FASTAPI
# =========================================================

app = FastAPI(
    title="API FarmaVital",
    description=(
        "API para consulta dos dados fictícios do MVP "
        "de gestão comercial da FarmaVital."
    ),
    version="1.0.0"
)


# =========================================================
# ARQUIVOS DO FRONTEND
# =========================================================

def entregar_arquivo(
    nome_arquivo: str,
    media_type: str
) -> FileResponse:
    """
    Verifica se um arquivo do frontend existe antes
    de enviá-lo ao navegador.
    """

    caminho = BASE_DIR / nome_arquivo

    if not caminho.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Arquivo não encontrado: {nome_arquivo}"
        )

    return FileResponse(
        path=caminho,
        media_type=media_type
    )


@app.get("/", include_in_schema=False)
def pagina_inicial() -> FileResponse:
    """Entrega a página principal da aplicação."""

    return entregar_arquivo(
        nome_arquivo="index.html",
        media_type="text/html"
    )


@app.get("/style.css", include_in_schema=False)
def arquivo_css() -> FileResponse:
    """Entrega o arquivo de estilos."""

    return entregar_arquivo(
        nome_arquivo="style.css",
        media_type="text/css"
    )


@app.get("/script.js", include_in_schema=False)
def arquivo_javascript() -> FileResponse:
    """Entrega o JavaScript do frontend."""

    return entregar_arquivo(
        nome_arquivo="script.js",
        media_type="application/javascript"
    )


# =========================================================
# STATUS DA API
# =========================================================

@app.get(
    "/api/status",
    tags=["Sistema"],
    summary="Verificar o funcionamento da API"
)
def status_api() -> dict:
    """
    Confirma que a API está funcionando e mostra
    as abas encontradas no Excel.
    """

    return {
        "status": "ok",
        "mensagem": "API FarmaVital funcionando",
        "arquivo": EXCEL_PATH.name,
        "abas": list(abas.keys())
    }


# =========================================================
# ABAS DO EXCEL
# =========================================================

@app.get(
    "/api/hojas",
    tags=["Sistema"],
    summary="Listar as abas da planilha"
)
def listar_abas() -> list[dict]:
    """
    Retorna o nome de cada aba e a quantidade de
    registros encontrados nela.
    """

    resultado = []

    for nome, dataframe in abas.items():
        resultado.append({
            "nombre": nome,
            "registros": int(len(dataframe))
        })

    return resultado


# =========================================================
# PRODUTOS
# =========================================================

@app.get(
    "/api/productos",
    tags=["Produtos"],
    summary="Listar e filtrar produtos"
)
def listar_produtos(
    busqueda: Optional[str] = Query(
        default=None,
        description="Texto presente no nome do produto."
    ),
    categoria: Optional[str] = Query(
        default=None,
        description="Categoria exata do produto."
    ),
    estado: Optional[str] = Query(
        default=None,
        description="Estado do produto, como Activo."
    )
) -> dict:
    """
    Retorna os produtos da aba Productos.

    Exemplos:

    /api/productos

    /api/productos?busqueda=solar

    /api/productos?categoria=Vitaminas

    /api/productos?estado=Activo
    """

    produtos = abas["Productos"].copy()

    if busqueda and busqueda.strip():
        texto = busqueda.strip()

        produtos = produtos[
            produtos["Nombre_Producto"]
            .astype(str)
            .str.contains(
                texto,
                case=False,
                na=False,
                regex=False
            )
        ]

    if categoria and categoria.strip():
        texto = categoria.strip().lower()

        produtos = produtos[
            produtos["Categoria"]
            .astype(str)
            .str.lower()
            == texto
        ]

    if estado and estado.strip():
        texto = estado.strip().lower()

        produtos = produtos[
            produtos["Estado"]
            .astype(str)
            .str.lower()
            == texto
        ]

    produtos = produtos.sort_values(
        by="Nombre_Producto"
    )

    return {
        "total": int(len(produtos)),
        "datos": dataframe_para_lista(produtos)
    }


@app.get(
    "/api/productos/{id_producto}",
    tags=["Produtos"],
    summary="Consultar um produto pelo identificador"
)
def consultar_produto(id_producto: str) -> dict:
    """
    Busca um produto específico pelo ID_Producto.

    Exemplo:

    /api/productos/MED008
    """

    produtos = abas["Productos"]

    resultado = produtos[
        produtos["ID_Producto"]
        .astype(str)
        .str.upper()
        == id_producto.upper()
    ]

    if resultado.empty:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado."
        )

    return dataframe_para_lista(resultado)[0]


# =========================================================
# VENDAS
# =========================================================

@app.get(
    "/api/ventas",
    tags=["Vendas"],
    summary="Listar e filtrar vendas"
)
def listar_vendas(
    desde: Optional[date] = Query(
        default=None,
        description="Data inicial no formato AAAA-MM-DD."
    ),
    hasta: Optional[date] = Query(
        default=None,
        description="Data final no formato AAAA-MM-DD."
    ),
    medio_pago: Optional[str] = Query(
        default=None,
        description="Meio de pagamento."
    ),
    estado: Optional[str] = Query(
        default=None,
        description="Estado da venda, como Completada."
    ),
    limite: Optional[int] = Query(
        default=None,
        ge=1,
        le=1000,
        description="Quantidade máxima de vendas retornadas."
    )
) -> dict:
    """
    Retorna o histórico de vendas.

    Exemplos:

    /api/ventas

    /api/ventas?desde=2026-09-01

    /api/ventas?desde=2026-09-01&hasta=2026-09-30

    /api/ventas?medio_pago=Débito
    """

    vendas = abas["Ventas"].copy()

    vendas["Fecha"] = pd.to_datetime(
        vendas["Fecha"],
        errors="coerce"
    )

    if desde:
        vendas = vendas[
            vendas["Fecha"] >= pd.Timestamp(desde)
        ]

    if hasta:
        vendas = vendas[
            vendas["Fecha"] <= pd.Timestamp(hasta)
        ]

    if medio_pago and medio_pago.strip():
        texto = medio_pago.strip().lower()

        vendas = vendas[
            vendas["Medio_Pago"]
            .astype(str)
            .str.lower()
            == texto
        ]

    if estado and estado.strip():
        texto = estado.strip().lower()

        vendas = vendas[
            vendas["Estado"]
            .astype(str)
            .str.lower()
            == texto
        ]

    vendas = vendas.sort_values(
        by="Fecha",
        ascending=False
    )

    total_encontrado = int(len(vendas))

    if limite:
        vendas = vendas.head(limite)

    return {
        "total": total_encontrado,
        "mostrados": int(len(vendas)),
        "datos": dataframe_para_lista(vendas)
    }


@app.get(
    "/api/ventas/{id_venta}",
    tags=["Vendas"],
    summary="Consultar uma venda e seus produtos"
)
def consultar_venda(id_venta: str) -> dict:
    """
    Retorna o cabeçalho de uma venda e suas linhas.

    Exemplo:

    /api/ventas/V00001
    """

    vendas = abas["Ventas"]
    detalhes = abas["Detalle_Ventas"]
    produtos = abas["Productos"]

    venda_encontrada = vendas[
        vendas["ID_Venta"]
        .astype(str)
        .str.upper()
        == id_venta.upper()
    ]

    if venda_encontrada.empty:
        raise HTTPException(
            status_code=404,
            detail="Venda não encontrada."
        )

    linhas = detalhes[
        detalhes["ID_Venta"]
        .astype(str)
        .str.upper()
        == id_venta.upper()
    ].copy()

    # Acrescenta o nome do produto ao detalhe da venda.
    linhas = linhas.merge(
        produtos[
            ["ID_Producto", "Nombre_Producto", "Categoria"]
        ],
        on="ID_Producto",
        how="left"
    )

    return {
        "venta": dataframe_para_lista(
            venda_encontrada
        )[0],
        "detalle": dataframe_para_lista(linhas)
    }


# =========================================================
# INDICADORES DO DASHBOARD
# =========================================================

@app.get(
    "/api/resumen",
    tags=["Dashboard"],
    summary="Calcular os indicadores comerciais"
)
def resumo() -> dict:
    """
    Calcula os principais indicadores diretamente
    a partir dos registros do Excel.

    Os valores não são copiados da aba Panel_Ejemplo.
    """

    vendas = abas["Ventas"].copy()
    detalhes = abas["Detalle_Ventas"].copy()
    produtos = abas["Productos"].copy()

    # -----------------------------------------------------
    # VENDAS COMPLETADAS
    # -----------------------------------------------------

    vendas_completadas = vendas[
        vendas["Estado"]
        .astype(str)
        .str.lower()
        == "completada"
    ].copy()

    ids_vendas_completadas = set(
        vendas_completadas["ID_Venta"].tolist()
    )

    detalhes_completados = detalhes[
        detalhes["ID_Venta"].isin(
            ids_vendas_completadas
        )
    ].copy()

    quantidade_vendas = int(
        len(vendas_completadas)
    )

    total_vendas = int(
        vendas_completadas["Total_CLP"].sum()
    )

    if quantidade_vendas > 0:
        ticket_medio = round(
            total_vendas / quantidade_vendas
        )
    else:
        ticket_medio = 0

    unidades_vendidas = int(
        detalhes_completados["Cantidad"].sum()
    )

    margem_bruta = int(
        detalhes_completados[
            "Margen_Bruto_Linea_CLP"
        ].sum()
    )

    # -----------------------------------------------------
    # PRODUTO MAIS VENDIDO
    # -----------------------------------------------------

    ranking = (
        detalhes_completados
        .groupby(
            "ID_Producto",
            as_index=False
        )["Cantidad"]
        .sum()
        .sort_values(
            by="Cantidad",
            ascending=False
        )
    )

    produto_lider = None
    id_produto_lider = None
    unidades_produto_lider = 0

    if not ranking.empty:
        primeira_posicao = ranking.iloc[0]

        id_produto_lider = str(
            primeira_posicao["ID_Producto"]
        )

        unidades_produto_lider = int(
            primeira_posicao["Cantidad"]
        )

        produto_encontrado = produtos[
            produtos["ID_Producto"]
            == id_produto_lider
        ]

        if not produto_encontrado.empty:
            produto_lider = produto_encontrado.iloc[0][
                "Nombre_Producto"
            ]

    # -----------------------------------------------------
    # ALERTAS DE ESTOQUE
    # -----------------------------------------------------

    produtos_estoque_baixo = produtos[
        produtos["Stock_Actual"]
        <= produtos["Stock_Minimo"]
    ].copy()

    # -----------------------------------------------------
    # VENDAS POR MÊS
    # -----------------------------------------------------

    vendas_completadas["Fecha"] = pd.to_datetime(
        vendas_completadas["Fecha"],
        errors="coerce"
    )

    vendas_completadas = vendas_completadas.dropna(
        subset=["Fecha"]
    )

    vendas_completadas["Mes"] = (
        vendas_completadas["Fecha"]
        .dt.to_period("M")
        .astype(str)
    )

    vendas_por_mes = (
        vendas_completadas
        .groupby(
            "Mes",
            as_index=False
        )["Total_CLP"]
        .sum()
        .rename(
            columns={
                "Total_CLP": "Ventas_CLP"
            }
        )
        .sort_values("Mes")
    )

    # -----------------------------------------------------
    # VENDAS POR CATEGORIA
    # -----------------------------------------------------

    detalhes_com_categorias = detalhes_completados.merge(
        produtos[
            ["ID_Producto", "Categoria"]
        ],
        on="ID_Producto",
        how="left"
    )

    vendas_por_categoria = (
        detalhes_com_categorias
        .groupby(
            "Categoria",
            as_index=False
        )
        .agg(
            Ventas_CLP=("Total_Linea_CLP", "sum"),
            Unidades=("Cantidad", "sum")
        )
        .sort_values(
            by="Ventas_CLP",
            ascending=False
        )
    )

    # -----------------------------------------------------
    # RANKING COM NOMES DOS PRODUTOS
    # -----------------------------------------------------

    ranking_completo = ranking.merge(
        produtos[
            [
                "ID_Producto",
                "Nombre_Producto",
                "Categoria"
            ]
        ],
        on="ID_Producto",
        how="left"
    )

    ranking_completo = ranking_completo.rename(
        columns={
            "Cantidad": "Unidades_Vendidas"
        }
    )

    # Retorna os 10 produtos com mais unidades vendidas.
    ranking_completo = ranking_completo.head(10)

    return {
        "indicadores": {
            "ventas_completadas": quantidade_vendas,
            "ingresos_clp": total_vendas,
            "ticket_promedio_clp": ticket_medio,
            "unidades_vendidas": unidades_vendidas,
            "margen_bruto_clp": margem_bruta,
            "id_producto_lider": id_produto_lider,
            "producto_lider": produto_lider,
            "unidades_producto_lider": (
                unidades_produto_lider
            ),
            "productos_stock_bajo": int(
                len(produtos_estoque_baixo)
            )
        },
        "ventas_por_mes": dataframe_para_lista(
            vendas_por_mes
        ),
        "ventas_por_categoria": dataframe_para_lista(
            vendas_por_categoria
        ),
        "ranking_productos": dataframe_para_lista(
            ranking_completo
        ),
        "alertas_stock": dataframe_para_lista(
            produtos_estoque_baixo
        )
    }