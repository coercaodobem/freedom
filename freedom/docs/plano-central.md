# Plano Central — Execução do Projeto Liberdade

**Status:** a branch local `modelo-mvp` deriva do Amethyst e contém a PWA, cofre local, roteamento NIP-17 por kind 10050, relay Geode e leitura opcional de campanhas assinadas, além dos testes locais já registrados. O destino público agora é `coercaodobem/freedom`; ele existe, mas ainda está vazio. Nenhuma branch, runtime ou workflow foi publicado nele. Pages não está implantado. Engine de pagamentos XNO, auditoria integral e gates do plano continuam pendentes.
**Atualizado:** 2026-10-28.

## Objetivo

Entregar um cliente Nostr chamado Liberdade que funcione como PWA em navegadores móveis e desktop, permita comunicação privada, preserve controle local da identidade e possa usar relays escolhidos pela pessoa. Reaproveitar ao máximo o código e os testes do Amethyst, mantendo o pacote de execução dentro do repositório público do Liberdade.

Este documento organiza a execução. A visão do produto está em [identidade-do-projeto.md](identidade-do-projeto.md); os critérios verificáveis estão em [plano-de-testes-central.md](plano-de-testes-central.md).

## Decisões consolidadas

| Tema | Decisão |
|---|---|
| Base existente | Começar pela auditoria e fork do repositório público Amethyst, preservando histórico e referências upstream. Reusar módulos e testes compatíveis antes de implementar equivalentes. |
| Alvo principal | Interface web PWA utilizável em navegadores de celular e computador; o site institucional público vem na fase de lançamento, depois que o app estiver pronto. |
| Compatibilidade Amethyst | Amethyst oferece app Android/desktop e módulos compartilhados Nostr; ainda não presumir que sua UI atual seja PWA. Provar o alvo web e reaproveitar o núcleo portável. |
| Identidade | Gerar chave Nostr aleatória localmente. Senha protege/desbloqueia a chave, não é convertida diretamente em chave privada, evitando que uma senha fraca determine a identidade. Conta persiste localmente e pode continuar conectada por opção; permitir bloqueio manual/inatividade, sem guardar senha em texto puro ou criar servidor central. |
| Conversas privadas | Usar protocolo Nostr padronizado e interoperável, com NIP-17 como escolha inicial sujeita à revisão da versão da especificação e da implementação de origem. |
| Transporte | Cliente conecta diretamente por WebSocket seguro a vários relays. GitHub Pages entrega apenas arquivos do app. |
| Nodes | PC pode operar node/relay continuamente. Celular pode colaborar enquanto o app estiver ativo, sem promessa de execução em segundo plano. |
| Dependências | Nenhum código executável externo carregado em runtime. Fixar versões, manter código e dependências de runtime no repo/bundle, preservar licenças e evitar snapshots ou refs dinâmicas. |
| Hospedagem | Quando o produto estiver pronto, publicar a PWA estática via GitHub Pages a partir do repositório público Liberdade. A hospedagem não fornece backend de comunicação. |
| Marketplace e Hangout | Primeira versão do Hangout é um feed público Nostr kind 1; marketplace faz descoberta/publicação de ofertas NIP-15. NIP-15 é draft marcado como não recomendado; checkout/custódia ficam fora. |
| Receita dos nodes | Campanhas são opt-in, assinadas e separadas das mensagens. A leitura atual limita exposição localmente e não envia eventos de clique/visualização; ela não verifica a ledger Nano. Engine de oferta, aceite, cobrança, recusa e reembolso ainda não está implementada. |

## Fork do Amethyst e adaptação de nome/produto (roteiro executável)

A branch local `modelo-mvp` parte do commit Amethyst `948135f7dbbae81d79a0b985282ce673397a7618`. O clone completo de trabalho está em `amethyst-upstream/`, com `origin` apontando para `vitorpamplona/amethyst`; a branch local preserva essa ancestralidade. O repositório público de destino é `coercaodobem/freedom`, atualmente vazio. O remote local `freedom` aponta para esse destino. A publicação deve enviar a branch derivada do histórico Amethyst, preservando a ancestralidade.

O procedimento para consolidar o fork no GitHub é:

