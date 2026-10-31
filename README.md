# Property

Comunicação pela internet com Nostr, mensagens privadas criptografadas e identidade controlada pela pessoa. O Property é um projeto independente em desenvolvimento, com interface web instalável (PWA) e relay portátil para Windows, Mac, Linux, Android, IOS e Ubuntu, construído a partir de código do Amethyst.

**[Abrir o app](https://coercaodobem.github.io/freedom/) · [Como contribuir](CONTRIBUTING.md) · [Roadmap](ROADMAP.md) · [Reportar um problema](https://github.com/coercaodobem/freedom/issues/new/choose)**

## O que queremos construir

Uma interface simples para conversar, postar e colaborar com uma rede de comunicação descentralizada por Wi-Fi ou rede móvel. A senha protege a chave aleatória criada no aparelho; não existe servidor central de login ou recuperação. O navegador se conecta diretamente aos relays escolhidos pelo usuário.

PCs podem operar relays continuamente. A colaboração da PWA entre relays acontece enquanto o navegador está ativo. Android e iOS podem suspender uma PWA em segundo plano; manter um nó móvel permanentemente ativo ainda exige outra solução de plataforma, a desenvolver.

## Estado atual: MVP em validação

| Área | O que existe hoje | O que ainda falta |
|---|---|---|
| Interface web | PWA publicada em HTTPS; arquivos de execução servidos do próprio pacote | Validação completa em Android/iOS e acessibilidade |
| Identidade | Chave aleatória local, cofre cifrado por senha, sessão persistente e backup cifrado | Mais testes de recuperação e uso em aparelhos reais |
| Mensagens | Fluxos NIP-17 e listas de inbox relays kind 10050, com testes locais | Validação ampliada de interoperabilidade e redes reais |
| Relay de PC | Geode portátil para Ubuntu Linux x86_64, runtime Java incluído | Evidência completa do ensaio contínuo de 24 horas |
| Ponte voluntária | Encaminhamento limitado entre relays enquanto a PWA está ativa | Operação móvel contínua não é suportada pela PWA |
| Marketplace e campanhas | Fluxos iniciais de ofertas e leitor opcional de campanhas assinadas | Checkout e engine de aceite, pagamento XMR, XNO e reembolso |
| Hangout | Trabalho inicial herdado e previsto no plano | Integração completa e validação para o Liberdade |

A publicação do app não significa que todo o plano foi concluído. Consulte o [plano de testes](freedom/docs/plano-de-testes-central.md) para resultados e limitações. Pagamentos e monetização automática de nodes não estão ativados nesta versão.

## Começar em poucos minutos

A branch padrão e de desenvolvimento é **`modelo-mvp`**. Para contribuir, faça primeiro um fork; os comandos completos estão no [guia de contribuição](CONTRIBUTING.md).

```bash
git clone --branch modelo-mvp https://github.com/coercaodobem/freedom.git
cd freedom
```

Para abrir a interface localmente, com Python 3:

```bash
python3 -m http.server 8080 --directory freedom/web
```

Acesse `http://localhost:8080`. Instalação como PWA exige HTTPS ou localhost. O shell pode abrir offline após a primeira carga; comunicação exige relays alcançáveis.

Para iniciar o relay no Ubuntu Linux x86_64:

```bash
./freedom/relay/start.sh
```

O pacote inclui o runtime Java e verifica o SHA-256 antes da extração. Por padrão, o relay escuta somente em `127.0.0.1:7447`; publicar um relay na internet exige configuração própria de TLS, rede e armazenamento. Veja o [guia do relay](freedom/relay/README.md).

Para executar a suíte local, com Node.js 22 ou superior:

```bash
bash freedom/tests/run-smoke.sh
```

Esses testes não dependem de pagamentos ou publicação de mensagens em relays públicos. Os ensaios que abrem relays locais e o teste de 24 horas têm comandos separados no [guia de contribuição](CONTRIBUTING.md).

## Onde está cada parte

| Caminho | Conteúdo |
|---|---|
| [`freedom/web/`](freedom/web/) | Interface PWA e dependências web locais |
| [`freedom/relay/`](freedom/relay/) | Launcher e pacote portátil do relay |
| [`freedom/tests/`](freedom/tests/) | Validações do produto Liberdade |
| [`freedom/docs/`](freedom/docs/) | Identidade, decisões, execução e plano de testes |
| [`geode/`](geode/) | Código do relay reaproveitado do Amethyst |
| `amethyst/`, `commons/`, `commonsUI/`, `desktopApp/`, `cli/` | Base upstream preservada; presença do código não significa que todos os alvos sejam produtos Liberdade publicados |

## Contribuir

São bem-vindos relatos de bugs, documentação, testes, acessibilidade e correções. Não é necessário oferecer bounty ou pagamento para propor uma contribuição.

1. Confira o [roadmap](ROADMAP.md) e as [issues do Liberdade](https://github.com/coercaodobem/freedom/issues).
2. Leia [CONTRIBUTING.md](CONTRIBUTING.md), prepare uma alteração pequena e descreva como a validou.
3. Abra um pull request para **`coercaodobem/freedom:modelo-mvp`**. A incorporação passa por revisão do mantenedor.

Para vulnerabilidades, use o canal privado descrito em [SECURITY.md](SECURITY.md). Não publique senhas, chaves privadas, tokens ou conversas pessoais em issues e logs.

## Contexto e origem

- [Identidade e princípios](freedom/docs/identidade-do-projeto.md)
- [Plano central](freedom/docs/plano-central.md)
- [Resultados e plano de testes](freedom/docs/plano-de-testes-central.md)
- [Detalhes do MVP e da publicação](freedom/README.md)

O snapshot de origem é o Amethyst no commit [948135f](https://github.com/vitorpamplona/amethyst/tree/948135f7dbbae81d79a0b985282ce673397a7618). Reaproveitamos sua base e o relay Geode. A PWA usa JavaScript e o pacote local versionado `nostr-tools`; não é uma compilação web da interface Android do Amethyst. O cliente não baixa scripts executáveis de CDN durante o uso. O histórico upstream completo permanece no repositório original.

O Liberdade mantém os avisos de autoria e a licença [MIT](LICENSE) da base. Dependências têm licenças próprias, registradas nos inventários do projeto. Relatos e contribuições específicos do Liberdade devem ser enviados a este repositório.
