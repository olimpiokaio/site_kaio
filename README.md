# Meu Site — Deploy para GitHub

Este projeto contém um pequeno script para facilitar o envio (push) do código para o repositório GitHub solicitado: `https://github.com/olimpiokaio/site_kaio.git`.

## Pré‑requisitos
- Git instalado: https://git-scm.com/downloads
- Acesso ao repositório do GitHub via HTTPS (com usuário/senha ou token) ou via SSH (com chave configurada).

## Opção 1: Usando o script automático

1. Dê permissão de execução ao script (apenas uma vez):
   ```bash
   chmod +x ./deploy_to_github.sh
   ```
2. Execute o script (usa por padrão o repositório e a branch `main`):
   ```bash
   ./deploy_to_github.sh
   ```
   - Para usar outro repositório ou outra branch:
     ```bash
     ./deploy_to_github.sh <REPO_URL> <BRANCH>
     # Ex.: ./deploy_to_github.sh git@github.com:olimpiokaio/site_kaio.git main
     ```
3. Autentique quando solicitado (HTTPS) ou assegure que sua chave SSH está configurada (SSH).

O script fará:
- `git init` (se necessário)
- criar/alternar para a branch alvo
- `git add -A` e commit inicial (ou commit de atualização)
- configurar/atualizar o `origin`
- `git fetch` e merge (se o remoto já tiver histórico)
- `git push -u origin <branch>`

## Opção 2: Passos manuais

Caso prefira fazer manualmente, no diretório do projeto rode:

```bash
git init
git checkout -b main
git add -A
git commit -m "chore: initial commit of site"
# HTTPS
# git remote add origin https://github.com/olimpiokaio/site_kaio.git
# ou SSH
# git remote add origin git@github.com:olimpiokaio/site_kaio.git

git push -u origin main
```

Se o repositório remoto já tiver commits, rode antes:
```bash
git fetch origin main || true
git merge --allow-unrelated-histories --no-edit origin/main
```
Resolva conflitos se houver, faça `git commit`, e em seguida `git push`.

## Dicas
- Para HTTPS com 2FA, use um Personal Access Token como senha: https://github.com/settings/tokens
- Para SSH, configure sua chave pública: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- Para atualizar mudanças futuras: faça alterações, `git add -A`, `git commit -m "msg"` e `git push`.