1. Usar somente o repositório público `coercaodobem/freedom` como destino. Criar nele a branch `modelo-mvp` a partir do HEAD local e publicar os arquivos da PWA, relay, testes, workflow e documentação. Não enviar ao repositório Amethyst upstream.
2. Manter a branch `modelo-mvp` derivada do commit Amethyst registrado e `vitorpamplona/amethyst` como `upstream`, preservando a ancestralidade do código no GitHub.
3. Manter o módulo de relay Geode e o Quartz necessários ao relay no fork. A PWA fica em `freedom/web`; o comando de relay, em `freedom/relay`.
4. Adaptar a marca visível para Liberdade na PWA, manifesto, ícone, textos e comando operacional. Não renomear pacotes Kotlin, módulos, classes ou autoria Amethyst sem revisão: nomes de namespace e avisos de licença têm finalidade técnica/legal e podem ficar preservados.
5. Substituir componentes quando houver implementação própria validada; preservar cabeçalhos MIT e licença de dependências vendorizadas. Registrar hash, versão e origem de cada bundle.
6. Abrir branch de preview e validar o conteúdo servido antes de alterar a branch de publicação. Publicar o app estático em `freedom/web` a partir da própria branch revisada.

Comandos locais equivalentes para um novo clone de upstream:

```bash
git clone https://github.com/vitorpamplona/amethyst.git liberdade
cd liberdade
git remote rename origin upstream
git switch -c modelo-mvp 948135f7dbbae81d79a0b985282ce673397a7618
# depois de criar o repositório público do projeto: git remote add freedom https://github.com/coercaodobem/freedom.git
```

**Estado atual (2026-10-28):** a branch local `modelo-mvp` deriva do commit upstream indicado e preserva 22.174 commits de histórico. O repositório público `coercaodobem/freedom` está vazio (branch padrão `main`, tamanho reportado zero). A integração GitHub disponível no ChatGPT está conectada a outra conta e tem apenas permissão de leitura nesse repositório; ainda não há conexão de escrita como `coercaodobem`. Portanto não há push, runtime remoto, workflow executado ou URL pública verificada. O pacote Geode 1.20.0 foi reconstruído e verificado localmente em 130 segmentos, mas nenhum segmento foi publicado no novo destino. Pages ainda precisa ser habilitado no destino e validado por URL.

## Fases de execução

### 0. Congelar escopo e evidências

- Manter os documentos de identidade, arquitetura e testes alinhados.
- Distinguir requisito confirmado, hipótese técnica e trabalho ainda não executado.
- Antes de qualquer promoção pública, definir o commit que foi revisado e a versão do protocolo adotada.

**Saída:** escopo do MVP e critérios de aceitação aprovados internamente no projeto.

### 1. Auditar Amethyst e provar o caminho web

- Selecionar e registrar um commit específico do repositório Amethyst; não desenvolver contra a branch móvel sem referência fixa.
- Fazer inventário de módulos, APIs, dependências transitivas, licenças e testes.
- Identificar o que pode ser reutilizado diretamente: Quartz e lógica Nostr, eventos, relays, criptografia, identidade, NIP-17, NIP-15 e testes existentes.
- Avaliar Commons/Compose e targets Kotlin Multiplatform para navegador. Criar uma prova pequena que conecte a um relay pelo navegador sem buscar código de execução externo.
- Se a UI não puder ser reaproveitada no navegador com confiabilidade, preservar o núcleo e os fluxos de domínio do Amethyst e fazer UI PWA fina, sem recriar o núcleo de protocolo.
- Confirmar as obrigações MIT e de todas as dependências antes de copiar, compilar ou distribuir.

**Gate:** decisão técnica documentada sobre módulos reutilizados, portados e não aproveitáveis no navegador. Nenhum código ou dependência é declarado compatível sem build e teste.

### 2. Criar a base Liberdade autocontida

- Manter o fork/histórico e atribuições; registrar upstream, commit, arquivos importados e licenças.
- Trazer o código de runtime escolhido para o repositório Liberdade ou para o bundle final; não carregar scripts de CDN, snapshots remotos ou dependências durante uso.
- Fixar dependências e toolchain de build, gerar inventário de componentes e tornar o build repetível na medida suportada pela stack.
- Definir fronteira entre interface PWA, núcleo de protocolo reaproveitado, armazenamento local, relays e processos de node.

**Gate:** abrir o app com rede externa de código bloqueada e comprovar que todos os assets executáveis vêm do pacote Liberdade. Conexões de dados com relays ficam permitidas.

### 3. Identidade local e mensagens privadas

