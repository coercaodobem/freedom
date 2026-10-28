# Liberdade

Cliente Nostr com interface PWA, identidade criada e protegida localmente, mensagens privadas NIP-17 e conexão direta com relays. Esta pasta reúne o app web, o comando de relay para Ubuntu e a documentação de adaptação do Amethyst.

## Estado da branch `modelo-mvp`

O código upstream usado como base está registrado no commit `948135f7dbbae81d79a0b985282ce673397a7618` do Amethyst. O módulo `geode` é reaproveitado como relay standalone. A interface web usa o pacote local e versionado `nostr-tools` 2.25.2 (Unlicense), porque o Quartz KMP upstream não publica um target JavaScript/WASM. Não há carregamento de scripts executáveis de CDN em runtime.

## Abrir a PWA

Sirva `freedom/web` por HTTP(S), por exemplo com `python3 -m http.server 8080 --directory freedom/web`, e acesse `http://localhost:8080`. Para instalar como PWA, o host deve usar HTTPS (localhost é exceção). O shell funciona offline depois da primeira carga; comunicação depende de relays Nostr alcançáveis.

A opção **Ponte entre relays** encaminha eventos públicos assinados entre os relays que a pessoa selecionou. Gift wraps NIP-17 só são encaminhados para os inbox relays da própria identidade; o cliente não decifra o conteúdo para retransmiti-lo. Há limites locais de 60 eventos por minuto e 2 MB de tráfego de saída por minuto, contando o envio a cada relay. A ponte não funciona quando o navegador é suspenso e pode consumir dados móveis.

## Publicar no GitHub Pages

O workflow `.github/workflows/liberdade-pages.yml` publica somente `freedom/web` quando há push à branch `modelo-mvp`. O destino definido é o repositório público `Gymoo/freedom`; a branch atual ainda é local, portanto a URL `https://gymoo.github.io/freedom/` só existirá depois da criação do repositório, do envio da branch e da habilitação de Pages com origem **GitHub Actions**. O workflow usa actions fixadas por commit SHA e não altera a configuração do repositório.

## Iniciar um relay no Ubuntu

Na raiz do checkout, execute:

```bash
./freedom/relay/start.sh
```

O script usa armazenamento persistente em `~/.local/share/liberdade-relay` e por padrão escuta somente em `127.0.0.1:7447`. O pacote portátil incluído na branch contém o relay e seu runtime Java em segmentos; na primeira execução, o script remonta o tarball, valida o hash e extrai os arquivos para o diretório do usuário. Isso é adequado para teste local; para acesso público, configure conscientemente endereço, TLS, firewall e armazenamento.

Com Node.js 22 instalado, `bash freedom/tests/run-smoke.sh` executa os testes locais sem abrir portas. `bash freedom/tests/run-bridge-integration.sh [porta-origem] [porta-destino]` inicia dois relays isolados em `127.0.0.1`, testa replicação/NIP-17/NIP-15 e remove os diretórios temporários ao terminar. `node freedom/tests/relay-soak.mjs` executa o ensaio de 24 horas com reinícios e verificações de persistência.

## Limites conhecidos

- Uma PWA não permanece ativa em segundo plano no celular: iOS e Android podem suspender ou encerrar o navegador.
- O host estático entrega o código da interface; as conexões de dados são abertas pelo cliente aos relays escolhidos.
- A opção de manter a sessão neste aparelho prioriza conveniência e reduz a proteção contra alguém que obtenha acesso ao navegador desbloqueado.
- Hangout e marketplace estão em estágio inicial; pagamentos, custódia, escrow e monetização automática de nodes não são ativados nesta versão.
- A exibição opcional de campanhas valida a assinatura e os campos do evento, usa link HTTPS e mantém imagem inline. O pagamento XNO declarado pelo node não é verificado pelo cliente; a engine de aceite, recebimento e reembolso não existe nesta versão.

Consulte `docs/plano-central.md`, `docs/identidade-do-projeto.md` e `docs/plano-de-testes-central.md` para as decisões e critérios completos.
