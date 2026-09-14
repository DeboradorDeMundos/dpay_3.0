# Manual Trello + D-PAY 3.0 (API REST)

Guía para usar la [API REST de Trello](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/) en este repo: GitHub Actions, CLI local y el agente de Cursor.

- Tablero: [D-PAY 3.0 Capstone](https://trello.com/b/xUz6zs7Y/d-pay-30-%F0%9F%9A%80-capstone-duoc-%C3%97-dtemite) (`xUz6zs7Y`)
- Repo: `DeboradorDeMundos/dpay_3.0`
- Base URL: `https://api.trello.com/1`

No se usa el Power-Up de GitHub. La autenticación es **API Key + Token**.

---

## Índice

1. [Credenciales (cómo usar la API bien)](#1-credenciales-cómo-usar-la-api-bien)
2. [Columnas del tablero](#2-columnas-del-tablero)
3. [Tres formas de usarlo](#3-tres-formas-de-usarlo)
4. [CLI local (manual de usuario)](#4-cli-local-manual-de-usuario)
5. [Agente de Cursor + historias de usuario](#5-agente-de-cursor--historias-de-usuario)
6. [GitHub Actions (automático)](#6-github-actions-automático)
7. [Funcionalidades de la API REST](#7-funcionalidades-de-la-api-rest)
8. [Ejemplos curl](#8-ejemplos-curl)
9. [Alta inicial (key, token, secrets)](#9-alta-inicial-key-token-secrets)
10. [Archivos del repo](#10-archivos-del-repo)
11. [Errores frecuentes](#11-errores-frecuentes)

---

## 1. Credenciales (cómo usar la API bien)

Trello entrega **tres** valores. Solo se usan **dos**.

| Valor | Dónde sale | ¿Se usa? |
|---|---|---|
| **API Key** | Power-Up → API Key | Sí. `TRELLO_API_KEY` |
| **Secret** | Power-Up → API Key | **No.** Es OAuth 1.0. Este proyecto no lo usa |
| **Token** | `trello.com/1/authorize?...&key=SU_KEY` | Sí. `TRELLO_API_TOKEN` |

Reglas:

- El token **hoy suele empezar con `ATTA`**. Es válido si salió de `trello.com/1/authorize`.
- Key y token van **juntos** en cada request (`?key=...&token=...`).
- El token debe generarse **con esa misma API Key** (Allow en el navegador).
- La cuenta del token debe ser **miembro del tablero**.
- Nunca subir token al git, ni pegarlo en WhatsApp/chat, ni ponerlo en **Variables** de GitHub (eso es texto plano). Va en **Secrets**.
- Scope mínimo: `read,write`. Expiration: `never` (o revocar después en [trello.com/my/account](https://trello.com/my/account)).

Documentación oficial: [Authorization](https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/).

Generar token (reemplace `SU_API_KEY`):

```
https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=DPAY%20GitHub%20Sync&key=SU_API_KEY
```

Allow → copiar el token entero.

---

## 2. Columnas del tablero

| Columna | Uso en D-PAY | Secret GitHub | Id |
|---|---|---|---|
| DOC · Por hacer | Documentación pendiente | (no mapeada al Action) | `6a9e08900669385587f75a1a` |
| CÓDIGO · Por hacer | HU / issues de código | `TRELLO_LIST_BACKLOG` | `6a9e08900669385587f75a2a` |
| En progreso | Se está implementando | `TRELLO_LIST_IN_PROGRESS` | `6a9e08900669385587f75a4b` |
| QA | Pruebas / revisión | `TRELLO_LIST_REVIEW` | `6a9e08900669385587f75a6b` |
| Producción | Listo / mergeado | `TRELLO_LIST_DONE` | `6a9e08900669385587f75a81` |
| Rechazada | Falló QA o se descarta | (mover a mano o CLI) | `6a9e08900669385587f75ab0` |
| Backlog futuro | Fuera de sprint | (no mapeada al Action) | `6a9e08900669385587f75ae2` |

`TRELLO_BOARD_ID` = `6a9e087c0669385587f73ae5`

En el CLI se puede buscar por un trozo del nombre: `progreso`, `qa`, `produccion`, `rechazada`, `codigo`.

---

## 3. Tres formas de usarlo

| Vía | Para qué | Quién lo dispara |
|---|---|---|
| **CLI** `codigo/scripts/trello.py` | Listar, mover, comentar desde el PC / Cursor | Usted o el agente |
| **Agente de Cursor** | “Pasa HU-04 a QA” mientras se implementa | El agente corre el CLI |
| **GitHub Actions** | Issue/PR crea o mueve cards solo | Push / PR / issue |

---

## 4. CLI local (manual de usuario)

### 4.1 Preparar `.env.trello` (una vez)

En la **raíz** del repo:

```bat
copy .env.trello.example .env.trello
```

Edite `.env.trello` (está en `.gitignore`, no se sube):

```
TRELLO_API_KEY=su_key
TRELLO_API_TOKEN=su_token
TRELLO_BOARD_ID=6a9e087c0669385587f73ae5
```

Cada colaborador usa **su** cuenta de Trello (miembro del tablero). No se comparte el token: GitHub Actions usa los Secrets del repo; el CLI local usa este archivo en cada PC. Cómo sacar key y token: [sección 1](#1-credenciales-cómo-usar-la-api-bien) y [sección 9](#9-alta-inicial-key-token-secrets).

Hace falta **Python 3** en el PATH.

### 4.2 Comandos disponibles hoy

Desde la raíz `E:\dpay\dpay_3.0`:

```bat
python scripts\trello.py help
python scripts\trello.py lists
python scripts\trello.py cards
python scripts\trello.py cards qa
python scripts\trello.py move HU-01 progreso
python scripts\trello.py move HU-01 qa
python scripts\trello.py move HU-01 produccion
python scripts\trello.py move HU-01 rechazada
python scripts\trello.py comment HU-01 Pruebas OK en POS
```

También: `scripts\trello.cmd lists`

| Comando | Qué hace | API Trello |
|---|---|---|
| `lists` | Columnas abiertas + ids | `GET /boards/{id}/lists` |
| `cards [lista]` | Cards abiertas (opcional filtro por columna) | `GET /boards/{id}/cards` |
| `move <texto> <lista>` | Mueve la card cuya nombre contiene `<texto>` | `PUT /cards/{id}` (`idList`) |
| `comment <texto> <msg>` | Comenta en esa card | `POST /cards/{id}/actions/comments` |

La búsqueda de card es por **subcadena** del título (`HU-01`, `login`, etc.). Si hay varias coincidencias, el CLI pide ser más específico.

Probar la key/token y ver ids de listas (interactivo):

```bat
scripts\trello-setup.cmd
```

No abra el `.ps1` con doble clic: Windows lo abre como texto. Use el `.cmd`.

---

## 5. Agente de Cursor + historias de usuario

Sí se puede ir moviendo la card **desde el chat**, a medida que avanza la HU, si existe `.env.trello` en el PC.

Flujo típico:

1. Usted: “Implementa la HU-04 (card en CÓDIGO · Por hacer)”.
2. El agente empieza a codear y corre `move HU-04 progreso`.
3. Terminan implementación y pruebas → `move HU-04 qa` y un `comment` con el resultado.
4. QA OK → `move HU-04 produccion`. Si no → `move HU-04 rechazada`.

En el prompt conviene poner el **código de la HU tal como está en el título de la card** (ej. `HU-04`), para que el CLI la encuentre.

Cursor no ve Trello nativo: llama a este CLI / a `api.trello.com`. Sin `.env.trello` no puede mover nada.

---

## 6. GitHub Actions (automático)

Workflow: `.github/workflows/trello-sync.yml`

Los valores van en **Settings → Secrets and variables → Actions → pestaña Secrets** (no Variables).

| Secret | Valor |
|---|---|
| `TRELLO_API_KEY` | API Key |
| `TRELLO_API_TOKEN` | Token ATTA |
| `TRELLO_BOARD_ID` | `6a9e087c0669385587f73ae5` |
| `TRELLO_LIST_BACKLOG` | `6a9e08900669385587f75a2a` |
| `TRELLO_LIST_IN_PROGRESS` | `6a9e08900669385587f75a4b` |
| `TRELLO_LIST_REVIEW` | `6a9e08900669385587f75a6b` |
| `TRELLO_LIST_DONE` | `6a9e08900669385587f75a81` |

| Evento GitHub | Efecto Trello |
|---|---|
| Issue abierto / reabierto | Crea card en **CÓDIGO · Por hacer** (o usa la card si el issue ya trae `trello.com/c/...`) |
| PR abierto / reabierto / ready | Crea o reutiliza card, mueve a **En progreso**, adjunta el PR |
| PR a draft | Mueve a backlog de código |
| PR mergeado | Mueve a **Producción** |
| Issue cerrado | Mueve a **Producción** |
| Run workflow (manual) | Solo prueba key/token y lista columnas |

Si el PR o issue incluye `https://trello.com/c/XXXX`, **no duplica** la card: comenta y mueve esa.

Probar: GitHub → Actions → **Trello sync** → Run workflow.

PRs desde un **fork** no reciben secrets; use una rama del mismo repo.

---

## 7. Funcionalidades de la API REST

### 7.1 Lo que este repo ya cubre

| Acción | CLI | Actions | API |
|---|---|---|---|
| Probar login | `trello-setup.cmd` | Run workflow | `GET /members/me` |
| Listar columnas | `lists` | al sincronizar | `GET /boards/{id}/lists` |
| Listar cards | `cards` | — | `GET /boards/{id}/cards` |
| Crear card | — | issue/PR sin enlace Trello | `POST /cards` |
| Mover de columna | `move` | según evento | `PUT /cards/{id}` `idList` |
| Comentar | `comment` | cada sync | `POST /cards/{id}/actions/comments` |
| Adjuntar URL (PR) | — | sí | `POST /cards/{id}/attachments` |

### 7.2 Lo que la API permite y el CLI aún no envuelve

Se puede hacer con curl (sección 8) o pidiendo al agente que llame el endpoint. Referencia: [REST API](https://developer.atlassian.com/cloud/trello/rest/).

| Recurso | Qué se puede hacer |
|---|---|
| **Boards** | Leer tablero, miembros, labels, listas, cards |
| **Lists** | Crear columna, archivar lista, reordenar |
| **Cards** | Crear, renombrar, descripción, due date, archivar, copiar, mover de tablero |
| **Labels** | Crear color/nombre, pegar/quitar en una card |
| **Members** | Asignar o quitar personas de una card |
| **Checklists** | Crear checklist, ítems, marcar done |
| **Comments / actions** | Comentar, leer historial |
| **Attachments** | URL o archivo en la card |
| **Search** | `GET /search?query=HU-04&idBoards=...` |
| **Webhooks** | Trello avisa a una URL cuando se mueve una card (útil si más adelante se quiere sync inverso) |

Límites: ~300 requests / 10 s por token. Preferir webhooks a polling. Ver [rate limits](https://developer.atlassian.com/cloud/trello/guides/rest-api/rate-limits/).

No hace falta el **Secret** del Power-Up salvo OAuth 1.0 clásico.

---

## 8. Ejemplos curl

En PowerShell use `curl.exe` (si escribe `curl` a secas, Windows lo convierte en `Invoke-WebRequest`).

No deje key/token en el historial de un PC compartido. Ejemplo local:

```bat
set KEY=su_key
set TOKEN=su_token
set BOARD=6a9e087c0669385587f73ae5
```

Quién soy

```bat
curl.exe "https://api.trello.com/1/members/me?key=%KEY%&token=%TOKEN%"
```

Listas

```bat
curl.exe "https://api.trello.com/1/boards/%BOARD%/lists?filter=open&fields=name&key=%KEY%&token=%TOKEN%"
```

Crear card en CÓDIGO · Por hacer

```bat
curl.exe -X POST "https://api.trello.com/1/cards?key=%KEY%&token=%TOKEN%" --data "idList=6a9e08900669385587f75a2a" --data "name=HU-99 Login offline" --data "desc=Como cajero quiero..."
```

Mover card (reemplace `CARD_ID`)

```bat
curl.exe -X PUT "https://api.trello.com/1/cards/CARD_ID?key=%KEY%&token=%TOKEN%" --data "idList=6a9e08900669385587f75a4b"
```

Comentar

```bat
curl.exe -X POST "https://api.trello.com/1/cards/CARD_ID/actions/comments?key=%KEY%&token=%TOKEN%" --data "text=Implementado en Cursor. Falta QA en POS."
```

Fecha de vencimiento

```bat
curl.exe -X PUT "https://api.trello.com/1/cards/CARD_ID?key=%KEY%&token=%TOKEN%" --data "due=2026-09-15T18:00:00.000Z"
```

Asignarse (id del miembro: `GET /members/me`)

```bat
curl.exe -X POST "https://api.trello.com/1/cards/CARD_ID/idMembers?key=%KEY%&token=%TOKEN%" --data "value=MEMBER_ID"
```

Labels del tablero y pegar una a la card

```bat
curl.exe "https://api.trello.com/1/boards/%BOARD%/labels?key=%KEY%&token=%TOKEN%"
curl.exe -X POST "https://api.trello.com/1/cards/CARD_ID/idLabels?key=%KEY%&token=%TOKEN%" --data "value=LABEL_ID"
```

Checklist

```bat
curl.exe -X POST "https://api.trello.com/1/checklists?key=%KEY%&token=%TOKEN%" --data "idCard=CARD_ID" --data "name=DoD"
curl.exe -X POST "https://api.trello.com/1/checklists/CHECKLIST_ID/checkItems?key=%KEY%&token=%TOKEN%" --data "name=Prueba en POS"
```

Archivar card

```bat
curl.exe -X PUT "https://api.trello.com/1/cards/CARD_ID?key=%KEY%&token=%TOKEN%" --data "closed=true"
```

Buscar

```bat
curl.exe "https://api.trello.com/1/search?query=HU-04&modelTypes=cards&idBoards=%BOARD%&key=%KEY%&token=%TOKEN%"
```

Auth alternativa (misma key+token): header `Authorization: OAuth oauth_consumer_key="KEY", oauth_token="TOKEN"`. Ver [intro API](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/).

---

## 9. Alta inicial (key, token, secrets)

### Power-Up vacío (solo para emitir la Key)

No es el Power-Up de GitHub.

1. Cuenta **miembro** del tablero Capstone.
2. [trello.com/apps/admin](https://trello.com/apps/admin) → New Power-Up.
3. Nombre `D-PAY GitHub Sync`. Iframe: `https://trello.com`.
4. Pestaña **API Key** → Generate.

### Token

URL de la sección 1 → Allow → copiar token (`ATTA...` vale).

### Probar en el PC

```bat
cd E:\dpay\dpay_3.0
scripts\trello-setup.cmd
```

Debe decir `OK Usuario` y `OK Tablero: D-PAY 3.0`.

### Secrets en GitHub

**Secrets** (candado), no Variables. Nombres de la sección 6.

Borre cualquier `TRELLO_*` que haya creado en Variables: queda visible.

### Subir el código a `main`

Hace falta que existan en el remoto:

- `.github/workflows/trello-sync.yml` (GitHub exige esta ruta en la raíz)
- `codigo/scripts/trello_sync.py`
- `codigo/scripts/trello.py`, `codigo/scripts/trello.cmd`, `codigo/scripts/trello-setup.cmd`
- `codigo/docs/TRELLO.md`
- `codigo/.env.trello.example` (si existe)

Luego Actions → Trello sync → Run workflow.

---

## 10. Archivos del repo

| Archivo | Rol |
|---|---|
| `codigo/docs/TRELLO.md` | Este manual |
| `.github/workflows/trello-sync.yml` | Action (solo en raíz por GitHub) |
| `codigo/scripts/trello_sync.py` | Sync issue/PR → Trello |
| `codigo/scripts/trello.py` | CLI diario |
| `codigo/scripts/trello.cmd` | Lanzador Windows del CLI |
| `codigo/scripts/trello-setup.cmd` | Prueba key/token y muestra ids |
| `codigo/.env.trello.example` | Plantilla |
| `codigo/.env.trello` | Credenciales locales (**no se commitea**) |

---

## 11. Errores frecuentes

| Síntoma | Causa / qué hacer |
|---|---|
| El `.ps1` abre el Bloc de notas | Use `scripts\trello-setup.cmd` |
| `<-` / encoding raro en setup | Ya corregido; use el `.cmd` actual |
| HTTP 400 HTML de Atlassian | URL mal armada o parámetros raros; el CLI usa `curl.exe` |
| “TOKEN INCORRECTO ATTA” | Mensaje viejo. `ATTA` de `trello.com/1/authorize` **sí vale** |
| 401 invalid token | Token revocado, de otra key, o secreto del Power-Up pegado por error |
| 401 unauthorized board | Esa cuenta no es miembro del tablero |
| Actions no ve los valores | Están en **Variables**; páselos a **Secrets** |
| Card en la columna incorrecta | Revisar ids `TRELLO_LIST_*` |
| Varias cards coinciden | Use un texto más único (`HU-04`, no `login`) |
| Faltan credenciales en CLI | Crear `.env.trello` en la raíz |
| Power-Up GitHub no lista el repo | Irrelevante; esta integración no lo usa |
| PR de fork no sincroniza | Secrets no se exponen a forks |

Revocar token: [trello.com/my/account](https://trello.com/my/account) → Applications.