- Criar identidade a partir de chave aleatória gerada no navegador com fonte criptográfica segura.
- Proteger a chave em armazenamento local cifrado por senha; nunca enviar senha ou chave privada a Pages, relays ou telemetria.
- Implementar recuperação local e teste de troca de dispositivo; documentar que perda da senha e do segredo de recuperação não tem reset central.
- Reutilizar e validar criptografia/eventos NIP-17 do Amethyst ou biblioteca de origem; não criar criptografia própria.
- Implementar seleção de relays e comunicação direta, sincronização, deduplicação e estados desconectado/parcialmente conectado.

**Gate:** remetente e destinatário leem a conversa; relay e terceiro não leem conteúdo; nova sessão restaura apenas com recuperação autorizada.

### 4. PWA e distribuição controlada

- Desenvolver interface responsiva e instalável, com shell offline e atualização sem apagar identidade.
- Testar Chrome Android, Safari iOS, navegador desktop e outros navegadores alvo; registrar as diferenças de instalação/background.
- Durante desenvolvimento usar localhost/staging. Não lançar site institucional antes de o app estar pronto.
- Na fase de lançamento, publicar artefato estático revisado do repositório público Liberdade no GitHub Pages; proteger a origem de publicação e publicar versões identificáveis.
- Verificar que a interface não envia eventos, mensagens ou credenciais ao host.

**Gate:** bundle estático e revisado funciona em navegador móvel/desktop; a captura de tráfego mostra conexão direta aos relays e nenhuma dependência de código remoto.

### 5. Nodes e continuidade

- Priorizar node de PC com execução contínua, recuperação após falha, limites de armazenamento e seleção de relays.
- Permitir colaboração do celular somente como ação voluntária e de melhor esforço enquanto a PWA está ativa: encaminhar eventos públicos assinados entre relays escolhidos e encaminhar gift wraps NIP-17 somente quando destinados à identidade local, e somente para os inbox relays dessa identidade. A ponte exclui o relay de origem, deduplica IDs, verifica assinatura/idade/tipo e limita encaminhamento a 60 eventos e 2 MB de tráfego de saída por minuto, contando cada destino. Não apresentar a PWA móvel como relay público de entrada sempre ligado.
- Não divulgar o celular como relay sempre ligado nem exigir tela acesa, root ou serviço pago.

**Gate:** ensaio operacional de 24 horas e retomada idempotente aprovados para o node de PC; comportamento móvel documentado como best effort.

### 6. Hangout, marketplace e sustentabilidade

- Depois da base de mensagens, evoluir Hangout e marketplace com eventos compatíveis e componentes reaproveitados do Amethyst.
- Criar fluxo de campanhas para node: conteúdo e proposta assinada; revisão local; aceite ou recusa; se aceita, pagamento em raw para endereço exclusivo e publicação após confirmação.
- Se recusada antes do pagamento, não cobrar. Pagamento inesperado, atrasado ou incompatível segue política explícita de devolução como nova transferência; nenhuma carteira do usuário fica na PWA.
- A carteira Nano fica sob controle local do operador e separada da identidade Nostr. A integração RPC de carteira roda no próprio host; `enable_control` fica desligado salvo necessidade operacional. Se ativado, o RPC deve escutar apenas em loopback ou ter uma restrição equivalente fora do node, nunca ficar aberto à internet.
- Exibir patrocínio com clareza, permitir preferência local e não enviar clique/leitura ao anunciante.

**Gate:** política de anúncio, estados financeiros, privacidade e suporte operacional testados em rede local/testnet antes de considerar uso econômico real.

### 7. Beta e lançamento

- Executar integralmente o [plano de testes central](plano-de-testes-central.md), separar falhas de implementação de limitações do navegador e guardar evidência sanitizada.
- Fazer revisão independente de criptografia, identidade, cadeia de dependências, código copiado e permissões do node.
- Só então preparar site institucional e distribuição pública no GitHub Pages, com release versionada, origem/commit visíveis e procedimento de recuperação/atualização.

**Gate de lançamento:** critérios de saída do plano de testes aprovados; sem falhas críticas abertas; versão e artefato publicados correspondem ao commit revisado.

## Progresso de implementação na branch

