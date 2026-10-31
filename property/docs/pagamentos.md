# XMR e XNO no Property

Atualizado em 2026-10-31. A mudança incorpora o requisito do commit `55e379c9dbdf8637b32422d32e982460aa5862e5`.

## Implementado e planejado

O cliente publica preços de ofertas em BTC, XMR ou XNO e lê campanhas assinadas que declaram essas moedas. Ele verifica formato e assinatura Nostr. Não contém carteira, checkout, cobrança, confirmação de blockchain ou reembolso automático. Referências de pagamento em campanhas são declarações do node; a interface não as apresenta como pagamentos verificados.

| Moeda | Unidade mínima | Unidades por moeda | Limite do campo inteiro |
|---|---|---|---|
| BTC (Bitcoin) | satoshi | 10⁸ | 21 milhões de BTC em satoshis |
| XNO (Nano) | raw | 10³⁰ | uint128 |
| XMR (Monero) | piconero | 10¹² | uint64 |

Conversões usam BigInt e strings decimais. Não há câmbio entre moedas. Os limites são de representação, não saldo ou oferta monetária disponível. Referências: [unidades Nano](https://docs.nano.org/protocol-design/distribution-and-units/), [unidades Monero](https://www.getmonero.org/resources/moneropedia/atomic-units.html) e [Wallet RPC Monero](https://www.getmonero.org/resources/developer-guides/wallet-rpc.html).

## Ofertas NIP-15

O draft exige `price` numérico; esse campo é somente compatibilidade e pode perder precisão. O preço exato do Property é `price_atomic` como string inteira junto de `currency: "BTC"`, `"XNO"` ou `"XMR"`. Para XNO, publicar também `price_raw` para clientes antigos. Nunca interpretar `price_raw` como piconero. Cada moeda tem sua vitrine; mudar a moeda de uma oferta seleciona a vitrine correspondente. Checkout futuro deve usar exclusivamente o inteiro validado, sem calcular dinheiro com `Number`.

## Campanhas

Eventos são kind 30078, com um único `t` e um único `d`:

```json
{
  "tags": [["t", "property-sponsored-v2"], ["d", "property-sponsored-v2:123e4567-e89b-42d3-a456-426614174000"]],
  "content": "JSON do payload assinado abaixo"
}
```

O payload mantém `title`, `body`, `link`, `expires_at`, `offer_event_id`, `acceptance_event_id` e imagem PNG/JPEG inline limitada. Acrescenta `currency`, `amount_atomic` e `payment_tx_id` (identificador hexadecimal de 64 caracteres). Não aceita `amount_raw` ou `payment_block_hash` em v2. O parser exige montante positivo, prazo limitado e moeda conhecida. `node_pubkey`, quando presente, precisa coincidir com o signatário.

O leitor aceita também `liberdade-sponsored-v1`, estritamente como XNO, com `amount_raw` e `payment_block_hash`. Nunca reinterpreta uma campanha antiga como Monero nem altera eventos já assinados. O opt-in, bloqueio local e limite local de repetição continuam aplicáveis. O app não envia eventos de clique/visualização.

## Engine futura: critérios obrigatórios

1. Oferta e aceite assinados vinculam moeda, unidade, montante, campanha, destinatário, expiração e condições de devolução. Recusa anterior ao pagamento não gera cobrança.
2. Adaptadores separados para Nano e Monero, com carteiras distintas da chave Nostr, RPC local autenticado, limites e logs sanitizados. Nenhuma seed ou credencial RPC na PWA ou em eventos Nostr.
3. Associar pagamento a endereço exclusivo; em Monero, avaliar subendereço por oferta e verificar recebimento pela carteira sincronizada. Um hash público isolado não basta.
4. Nano exige confirmação e recebimento processado. Monero exige política explícita de confirmações, desbloqueio, taxas e tratamento de reorganização; publicar apenas após o gate da moeda. Registrar a política adotada e sua validação antes de ativar pagamentos.
5. Reembolsos idempotentes e retomáveis, com reconciliação de recebimento, taxa e valor líquido. Monero não revela um endereço de origem utilizável para devolução: obter endereço de reembolso autenticado no acordo. Nunca copiar a regra Nano de devolver automaticamente à origem para XMR.
6. Não prometer custo zero ou viabilidade de micropagamento em XMR: definir mínimo e política de taxas com evidência. Sem fundos de produção nos testes.
7. Usar Nano testnet/local e Monero regtest/stagenet; testar pagamento duplicado, atraso, valor/moeda errados, carteira não sincronizada, falhas, reorganização, expiração e devolução. Somente ativar após testes e revisão independente.

## Bitcoin

BTC foi incluído por solicitação posterior do mantenedor. Valores usam satoshis inteiros (8 casas), até 21 milhões de BTC. Ofertas e campanhas v2 aceitam a moeda; isso não ativa transferências. Referência: [unidades Bitcoin](https://bitcoin.org/en/vocabulary).

O adaptador futuro Bitcoin deve usar endereço exclusivo por oferta, confirmar via node/carteira local, verificar valor e output, tratar mempool, confirmações, substituição/conflitos e reorganizações. O txid declarado não comprova o recebimento. Reembolsos exigem endereço autenticado acordado com o pagador e política explícita de taxas/valor líquido, sem presumir endereço de origem. Testar em regtest/signet sem fundos reais. Lightning é um fluxo separado e ainda não está implementado; não confundir satoshi on-chain com millisatoshi.
