# Corpus de inicialização Nostr

O fixture original de benchmark foi preservado neste repositório em 73 partes numeradas dentro deste diretório. Para restaurar o arquivo gzip esperado pelo projeto, execute na raiz do repositório:

```bash
./tools/reassemble-startup-corpus.sh
```

O script concatena as partes em ordem, verifica o SHA-256 `dbb75932a07ceef18d4904c4e9e2010dd2c62bafdd394b44285a5f5258c96ba8` e grava `nostr_vitor_startup_data.json.gz` neste diretório. `relayBench/run.sh --real` faz essa restauração automaticamente. Para os testes de benchmark Android, execute o script antes da tarefa Gradle correspondente.

A reconstrução usa apenas Bash, `cat` e `sha256sum`, sem baixar dados ou scripts de outro servidor.
