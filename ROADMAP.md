# Roadmap do Liberdade

Atualizado em 2026-10-30. Este mapa orienta contribuições; não é promessa de prazo ou de funcionalidades concluídas. A branch de trabalho é `modelo-mvp`. Os critérios detalhados estão no [plano central](freedom/docs/plano-central.md) e no [plano de testes](freedom/docs/plano-de-testes-central.md).

## Base disponível para testar

- PWA em HTTPS, cofre local por senha e backup cifrado.
- Mensagens NIP-17 e listas de inbox relays kind 10050, com validações locais.
- Relay Geode portátil para Ubuntu Linux x86_64.
- Ponte voluntária enquanto a PWA está ativa.
- Fluxos iniciais de ofertas e leitura opcional de campanhas assinadas.

Consulte os resultados registrados; a presença de código não comprova todos os fluxos na internet ou em aparelhos reais.

## Prioridade: validar e tornar o MVP utilizável

| Frente | Próximo resultado verificável |
|---|---|
| Primeiro uso e recuperação | Passos claros de criar identidade, exportar backup e restaurar usando dados descartáveis |
| Android e iOS | Matriz de navegador/aparelho, instalação PWA, rede e suspensão com resultados reproduzíveis |
| Acessibilidade | Navegação por teclado, rótulos, foco, contraste e leitura em telas pequenas revisados |
| Relay de PC | Ensaio de 24 horas com log persistente, recuperação após reinício e resultado final comprovado |
| Interoperabilidade | Troca NIP-17 e listas de relays verificadas com outros clientes e versões identificadas |
| Segurança | Revisão independente do cofre, chaves, dependências, CSP e fluxo de mensagens |

## Funcionalidades que exigem implementação e revisão

- Marketplace completo e checkout.
- Engine local de campanhas: oferta, aceite, endereço exclusivo, confirmação XNO/raw, expiração e reembolso idempotente.
- Hangout integrado e validado para o Liberdade.
- Solução de plataforma para colaboração móvel contínua; uma PWA não garante execução permanente com a tela apagada.

Mudanças em pagamentos, chaves e protocolos precisam de desenho discutido antes da implementação. Não há prazos de lançamento definidos para essas frentes.

## Por onde começar a contribuir

Documentar um fluxo de primeiro uso com uma identidade descartável, relatar um problema de acessibilidade ou registrar um teste de instalação PWA são boas contribuições iniciais. Veja as [issues abertas](https://github.com/coercaodobem/freedom/issues), procure `good first issue` e `help wanted`, ou [proponha uma tarefa](https://github.com/coercaodobem/freedom/issues/new/choose). Evite duplicar uma discussão existente e registre ambiente, passos e resultado.

O [guia de contribuição](CONTRIBUTING.md) explica como preparar um fork, validar e abrir um PR. Nenhuma contribuição depende de bounty ou pagamento.
