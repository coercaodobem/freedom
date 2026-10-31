# Checkpoint offline Property — 2026-10-31

Este checkpoint não aprova `PROPERTY_SCOPE_OFFLINE_PASS`. O gate G00 segue bloqueado em G00-02 porque o perfil que permite relays locais tem rotas IPv4 e IPv6 padrão e as regras efetivas de firewall não podem ser inspecionadas. Nenhuma sonda TCP/DNS ou tráfego público foi enviado.

G00-01 foi inventariado; limites de cgroup e versão do motor do navegador não são expostos e estão registrados como desconhecidos. G00-03 passou nos diagnósticos locais: integração de dois Geode e WebSocket de sete Geode, bancos separados, permissões privadas e encerramento verificado. G00-04 ainda não tem orquestrador que prove interrupção, relatório BLOCKED e limpeza. A regressão local de 13 suítes passou, mas não recebe aprovação de gate enquanto G00 não passar.

A correção de contato foi inspecionada no navegador local com relay loopback: o identificador `coercaodobem` agora recebe orientação em português, sem erro bruto do Bech32. Os cenários próprios/nomes iguais permanecem pendentes. A conta, o banco, o cache e os processos de teste foram limpos.

O executor solicitado no plano é Luna Max; esta execução foi feita por Codex GPT-6. Os relatórios identificam essa diferença, sem atribuir a execução ao modelo solicitado.

## Reprodução

- `bash property/tests/run-smoke.sh`
- `bash property/tests/run-bridge-integration.sh 17450 17451`
- `bash property/tests/seven-relays-smoke.sh 17460`

Os dois últimos comandos iniciam relays reais, mas usam exclusivamente `127.0.0.1`. O resultado desses diagnósticos não substitui a prova de isolamento nem aprova os gates seguintes.
