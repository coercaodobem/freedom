# Relay no Ubuntu

O relay é o Geode do Amethyst reutilizado sob licença MIT. O comando é executado sem root e, por padrão, escuta apenas no loopback para evitar expor um serviço sem TLS à internet.

```bash
./freedom/relay/start.sh
```

- Endereço padrão: `127.0.0.1:7447`.
- Banco persistente: `~/.local/share/liberdade-relay/events.db`.
- Configuração: `~/.config/liberdade-relay/geode.toml`.
- Encerrar: `Ctrl+C`.

Variáveis opcionais:

```bash
LIBERDADE_RELAY_HOST=127.0.0.1 LIBERDADE_RELAY_PORT=7447 ./freedom/relay/start.sh
```

Para bind público, não basta trocar o endereço: coloque TLS e proteção de rede à frente, defina URL canônica no config, limites de tráfego e política de armazenamento. O comando padrão não exige senha, não usa root e não abre firewall.

O runtime Java 21.0.12.1 e o Geode 1.20.0 para Linux x86_64 são incluídos em `dist-parts/` como 130 segmentos binários. `SHA256SUMS` fixa o hash de cada segmento e `manifest.txt` fixa o tamanho e o hash do tarball remontado (`9722c226dc59c45d50f9f8c1e22ad815fd6fb971413c7da3aa7fc36253e6d1a7`). O tarball auditado contém somente a árvore `geode/` gerada pelo build `:geode:geodeImage`; seu conteúdo foi comparado arquivo a arquivo com `geode/build/geode-image/geode`, sem diferenças. As verificações e os limites da proveniência estão em [`dist-parts/PROVENANCE.md`](dist-parts/PROVENANCE.md). O launcher remonta o tarball no diretório privado do usuário, verifica o SHA-256 completo e só então extrai/executa. Não baixa código na execução. Em x86_64 o launcher não exige Java instalado nem root; se os segmentos estiverem ausentes, o build de contingência exige JDK 21 e Gradle.
