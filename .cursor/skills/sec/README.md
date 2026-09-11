# Skills Sec — D-PAY 3.0 (proyecto)

Skills de **dominio de seguridad** para el repositorio `dpay_3.0`. Complementan skills globales en `~/.cursor/skills/sec/` y rules en `.cursor/rules/`.

## Instalación local (no git)

```powershell
cd C:\Users\NEKODev\Documents\CAPSTONE\sec-skills-framework
.\install-project-dpay.ps1 -TargetRepo "C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0"
```

`.cursor/skills/` está en `.gitignore` — solo en tu máquina.

## Skills incluidos

| Skill | Uso |
|---|---|
| `dpay-payment-security` | PCI, Webpay, TUU, PaymentGateway, archivos críticos |
| `dpay-rnf-security-gate` | Checklist pre-merge / demo (`/dpay-rnf-security-gate`) |

## Dependencias globales

```powershell
.\install-global.ps1
```

## Flujo típico Fase 2

1. Diseño pasarela → `sec-threat-model` + `dpay-payment-security`
2. Desarrollo → `sec-secure-coding` + `sec-secrets-hygiene`
3. PR → `sec-pr-review` + `/review-security`
4. Pre-merge → `dpay-rnf-security-gate`
