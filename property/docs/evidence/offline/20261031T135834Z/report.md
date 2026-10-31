# Checkpoint incremental de testes — Property

Esta execução não aprova PROPERTY_SCOPE_OFFLINE_PASS nem qualquer gate dependente de G00. O checkpoint anterior registrou o inventário e os diagnósticos de dois e sete relays. Corrigimos nesta trilha o sinalizador de elegibilidade: resultados locais não são aprovação de gate enquanto G00-02 estiver bloqueado.

O caso completo G01-02 foi tentado com o launcher nativo e um diretório temporário com espaços. O Java não conseguiu abrir o listener em 127.0.0.1:17457 (SocketException: Operation not permitted). A execução terminou com código 1; a limpeza do processo e do diretório temporário foi confirmada. Não foi repetida no perfil alternativo, pois ele expõe rotas padrão IPv4/IPv6 e as regras de firewall não podem ser inspecionadas.

O smoke local anterior passou 13/13 suítes, em caráter diagnóstico. A contagem normativa do plano agora também é 13. O navegador e os cenários de contato próprio/nomes iguais, a sensibilidade por mutação e G02–G12 seguem sem aprovação. Nenhuma sonda pública TCP/DNS foi enviada.

## Reprodução

- node property/tests/native-relay-integration.mjs — bloqueado por política de bind do sandbox.
- bash property/tests/run-smoke.sh — 13/13 passou no checkpoint anterior, apenas diagnóstico.

O executor solicitado no plano é Luna Max; esta execução foi feita por Codex GPT-6.
