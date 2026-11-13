# Prototipo-Coil

Protótipo web de gestão comercial para a FarmaVital, criado em parceria com Vicenta Dods. A aplicação usa FastAPI no backend e HTML, CSS e JavaScript no frontend. Os dados são fictícios e carregados de `FarmaVital_Datos_Ficticios_Pruebas_MVP.xlsx`.

## Executar localmente

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Abra `http://127.0.0.1:8000`. A documentação interativa da API fica em `http://127.0.0.1:8000/docs`.

## Seções da aplicação

- **Início:** indicadores, vendas por mês e categoria, produtos mais vendidos e alertas de estoque.
- **Produtos:** catálogo, busca, filtros e exportação CSV.
- **Vendas:** histórico com filtros, paginação, exportação CSV e detalhes dos itens vendidos.
- **Compras e inventário:** compras com filtros e detalhes, além do estoque por produto.
- **Custos e margens:** resumo de rentabilidade, agrupamentos por categoria e produto e linhas de vendas.
- **Promoções e ações:** regras de promoção e filtros por estado.
- **Usuarios demo:** usuários e funções de demonstração; não é uma tela de login.

## Dados e persistência

A aplicação consulta as abas `Productos`, `Ventas`, `Detalle_Ventas`, `Compras`, `Detalle_Compras`, `Promociones` e `Usuarios`. A aba `Panel_Ejemplo` serve como referência; os indicadores são calculados a partir dos registros operacionais. A planilha é carregada ao iniciar o servidor. As alterações de produtos feitas no protótipo existem somente na sessão do navegador e não são gravadas no Excel.

## API principal

- `GET /api/status` e `GET /api/hojas`
- `GET /api/productos` e `GET /api/productos/{id_producto}`
- `GET /api/ventas`, `GET /api/ventas/{id_venta}` e `GET /api/detalle-ventas`
- `GET /api/compras`, `GET /api/compras/{id_compra}` e `GET /api/detalle-compras`
- `GET /api/promociones`, `GET /api/usuarios` e `GET /api/resumen`