- **PWA:** shell responsivo, manifesto/ícone, cache offline, IndexedDB, cofre PBKDF2-SHA-256 + AES-GCM, opção de sessão persistente com CryptoKey não exportável, bloqueio de 30 minutos, backup cifrado, NIP-17 1:1, configuração de relays, feed público kind 1 com origem por relay, listagem/publicação/edição/retirada NIP-15 e ponte voluntária de melhor esforço entre relays selecionados. A ponte só encaminha gift wraps NIP-17 para os inbox relays da própria identidade e não promete execução em segundo plano. O código-fonte da PWA está na branch remota; falta habilitar Pages, obter execução bem-sucedida e verificar a URL servida.
- **NIP-17:** kind 10050 é publicado por ação explícita; descoberta valida assinatura e encaminha cada gift wrap somente para a lista inbox do destinatário correspondente. Sem lista kind 10050 descoberta, o cliente não tenta enviar.
- **Relay:** Geode 1.20.0 compilado com JDK 21 e empacotado com JRE para Linux x86_64. O tarball portátil está no repositório como 130 segmentos binários; `freedom/relay/start.sh` remonta e verifica o SHA-256, grava no diretório do usuário e por padrão faz bind em `127.0.0.1:7447`.
- **Testes já executados:** criptografia NIP-17/isolamento de destinatário; publicação, descoberta assinada e roteamento por kind 10050; cofre de identidade e backup; contrato de assets/CSP/sintaxe; build `:geode:geodeImage`; e integração de envelopes cifrados, kind 10050 e listagem NIP-15 com preço raw exato contra Geode local passaram. A captura visual local confirmou a tela inicial e o carregamento dos assets sem erros de console. Pages e o restante do plano continuam pendentes.
- **Unidades financeiras:** a vitrine NIP-15 publica o preço numérico exigido pelo draft e uma extensão `price_raw` exata em inteiro decimal; exibe o valor a partir de raw quando a extensão está presente. O pacote local testa 1 raw, 1 XNO, vírgula decimal e rejeição de expoentes/precisão excedida. Isso não implementa carteira, aceite, recebimento, publicação paga ou reembolso.
- **Fora do MVP entregue até aqui:** engine de campanhas XNO/raw (oferta, moderação, cobrança e reembolso; há apenas leitor opt-in de eventos assinados), execução da ponte móvel em segundo plano, relay público de entrada no celular, administração de grupos NIP-29, checkout, pedidos, compra, custódia e pagamentos do marketplace.

## Política de origem e dependências

- GitHub é a origem pública de código e pode ser o host estático. O conteúdo servido deve corresponder a uma versão revisada do próprio repositório Liberdade.
- O Amethyst é uma origem de código upstream durante auditoria e integração, não uma dependência de runtime. Após a incorporação, o cliente não consulta o repositório Amethyst para funcionar.
- Bundles não devem importar JavaScript, CSS, fontes, WebAssembly ou chaves de configuração executáveis de CDNs. Relays são fontes de dados do protocolo, não de código do app.
- Registrar commit e licenças do código Amethyst reaproveitado; conservar avisos MIT. Não incluir dependências transitivas sem inventário/licença.
- Fixar dependências de build e seus hashes; evitar branches, versões SNAPSHOT e artefatos mutáveis na configuração de produção. Diferenciar artefatos de build de código baixado quando o usuário executa o produto.
- Assinar tags/releases e publicar hashes do artefato. Planejar builds reproduzíveis e espelhos para que a confiança não dependa apenas do botão de download do host.
- Não guardar seeds, chaves privadas, senhas ou segredos de assinatura no repositório.

## Pendências e dependências externas

- Completar auditoria real do commit Amethyst que servirá de base; leitura de código já iniciou, mas a análise de segurança e de dependências ainda não foi concluída.
- Preservar a ancestralidade completa do Amethyst na distribuição pública; o destino novo ainda está vazio.
- Publicar o runtime Geode completo no novo destino: 130 segmentos locais, verificados por tamanho e SHA-256, ainda não estão no repositório remoto.
- Habilitar GitHub Pages com fonte “GitHub Actions”, disparar o workflow e verificar a aplicação por URL pública. A configuração exige sessão autenticada no painel ou token de escrita Pages; o workflow atual não habilita sozinho o serviço.
- Validar PWA em Android e Safari/iOS, incluindo instalação, sincronização móvel e fluxos de usuário completos.
- Fechar parâmetros da derivação de senha, algoritmo de cifragem local e formato de recuperação após protótipo de compatibilidade.
- Definir retenção e política de abuso de nodes, comunidades do Hangout, marketplace e campanha.
- Definir domínio, identidade visual final e operação do site institucional na fase de lançamento.
