# Checkpoint offline Property — 2026-10-31

O smoke local passou 13/13 suítes depois da correção de configuração inicial de relays. Uma instalação nova começa sem relays gerais; os relays públicos são exemplos carregados somente após ação da pessoa e não conectam antes de Salvar e conectar. A PWA incrementou o cache de v9 para v10. O contrato local verifica a configuração vazia e o texto de opt-in.

Uma inspeção estática encontrou que os dois relays públicos eram carregados no estado inicial e conectados ao entrar na conta. Essa tentativa automática foi removida. O fluxo completo de navegador para provar ausência de conexões, em localhost e sob /property/, não foi executado: o sandbox bloqueia bind loopback e o perfil alternativo não tem egress inspecionável. Portanto G02-02 segue BLOCKED; o smoke unitário não o aprova.

A inspeção visual desta revisão também não ocorreu: a política do navegador recusou a abertura do pacote por file:// e permite apenas http/https. Nenhuma rota alternativa foi tentada.

G00-02 continua BLOCKED, G00-04 continua sem harness de interrupção, e G01-02 permanece BLOCKED pela falha de bind do launcher. Nenhum caso dependente foi aprovado. Nenhuma sonda pública TCP/DNS foi enviada. O executor solicitado é Luna Max; esta execução foi feita por Codex GPT-6.

## Reprodução

- bash property/tests/run-smoke.sh — 13/13 suítes aprovadas localmente; diagnóstico, não aprovação de gate.
- node property/tests/native-relay-integration.mjs — BLOCKED no checkpoint anterior; falha de bind loopback registrada em ../20261031T135834Z/native-relay.log.

PROPERTY_SCOPE_OFFLINE_PASS não foi atingido.
