# Liberdade

Cliente Nostr em PWA, com identidade guardada no aparelho, mensagens privadas NIP-17 e relay Geode portátil para Ubuntu. O código do produto está em [`freedom/`](freedom/README.md); a aplicação não depende de servidores do Liberdade para transportar mensagens.

Esta branch de MVP parte do commit upstream [948135f](https://github.com/vitorpamplona/amethyst/tree/948135f7dbbae81d79a0b985282ce673397a7618). O código reutilizado mantém os avisos e a licença MIT originais. O teste de descriptografia usa dados sintéticos e chave efêmera gerada localmente. Nesta importação direta, a branch é registrada como um snapshot; o histórico Git completo permanece no repositório upstream. O app web, os assets de execução e o pacote do relay estão dentro deste repositório. O cliente não baixa scripts executáveis de CDNs durante o uso.

## Executar

App publicado: [coercaodobem.github.io/freedom](https://coercaodobem.github.io/freedom/).

Sirva a PWA localmente:

```bash
python3 -m http.server 8080 --directory freedom/web
```

Abra `http://localhost:8080`. Para iniciar um relay local em Ubuntu:

```bash
./freedom/relay/start.sh
```

O relay escuta por padrão somente em `127.0.0.1:7447`. Consulte [`freedom/README.md`](freedom/README.md) para limites, publicação e configurações.

## Decisões e validação

- [Identidade do projeto](freedom/docs/identidade-do-projeto.md)
- [Plano central de execução](freedom/docs/plano-central.md)
- [Plano de testes central](freedom/docs/plano-de-testes-central.md)

O MVP segue em validação. A ponte voluntária entre relays funciona apenas enquanto a PWA está ativa; operações contínuas devem usar o relay de PC. Campanhas XNO, execução móvel em segundo plano e pagamentos ainda não estão disponíveis.

## Origem e licença

O código reaproveitado do Amethyst mantém os avisos e a licença MIT originais. Esta adaptação registra o commit-base e as dependências em [`freedom/`](freedom/README.md). Veja [`LICENSE`](LICENSE) e o inventário de origem antes de redistribuir.
