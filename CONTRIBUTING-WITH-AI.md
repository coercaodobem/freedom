# Contribuições ao Liberdade com assistência de IA

Este documento complementa [CONTRIBUTING.md](CONTRIBUTING.md). Assistentes são ferramentas; a pessoa que envia uma contribuição é responsável por entender, revisar e validar o resultado.

## Antes de abrir um PR

- Uma pessoa deve revisar o diff completo e conseguir explicar o comportamento alterado.
- A validação deve corresponder à área modificada: links e comandos para documentação; testes e inspeção no navegador para PWA; dispositivo ou emulador para alterações específicas de Android.
- Informe comandos executados, resultados e limitações reais. Não confunda teste local, CI ou publicação com funcionamento integral em produção.
- Quando a IA tiver produzido parte substancial da alteração, inclua uma nota curta no PR.

Agentes não devem abrir, publicar ou enviar PRs automaticamente. Entregue a branch, o resumo e a validação à pessoa responsável; abra um PR apenas quando ela tiver concluído a revisão e solicitado explicitamente essa ação. Nunca afirme que uma pessoa revisou ou testou sem evidência.

## Durante o trabalho

- Leia o [README](README.md), o [roadmap](ROADMAP.md), [AGENTS.md](AGENTS.md) e as instruções próximas dos arquivos.
- Reaproveite implementações existentes; não invente APIs, resultados, testes ou suporte de plataforma.
- Mantenha correções pequenas e preserve autoria e licenças do código Amethyst reutilizado.
- Discuta mudanças extensas em chaves, criptografia, NIPs, pagamentos ou distribuição com o mantenedor.
- Não envie senhas, chaves privadas, tokens ou mensagens pessoais para ferramentas, issues ou logs.
- Envie propostas do Liberdade para `coercaodobem/freedom`, na branch `modelo-mvp`.

Uma contribuição somente web ou documental deve ser validada pelo fluxo correspondente do Liberdade; não exige afirmar que o app Android foi instalado. As [regras upstream de IA](https://github.com/vitorpamplona/amethyst/blob/948135f7dbbae81d79a0b985282ce673397a7618/CONTRIBUTING-WITH-AI.md) são referência histórica para a base reaproveitada.
